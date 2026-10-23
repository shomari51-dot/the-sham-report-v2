process.env.MONGOMS_RUNTIME_DOWNLOAD='false';
const cachedBinary=require('node:path').resolve('node_modules/.cache/mongodb-memory-server/mongod-x64-debian-7.0.24');
if (!process.env.MONGOMS_SYSTEM_BINARY && require('node:fs').existsSync(cachedBinary)) process.env.MONGOMS_SYSTEM_BINARY=cachedBinary;
const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {MongoMemoryServer}=require('mongodb-memory-server');
const {MongoClient}=require('mongodb');
const grading=require('../lib/grading');
const engine=require('../assets/tsr-engine');
const auth=require('../lib/auth');
const fixture=require('./fixtures/grades.json').grades;
let server,client,db;
process.env.ADMIN_SECRET='test-signing-key';process.env.ADMIN_PASSWORD='test-password';
function req(method,body={},headers={},query={}) {return {method,body,headers,query,socket:{remoteAddress:'127.0.0.1'}};}
async function call(name,request) {
  const res={code:200,headers:{},setHeader(k,v){this.headers[k]=v;},status(s){this.code=s;return this;},json(v){this.body=v;return this;},end(){return this;}};
  await require('../api/'+name)(request,res);return res;
}
const origin={origin:'http://localhost:3000'};
const admin=()=>({...origin,authorization:'Bearer '+auth.signToken()});
test('classification explicit, legacy, unknown; no buy-in classification',()=>{
  for(const type of ['weekly','series','major','unknown']) assert.equal(grading.classify({event_type:type,type:'weekly'}),type);
  assert.equal(grading.classify({type:'series'}),'series');
  assert.equal(grading.classify({buyin:1000}),'unknown');
  const r=grading.recompute({score:73,buyin:300});assert.equal(r.status,'needs_review');assert.equal(r.grade,null);assert.equal(r.tier,null);
});
test('buy-in normalization and validation',()=>{
  assert.equal(grading.normalizeBuyin({buyin:150}).total,150);
  assert.equal(grading.normalizeBuyin({}).fee,null);
  assert.equal(grading.normalizeBuyin({buyin_parts:{prize_pool:200,fee:50,total:251}}).total,250);
  for(const parts of [{total:252,prize_pool:200,fee:50},{fee:-1},{entries:'no'},{addons:[{chips:-2}]}]) assert.throws(()=>grading.normalizeBuyin({buyin_parts:parts}),TypeError);
});
test('curve boundaries and client tier/letter ignored',()=>{
  for(const [type,bounds] of [['weekly',[48,40,32,24]],['series',[85,65,50,38]]]) {
    bounds.forEach((score,i)=>{
      const r=grading.recompute({type,score,tier:99,grade:'Z',base:'Z',buyin:999});
      assert.equal(r.base,'ABCD'[i]);assert.equal(r.grade,'ABCD'[i]+'−');
      assert.notEqual(grading.recompute({type,score:score-0.001}).base,r.base);
    });
  }
  assert.equal(grading.recompute({type:'weekly',score:73}).grade,'A+');
  assert.equal(grading.recompute({type:'series',score:73}).grade,'B');
  assert.equal(grading.recompute({event_type:'major',score:73}).tier,2);
});
const inputs={buyin:200,fees:20,stack:30000,levelLen:30,levels:engine.parseStructure(Array.from({length:18},(_,i)=>`${(i+1)*100} ${(i+1)*200} 0`).join('\n')).levels};
test('recalculates inputs and calculator hash; malformed inputs fail',()=>{
  const r=grading.recompute({type:'series',score:999,inputs});
  assert.equal(r.score,engine.grade(inputs).score);assert.equal(r.score_source,'engine');assert.equal(r.grade,engine.letterFor(r.score,2).letter);
  const p=new URLSearchParams({b:200,f:20,s:30000,l:30,v:inputs.levels.map(l=>`${l.sb}-${l.bb}-${l.ante}`).join('_')});
  assert.equal(grading.recompute({type:'weekly',hash:p.toString()}).score,r.score);
  assert.throws(()=>grading.recompute({type:'weekly',hash:'broken',score:2}),TypeError);
});
test('history appends changes, preserves existing fields and is stable',()=>{
  const previous={id:'x',type:'weekly',score:73,custom:'keep'};
  const r=grading.withHistory(previous,previous);assert.equal(r.history.length,1);assert.equal(r.history[0].previous.score,73);assert.equal(r.custom,'keep');
  assert.equal(grading.withHistory(r,r).history.length,1);
  assert.equal(grading.withHistory({...r,score:20},r).history.length,2);
  assert.equal(grading.withHistory({...r,buyin_parts:{...r.buyin_parts,fee:10}},r).history.length,2);
});
test('token sign/verify/expiry/tampering and raw secret rejection',()=>{
  const token=auth.signToken(100);assert.equal(auth.verifyToken(token,101).sub,'admin');
  assert.equal(auth.verifyToken(token,100+28800),null);assert.equal(auth.verifyToken(token+'x',101),null);
  assert.equal(auth.verifyToken(process.env.ADMIN_SECRET),null);
  assert.equal(auth.isAdmin(req('POST',{}, {'x-admin-secret':auth.signToken()})),true);
});
test('origins exact defaults and override; no-origin requires token',()=>{
  for(const o of ['https://www.theshamreport.com','http://localhost:1234','https://the-sham-report-v2-abc-sham-god-media-s-projects.vercel.app'])assert.equal(auth.allowedOrigin(o),true);
  for(const o of ['https://evil.com','https://other.vercel.app','http://localhost:1234.evil.com']) assert.equal(auth.allowedOrigin(o),false);
  process.env.ALLOWED_ORIGINS='https://only.example';assert.equal(auth.allowedOrigin('https://www.theshamreport.com'),false);delete process.env.ALLOWED_ORIGINS;
});
test('rate limiter expires windows',()=>{
  assert.equal(auth.limited('unit',2,100,true,1000),false);assert.equal(auth.limited('unit',2,100,true,1001),false);assert.equal(auth.limited('unit',2,100,true,1002),true);assert.equal(auth.limited('unit',2,100,true,1100),false);
});
test('auth login returns token; failure limiting; origin checks',async()=>{
  let r=await call('auth',req('POST',{password:process.env.ADMIN_PASSWORD},origin));assert.equal(r.code,200);assert.ok(auth.verifyToken(r.body.token));assert.notEqual(r.body.token,process.env.ADMIN_SECRET);
  assert.equal((await call('auth',req('POST',{}, {origin:'https://evil.com'}))).code,403);
  assert.equal((await call('auth',req('POST',{password:process.env.ADMIN_PASSWORD}))).code,401);
  for(let i=0;i<5;i++)assert.equal((await call('auth',req('POST',{password:'bad'},{...origin,'x-forwarded-for':'failure-test'}))).code,401);
  assert.equal((await call('auth',req('POST',{}, {...origin,'x-forwarded-for':'failure-test'}))).code,429);
});
test('all write methods reject raw secret before connecting',async()=>{
  for(const [endpoint,methods] of [['grades',['POST','DELETE']],['articles',['POST','DELETE']],['content',['POST']]])for(const method of methods) {
    assert.equal((await call(endpoint,req(method,{}, {...origin,'x-admin-secret':process.env.ADMIN_SECRET}))).code,401);
    assert.equal((await call(endpoint,req(method,{}, {origin:'https://evil.com',authorization:'Bearer '+auth.signToken()}))).code,403);
  }
});
test('fixture normalization is stable for every migration document',()=>{
  for (const doc of fixture) {
    const next=grading.withHistory(doc,doc,'migration:grades-v2');
    assert.equal(next.history.length,1);
    assert.deepEqual(grading.withHistory(next,next,'migration:grades-v2'),next);
  }
});
test('write rate limit and preflight, expiry, no-origin handling',async()=>{
  const token=auth.signToken();
  const makeRes=()=>({code:200,setHeader(){},status(s){this.code=s;return this;},json(){},end(){}});
  let res=makeRes();assert.equal(auth.guard(req('POST',{}, {authorization:'Bearer '+token}),res),true);
  res=makeRes();assert.equal(auth.guard(req('OPTIONS',{},origin),res),false);assert.equal(res.code,204);
  res=makeRes();assert.equal(auth.guard(req('POST',{}, {...origin,authorization:'Bearer '+auth.signToken(1)}),res),false);assert.equal(res.code,401);
  const headers={...origin,authorization:'Bearer '+token,'x-forwarded-for':'rate-write-unit'};
  for(let i=0;i<60;i++) assert.equal(auth.guard(req('POST',{},headers),makeRes()),true);
  res=makeRes();assert.equal(auth.guard(req('POST',{},headers),res),false);assert.equal(res.code,429);
});
test('memory-server integration', async (t) => {
t.before(async()=>{
  server=await MongoMemoryServer.create();
  process.env.MONGODB_URI=server.getUri();
  process.env.ADMIN_SECRET='test-signing-key';process.env.ADMIN_PASSWORD='test-password';
  client=await MongoClient.connect(server.getUri());db=client.db('tsrcms');
});
t.after(async()=>{await require('../lib/db').close();await client?.close();await server?.stop();});
await t.test('grade endpoint recomputes, preserves fields, appends history and filters status',async()=>{
  let r=await call('grades',req('POST',{id:'endpoint',name:'Test',type:'series',score:73,tier:1,grade:'A+',custom:'retain'},admin()));assert.equal(r.code,200);
  let doc=await db.collection('grades').findOne({id:'endpoint'});assert.equal(doc.grade,'B');assert.equal(doc.tier,2);assert.equal(doc.custom,'retain');assert.equal(doc.history.length,1);
  r=await call('grades',req('POST',{id:'endpoint',name:'Test',status:'draft'},admin()));assert.equal(r.code,200);
  doc=await db.collection('grades').findOne({id:'endpoint'});assert.equal(doc.history.length,2);
  assert.equal((await call('grades',req('GET'))).body.grades.length,0);
  assert.equal((await call('grades',req('GET',{}, {},{include:'all'}))).code,401);
  assert.equal((await call('grades',req('GET',{},admin(),{include:'all'}))).body.grades.length,1);
  await db.collection('grades').insertOne({id:'legacy',score:12});assert.equal((await call('grades',req('GET'))).body.grades.length,1);
});
await t.test('article draft visibility uses token for list and slug',async()=>{
  await db.collection('articles').insertOne({slug:'draft',status:'draft'});
  assert.equal((await call('articles',req('GET',{}, {},{slug:'draft'}))).code,404);
  assert.equal((await call('articles',req('GET',{},admin(),{slug:'draft'}))).code,200);
  assert.equal((await call('articles',req('GET',{}, {'x-admin-secret':process.env.ADMIN_SECRET}))).body.length,0);
});
await t.test('17 grade migration: dry-run zero writes, apply idempotent; duplicates retained',async()=>{
  const preview=client.db('migration_preview');const col=preview.collection('grades');
  assert.equal(fixture.length,17);await col.insertMany(structuredClone(fixture));
  const before=await col.find({}).toArray();const {migrate}=require('../scripts/migrate-grades-v2');
  assert.equal((await migrate(preview,{log:()=>{}})).writes,0);assert.deepEqual(await col.find({}).toArray(),before);
  assert.equal((await migrate(preview,{apply:true,log:()=>{}})).writes,17);
  assert.equal((await migrate(preview,{apply:true,log:()=>{}})).writes,0);
  assert.equal(await col.countDocuments(),17);
  const dup=await col.findOne({id:'g-the-bigger-one-250k-gtd'});assert.equal(dup.status,'published');
});


});
test('preview scripts refuse production targets and require explicit authorization flags',()=>{
  const {target}=require('../scripts/preview-safety');
  const base=['--db-uri-env','PREVIEW_MONGODB_URI','--confirm-preview'];
  assert.throws(()=>target(['--db-uri-env','MONGODB_URI','--confirm-preview'],{}));
  assert.throws(()=>target(base,{PREVIEW_MONGODB_URI:'mongodb://127.0.0.1:27017/tsrcms'}));
  assert.throws(()=>target(base,{PREVIEW_MONGODB_URI:'mongodb://127.0.0.1:27017/preview',MONGODB_DB:'tsrcms'}));
  assert.equal(target([...base,'--db','preview','--allow-db=preview'],{PREVIEW_MONGODB_URI:'mongodb://127.0.0.1:27017/tsrcms',MONGODB_DB:'tsrcms'}).dbName,'preview');
});
