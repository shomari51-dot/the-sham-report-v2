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
  for(const [type,bounds] of [['weekly',[48,40,32]],['series',[85,65,50]]]) {
    bounds.forEach((score,i)=>{
      const r=grading.recompute({type,score,tier:99,grade:'Z',base:'Z',buyin:999});
      assert.equal(r.base,'ABCD'[i]);assert.equal(r.grade,'ABCD'[i]+'−');
      assert.notEqual(grading.recompute({type,score:score-0.001}).base,r.base);
    });
  }
  assert.equal(grading.recompute({type:'weekly',score:73}).grade,'A+');
  assert.equal(grading.recompute({type:'series',score:73}).grade,'B');
  assert.equal(grading.recompute({event_type:'major',score:73}).tier,3);
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
  let doc=await db.collection('grades').findOne({id:'endpoint'});assert.equal(doc.grade,'B');assert.equal(doc.tier,3);assert.equal(doc.custom,'retain');assert.equal(doc.history.length,1);
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

test('production write policy allows only explicit isolation, loopback or production opt-in',()=>{
 const {isWritableEnv,assertWritableDb,protectDb}=require('../lib/db');
 const blocked={MONGODB_URI:'mongodb+srv://cluster.example/tsrcms',MONGODB_DB:'tsrcms',VERCEL_ENV:'preview'};
 for(const env of [{},blocked,{...blocked,ALLOW_PROD_DB_WRITES:'true'},{...blocked,VERCEL_ENV:'production'},{...blocked,MONGODB_URI:'mongodb://localhost.evil/tsrcms'}]){
  assert.equal(isWritableEnv(env),false);assert.throws(()=>assertWritableDb(env),e=>e.statusCode===409&&e.code==='PROD_DB_WRITE_BLOCKED'&&e.message.includes('MONGODB_DB=tsrcms_preview'));
 }
 for(const env of [{...blocked,MONGODB_URI:'mongodb://127.0.0.1:1234/test'},{...blocked,MONGODB_URI:'mongodb://localhost:1234/test'},{...blocked,MONGODB_DB:'tsrcms_preview'},{...blocked,VERCEL_ENV:'production',ALLOW_PROD_DB_WRITES:'true'}]){assert.equal(isWritableEnv(env),true);assert.doesNotThrow(()=>assertWritableDb(env));}
 const collection={find(){return this;},name:'grades'};const db=protectDb({collection:()=>collection});assert.equal(db.collection('grades').find(),collection);
 for(const method of ['insertOne','insertMany','updateOne','updateMany','replaceOne','deleteOne','deleteMany','findOneAndUpdate','findOneAndReplace','findOneAndDelete','bulkWrite','drop'])assert.throws(()=>db.collection('grades')[method]({}),{code:'PROD_DB_WRITE_BLOCKED'});
});
test('preview API mutations return 409 before any database connection',async()=>{
 const keys=['MONGODB_URI','MONGODB_DB','VERCEL_ENV','ALLOW_PROD_DB_WRITES'];const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
 try{Object.assign(process.env,{MONGODB_URI:'mongodb+srv://cluster.example/tsrcms',MONGODB_DB:'tsrcms',VERCEL_ENV:'preview',ALLOW_PROD_DB_WRITES:'false'});
 for(const api of ['grades','articles','content'])for(const method of ['POST','DELETE']){const r=await call(api,req(method,{}, {...admin(),'x-forwarded-for':'write-guard-test'}));assert.equal(r.code,409);assert.equal(r.body.code,'PROD_DB_WRITE_BLOCKED');}
 }finally{for(const k of keys)if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}
});
test('v1.1 version, unified workflow, event classification and separated accounting',()=>{
 for(const methodology_version of ['v1.1','v1.0','tsr-2026.10-curve-by-type'])assert.equal(grading.recompute({type:'series',score:73,methodology_version}).methodology_version,'v1.1');
 for(const status of ['Imported','Draft','Needs Verification','Ready for Review','Approved','Published','Archived','published','draft','needs_review','retracted','superseded']){const n=grading.recompute({type:'series',score:73,status});assert.equal(n.status,status);assert.ok(['Imported','Draft','Needs Verification','Ready for Review','Approved','Published','Archived'].includes(n.editorial_status));}
 for(const [event_type,tier] of [['weekly',1],['series',2],['major',3],['unknown',null]]){const n=grading.recompute({event_type,score:73,buyin:10});assert.equal(n.tier,tier);if(!tier){assert.equal(n.grade,null);assert.equal(n.editorial_status,'Needs Verification');}}
 const parts={total:400,fee:70,addons:[{cost:20,chips:10000,fee:0}],reentry_rules:'Unlimited during registration',guarantee:100000,actual_prize_pool:120000,entries:400,unique_players:240};
 assert.deepEqual(grading.normalizeBuyin({buyin_parts:parts}),{...parts,prize_pool:330});
});
test('experience and publisher approval never affect score; unverified takes cannot publish',()=>{
 const base={event_type:'series',score:73,buyin:300};
 const experience_record={attendance_status:'played',verified_by_publisher:true,ratings:{room_atmosphere:4},freeform_notes:'Recorded firsthand notes',recorded_at:'2026-10-22',recorded_by:'Shomari Williams'};
 const shams_take={status:'Published',ai_draft:'Draft',edited_text:'Reviewed personal assessment',approved_by:'Shomari Williams',approved_at:'2026-10-22T12:00:00Z',history:[]};
 for(const status of ['Approved','Published'])for(const invalid of [{attendance_status:'not_attended',verified_by_publisher:true},{attendance_status:'played',verified_by_publisher:false}])assert.throws(()=>grading.recompute({...base,experience_record:{...experience_record,...invalid},shams_take:{...shams_take,status}}),e=>e instanceof TypeError&&e.message==="Sham's Take requires verified firsthand experience (played, attended, or observed) and publisher approval");
 for(const attendance_status of ['played','attended','observed']){const n=grading.recompute({...base,experience_record:{...experience_record,attendance_status},shams_take});assert.equal(n.score,73);assert.equal(n.grade,'A+');assert.deepEqual(grading.publicAnalysisLabel(n),{heading:"Sham's Take",badge:'Verified firsthand experience · Approved by Shomari Williams',text:shams_take.edited_text});}
 assert.equal(grading.publicAnalysisLabel(base).heading,'Data-Based Structure Analysis');
 assert.equal(grading.publicAnalysisLabel({...base,experience_record,shams_take:{...shams_take,status:'Draft'}}).heading,'Data-Based Structure Analysis');
 for(const patch of [{edited_text:''},{approved_by:null},{approved_at:null},{approved_by:'Other editor'}])assert.throws(()=>grading.recompute({...base,experience_record,shams_take:{...shams_take,...patch}}),TypeError);
 assert.throws(()=>grading.recompute({...base,experience_record:{...experience_record,ratings:{dealer_quality:8}}}),TypeError);
});
test('Facebook import validates full fixture, preserves original text verbatim and restricts workflow',()=>{
 const {createImport,required}=require('../lib/fb-import');const sample=require('./fixtures/fb-import-lodge-mar11.json'),original=require('./fixtures/articles.json').find(a=>a.slug==='the-lodge-raid-first-reaction-march-11-2026').original_post_text;
 const result=createImport(sample);assert.equal(result.original_post_text,original);assert.equal(result.status,'draft');assert.equal(result.editorial_status,'Ready for Review');assert.equal(result.original_post_sha256.length,64);
 result.original_post_text='mutated';assert.equal(result.original_post_text,original);
 assert.throws(()=>createImport({...sample,original_post_text:'changed'},result),/immutable/);
 for(const field of required){const copy=structuredClone(sample);delete copy[field];assert.throws(()=>createImport(copy),TypeError);}
 for(const editorial_status of ['Published','Approved','Draft','Archived'])assert.throws(()=>createImport({...sample,editorial_status}),TypeError);
 assert.throws(()=>createImport({...sample,fact_verification_flags:[{claim:'Unresolved',status:'needs_verification',source:'Original source',note:''}]}),TypeError);
 assert.throws(()=>createImport({...sample,outdated_info_flags:[{original_statement:'Closed',current_status:'Reopened',editorial_note:''}]}),TypeError);
 assert.equal(createImport({...sample,editorial_status:'Needs Verification',fact_verification_flags:[{claim:'Unresolved',status:'needs_verification',source:'Original source',note:''}]}).editorial_status,'Needs Verification');
 for(const patch of [{image_rights:{...sample.image_rights,permission_status:'unknown'}},{seo:{}},{fb_source_url:'https://evil.example/post'},{author:'Invented author'},{original_fb_date:'invalid'}])assert.throws(()=>createImport({...sample,...patch}));
});
test('public pages remove unverified navigation, social links, mailboxes and fictional content',()=>{
 const fs=require('node:fs'),vm=require('node:vm');const read=p=>fs.readFileSync(p,'utf8');
 for(const file of fs.readdirSync('.').filter(p=>p.endsWith('.html'))){const s=read(file);for(const nav of s.matchAll(/<nav class="c3-nav"[^>]*>([\s\S]*?)<\/nav>/g))assert.doesNotMatch(nav[1],/hosted-games\.html/);assert.doesNotMatch(s,/href=["']mailto:(editor|news|corrections)@/i);assert.doesNotMatch(s,/<a[^>]+href="about.html#social-links"/);}
 for(const file of ['js/concept3-data.js','js/concept3-events.js'])assert.doesNotMatch(read(file),/sample["']?\s*:\s*true|Sample story|sample-weekly-|sample-series-/);
 for(const file of ['index.html','news.html','tournaments.html','js/concept3.js','js/concept3-interior.js'])assert.doesNotMatch(read(file),/Reading the structure sheet|Around the Texas tables|The tournament notebook|Behind the broadcast|The weekly structure notebook/);
 for(const file of ['tsr-score-calculator.html','js/concept3-calculator.js']){assert.match(read(file),/Data-Based Structure Analysis/);assert.doesNotMatch(read(file),/Sham[’']s Take/);}
 const context={window:{}};for(const file of ['js/concept3-config.js','js/concept3-data.js','js/concept3-events.js','js/concept3-hosts.js','js/concept3-regrade.js'])vm.runInNewContext(read(file),context);
 assert.equal(context.window.TSR_CONFIG.features.hostedGamesNav,false);assert.equal(context.window.CONCEPT3_DATA.stories.length,38);assert.equal(context.window.CONCEPT3_DATA.articles.length,36);assert.equal(context.window.CONCEPT3_DATA.grades.length,16);assert.equal(context.window.C3_REGRADE.length,20);
 for(const host of context.window.C3_HOSTS){assert.equal(host.verified,false);assert.equal(host.status,'Needs Verification');}
 for(const score of [69.8,66,46.6])assert.ok(context.window.C3_EVENTS.some(e=>e.score===score&&e.venue==='Champions Club Houston'&&e.tier===3));
 for(const id of ['editorial-standards','independence','methodology','corrections','contact','score-revisions'])assert.ok(read('about.html').includes('id="'+id+'"'));
 assert.doesNotMatch(read('trailblazer-stop-2-kick-off-results.html'),/hour and 35 minutes/);
 assert.match(read('admin/index.html'),/PROD_DB_WRITE_BLOCKED/);assert.match(read('admin/review.js'),/Approve & Publish/);
});

test('public renderers use real articles, correct curve groups and verified host filtering',()=>{
 const fs=require('node:fs'),vm=require('node:vm');const read=f=>fs.readFileSync(f,'utf8');
 function run(ids,files,search=''){
  const nodes=Object.fromEntries(ids.map(id=>[id,{value:'',innerHTML:'',textContent:'',hidden:false,addEventListener(){},reset(){}}]));
  const context={window:{},document:{getElementById:id=>nodes[id]||null},location:{search},URLSearchParams,setTimeout,TSREngine:engine};
  for(const f of files)vm.runInNewContext(read(f),context);
  return {nodes,context};
 }
 let r=run(['lead-stories','latest-stories','grade-rows','media-rows','preview-newsletter'],['js/concept3-data.js','js/concept3.js']);
 assert.match(r.nodes['grade-rows'].innerHTML,/93.9/);assert.match(r.nodes['grade-rows'].innerHTML,/66/);assert.equal((r.nodes['grade-rows'].innerHTML.match(/<tr>/g)||[]).length,4);assert.doesNotMatch(r.nodes['latest-stories'].innerHTML,/Sample/);
 const filters=['search','date','location','venue','game','type','buyin','sort'].map(k=>'event-'+k);
 r=run([...filters,'event-count','event-rows','event-detail','tournament-filters'],['js/concept3-events.js','js/concept3-regrade.js','js/concept3-interior.js']);
 assert.match(r.nodes['event-rows'].innerHTML,/Saddle Up Sunday \$20K GTD/);assert.match(r.nodes['event-rows'].innerHTML,/Curve 3 — \$400\+ & Multi-Day Series \(v1.1\)/);assert.match(r.nodes['event-rows'].innerHTML,/Real Event Archive/);
 assert.match(r.nodes['event-detail'].innerHTML,/Data-Based Structure Analysis/);assert.doesNotMatch(r.nodes['event-detail'].innerHTML,/Sham[’']s Take/);assert.match(r.nodes['event-detail'].innerHTML,/Methodology v1.1 Regrade Preview/);
 r=run(['host-rows','host-detail'],['js/concept3-hosts.js','js/concept3-interior.js']);assert.match(r.nodes['host-rows'].innerHTML,/Verification in Progress/);assert.doesNotMatch(r.nodes['host-rows'].innerHTML,/Rebecca|Aaron/);
 for(const slug of ['the-lodge-raid-first-reaction-march-11-2026','lodge-raid-coverage-tom-dwan-enters-the-chat']){
  r=run(['article-content','main-content'],['js/concept3-data.js','js/concept3-article.js'],'?slug='+slug);
  for(const term of ['Shomari Williams','Editorial Context / Update Note','April 28','Disclosures','Corrections','figcaption'])assert.ok(r.nodes['main-content'].innerHTML.includes(term));
 }
 r=run(['article-content','main-content'],['js/concept3-data.js','js/concept3-article.js']);assert.match(r.nodes['article-content'].innerHTML,/Article not found/);for(const q of ['','?slug=bogus']){r=run(['article-content','main-content'],['js/concept3-data.js','js/concept3-article.js'],q);assert.match(r.nodes['article-content'].innerHTML,/<h1>Article not found<\/h1>/);assert.doesNotMatch(r.nodes['main-content'].innerHTML,/layout specification/i);}
});
test('Facebook import CLI dry run validates without accessing MongoDB',async()=>{
 const {main}=require('../scripts/import-fb-post');let output='';
 const doc=await main(['--dry-run','--input','tests/fixtures/fb-import-lodge-mar11.json'],v=>{output=v;});
 assert.equal(doc.original_post_text,require('./fixtures/articles.json').find(a=>a.slug==='the-lodge-raid-first-reaction-march-11-2026').original_post_text);
 assert.equal(JSON.parse(output).editorial_status,'Ready for Review');
 await assert.rejects(()=>main([],()=>{}),/Usage/);
});
test('calculator uses event type for both grades and withholds all letters for unknown',async()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 for(const [type,buyin,multi_day] of [['weekly',200,false],['series',399.99,false],['series',400,false],['series',300,true],['major',200,false],['unknown',200,false]]){
  const nodes={};const get=id=>nodes[id]||(nodes[id]={value:'',innerHTML:'',textContent:'',hidden:false,validity:{valid:true},addEventListener(){},focus(){}});
  for(const [k,v] of Object.entries({buyin:'200',fees:'20',stack:'30000',levelLen:'30',structure:inputs.levels.map(l=>`${l.sb} / ${l.bb} / ${l.ante}`).join('\n'),fmt:'nlh'}))get(k).value=v;
  get('score-form').elements={curve:{value:type}};get('buyin').value=String(buyin);get('multi_day').checked=multi_day;
  vm.runInNewContext(fs.readFileSync('js/concept3-calculator.js','utf8'),{document:{getElementById:get},TSREngine:engine,location:{hash:''},URLSearchParams,setTimeout:fn=>fn()});
  await get('score-form').onsubmit({preventDefault(){}});
  const html=get('score-result').innerHTML;assert.equal(get('score-result').hidden,false);assert.match(html,/Methodology: v1.1 \(3-Curve A–D Scale\)/);assert.match(html,/Data-Based Structure Analysis/);
  if(type==='unknown'){assert.match(html,/No letter grade/);assert.doesNotMatch(html,/Base score \/ grade<\/dt><dd>[^<]* \/ [ABCDF]/);}
  else assert.ok(html.includes((type==='weekly'?'Curve 1 — Weekly Recurring':type==='series'&&buyin<400&&!multi_day?'Curve 2 — Sub-$400 Single-Day Series':'Curve 3 — $400+ & Multi-Day Series')+' curve'));
  assert.equal(get('prize_pool').value,buyin-20);
 }
});

test('strict single-day price split, explicit fallback and unknown review',()=>{
 for(const [doc,curve,tier] of [
  [{event_type:'series',buyin:399.99},'series_under_400',2],
  [{event_type:'series',buyin:400},'series',3],
  [{event_type:'series',buyin:300,multi_day:true},'series',3],
  [{event_type:'series',curve:'series_under_400'},'series_under_400',2],
  [{event_type:'series'},'series',3],
  [{event_type:'weekly',buyin:999,multi_day:true},'weekly',1],
  [{event_type:'major',buyin:1},'series',3],
  [{event_type:'unknown',curve:'weekly'},null,null]
 ]){const r=grading.recompute({...doc,score:73});assert.equal(r.curve,curve);assert.equal(r.tier,tier);assert.equal(r.multi_day,Boolean(doc.multi_day));}
 for(const [tier,score] of [[1,23.99],[2,24.99],[3,39.99]])for(const n of [0,-100,10,score])assert.deepEqual(engine.letterFor(n,tier),{letter:'D−',base:'D'});
});
test('all sixteen approved examples match engine, backend and both published datasets',()=>{
 const examples=[['Even Bigger One $250K GTD',300,73,'A+'],['$300 Mega Stack',300,51.4,'B+'],['Send Off',200,48.2,'B'],['$200 Lone Star Stand-Off',200,48.2,'B'],['$300 2-7 Single Draw',300,46.7,'B−'],['Donkey Derby $200',200,40.2,'C'],["Randy's Six Shooter $250",250,39.2,'C'],['Lone Star PLO',300,29,'D'],['$150 Deepstack',150,29,'D'],['$2,500 NLH High Roller',2500,93.9,'A'],['MAIN EVENT',600,81.4,'B+'],['RunGood Monster Stack Opener',400,69.8,'B−'],['RunGood Main Event',600,66,'B−'],['$400 Big Tex Giant Stack',400,51.4,'C−'],['$400 Kick Off',400,48.2,'D+'],['RunGood PokerNews PowerStack',400,46.6,'D+']];
 const fs=require('node:fs'),vm=require('node:vm'),ctx={window:{}};
 for(const f of ['events','regrade'])vm.runInNewContext(fs.readFileSync('js/concept3-'+f+'.js','utf8'),ctx);
 for(const [name,buyin,score,grade]of examples){const r=grading.recompute({event_type:'series',buyin,score});assert.equal(r.grade,grade,name);assert.equal(engine.letterFor(score,r.tier).letter,grade);for(const rows of [ctx.window.C3_EVENTS,ctx.window.C3_REGRADE]){const row=rows.find(e=>e.name===name);assert.ok(row,name);assert.equal(row.grade,grade,name);assert.equal(row.score,score);assert.equal(row.tier,r.tier);}}
 assert.equal(grading.recompute({event_type:'series',buyin:300,score:73,multi_day:true}).grade,'B');
});

test('migration rejects production database before accessing collections',async()=>{
 await assert.rejects(require('../scripts/migrate-grades-v2').migrate({databaseName:'tsrcms',collection(){throw Error('Must not access production');}}),e=>e.code==='PROD_DB_WRITE_BLOCKED');
});

test('Part 1 through Part 7 Facebook imports (all 33 fixtures) validate, render with images and FB permalinks, and maintain newest-first chronological order across the site',()=>{
 const {createImport}=require('../lib/fb-import');
 const fs=require('node:fs'),vm=require('node:vm');
 const files=['fb-import-1-lodge-mar11.json','fb-import-2-lodge-tom-dwan-mar12.json','fb-import-3-lodge-tabc-irs-mar12.json','fb-import-4-lodge-doug-polk-gray-area-mar13.json','fb-import-5-lodge-community-aml-kyc-mar14.json','fb-import-6-shuffle-214-100k-recap-mar14.json','fb-import-7-andrew-neeme-reaction-mar16.json','fb-import-8-lodge-no-affidavit-doug-polk-mar16.json','fb-import-9-shuffle-214-hand-highlights-mar17.json','fb-import-10-lodge-tabc-affidavit-undercover-agents-mar17.json','fb-import-11-st-patricks-day-green-beer-poker-mar17.json','fb-import-12-table-selection-5-10-crushers-mar18.json','fb-import-13-poker-house-fort-worth-livestream-mar19.json','fb-import-14-what-is-selective-enforcement-apr20.json','fb-import-15-harvey-castro-143k-lodge-raid-apr21.json','fb-import-16-wsop-circuit-tch-austin-901-players-apr24.json','fb-import-17-champions-social-club-first-look-apr26.json','fb-import-18-kk-vs-jj-vs-88-palace-poker-apr28.json','fb-import-19-lodge-comeback-win-for-texas-poker-apr29.json','fb-import-20-poker-house-ft-worth-25k-day2-bag-may01.json','fb-import-21-big-o-game-1am-poker-house-may03.json','fb-import-22-developing-lodge-reopening-rumors-may03.json','fb-import-23-tch-dallas-plo-madness-187-entries-may04.json','fb-import-24-isaac-trumbo-champions-soft-opening-may06.json','fb-import-25-dallas-poker-co-wars-500k-may08.json','fb-import-26-the-lodge-back-in-business-may12.json','fb-import-27-the-sham-report-real-home-may13.json','fb-import-28-hayden-fortini-booth-champions-sep29.json','fb-import-29-spooky-72-vs-kyle-aa-20k-pot-oct02.json','fb-import-30-kyle-puts-dr-andy-in-the-blender-oct04.json','fb-import-31-wednesday-5-10-stream-hayden-fortini-oct07.json','fb-import-32-amy-vs-jb-10400-pot-champions-oct10.json','fb-import-33-wolfgang-pocket-deuces-set-champions-oct11.json'];
 for(const f of files){
  const doc=createImport(require('./fixtures/'+f));
  assert.equal(doc.editorial_status,'Ready for Review');
  assert.match(doc.fb_post_id,/^(pfbid|reel-)/);
  assert.match(doc.fb_source_url,/^https:\/\/facebook\.com\/(100000259835379\/posts\/pfbid|reel\/)/);
  assert.ok(fs.existsSync(doc.image_rights.image_path),doc.image_rights.image_path);
 }
 const slugs=['wolfgang-flops-a-set-with-pocket-deuces-champions-social-club-dallas-october-11-2026','amy-vs-jb-10400-pot-no-backing-down-champions-social-club-dallas-october-10-2026','wednesday-night-5-10-nlh-stream-booth-hayden-fortini-champions-dallas-october-7-2026','kyle-puts-dr-andy-in-the-blender-kj-vs-a4-15k-pot-champions-social-club-dallas-october-4-2026','spooky-72-vs-kyle-aa-wild-20k-pot-champions-club-live-october-2-2026','in-the-booth-with-coach-hayden-fortini-champions-social-club-1-3-stream-september-29-2026','the-sham-report-is-getting-a-real-home-texas-poker-media-destination-may-13-2026','the-lodge-card-club-is-back-in-business-round-rock-reopening-may-12-2026','dallas-blessed-poker-rooms-spent-500000-trying-to-shut-them-down-may-8-2026','isaac-trumbo-sit-down-champions-social-club-soft-opening-may-6-2026','tch-dallas-plo-madness-187-entries-46750-prize-pool-18th-place-may-4-2026','developing-lodge-card-club-reopening-announcement-rumors-austin-may-3-2026','big-o-game-broke-out-1am-before-day-2-poker-house-may-3-2026','one-bullet-210000-chips-bagging-day-2-poker-house-fort-worth-25k-gtd-may-1-2026','whether-you-like-doug-polk-or-not-lodge-comeback-win-for-texas-poker-april-29-2026','kk-at-it-again-kk-vs-jj-vs-88-three-way-all-in-palace-poker-april-28-2026','champions-social-club-first-look-dfw-poker-room-founding-member-april-26-2026','wsop-circuit-texas-card-house-austin-901-players-first-lone-star-ring-april-24-2026','harvey-castro-won-143000-at-the-lodge-raided-next-day-april-21-2026','what-is-selective-enforcement-texas-poker-rooms-april-20-2026','running-good-poker-house-fort-worth-livestream-plo-congress-march-19-2026','table-selection-5-10-crushers-wolfgang-brad-benji-scott-amy-march-18-2026','green-beer-and-poker-st-patricks-day-dfw-march-17-2026','tabc-affidavit-undercover-agents-lodge-card-club-march-17-2026','shuffle-214-100k-hand-highlights-ak-vs-kj-all-in-march-17-2026','no-affidavit-lodge-card-club-due-process-doug-polk-march-16-2026','andrew-neeme-reaction-lodge-coverage-poker-vlogging-pioneer-march-16-2026','shuffle-214-100k-series-recap-five-bullets-tournament-variance-march-2026','lodge-raid-community-context-aml-kyc-compliance-march-14-2026','lodge-raid-commentary-doug-polk-texas-poker-gray-area-march-13-2026','lodge-raid-update-tabc-financial-crimes-irs-march-12-2026','lodge-raid-coverage-tom-dwan-enters-the-chat','the-lodge-raid-first-reaction-march-11-2026'];
 for(const slug of slugs){
  const nodes={'article-content':{innerHTML:''},'main-content':{innerHTML:''}};
  const context={window:{},document:{getElementById:id=>nodes[id]||null},location:{search:'?slug='+slug},URLSearchParams};
  vm.runInNewContext(fs.readFileSync('js/concept3-data.js','utf8'),context);
  vm.runInNewContext(fs.readFileSync('js/concept3-article.js','utf8'),context);
  assert.match(nodes['main-content'].innerHTML,/View original post on Facebook/);
  if(slug==='shuffle-214-100k-series-recap-five-bullets-tournament-variance-march-2026'){
   assert.match(nodes['main-content'].innerHTML,/images\/2026-03-14_2\.jpg/);
   assert.match(nodes['main-content'].innerHTML,/images\/2026-03-13_2\.jpg/);
  }
 }
 // Verify strict newest-first chronological ordering across stories, articles, reels, and FB imports
 const ctx={window:{}};
 for(const f of ['js/concept3-data.js','js/concept3-reels.js','js/concept3-import-review.js','js/concept3-events.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),ctx);
 const checkNewestFirst=(arr,label)=>{
  for(let i=1;i<arr.length;i++){
   const prev=Date.parse(arr[i-1].original_fb_date||arr[i-1].date),curr=Date.parse(arr[i].original_fb_date||arr[i].date);
   assert.ok(prev>=curr,`${label} out of newest-first order at index ${i}: ${arr[i-1].date||arr[i-1].original_fb_date} before ${arr[i].date||arr[i].original_fb_date}`);
   if(prev===curr && arr[i-1].seq!=null && arr[i].seq!=null)assert.ok(arr[i-1].seq>arr[i].seq,`${label} same-day tie-breaker out of order at index ${i}`);
  }
 };
 checkNewestFirst(ctx.window.CONCEPT3_DATA.stories,'CONCEPT3_DATA.stories');
 checkNewestFirst(ctx.window.CONCEPT3_DATA.articles,'CONCEPT3_DATA.articles');
 checkNewestFirst(ctx.window.CONCEPT3_DATA.reels,'CONCEPT3_DATA.reels');
 checkNewestFirst(ctx.window.C3_REELS,'C3_REELS');
 checkNewestFirst(ctx.window.C3_FB_IMPORTS,'C3_FB_IMPORTS');
 checkNewestFirst(require('./fixtures/articles.json'),'fixtures/articles.json');
 checkNewestFirst(ctx.window.C3_EVENTS.filter(e=>e.date),'C3_EVENTS dated');
 if(ctx.window.C3_ARCHIVE_EVENTS)checkNewestFirst(ctx.window.C3_ARCHIVE_EVENTS.filter(e=>e.date),'C3_ARCHIVE_EVENTS dated');
 // Verify QA-017: admin/bulk-publish.html EVENTS are newest-first and match v1.1 grades
 const bpHtml=fs.readFileSync('admin/bulk-publish.html','utf8');
 const bpCtx={};vm.runInNewContext(bpHtml.slice(bpHtml.indexOf('var EVENTS ='),bpHtml.indexOf('];',bpHtml.indexOf('var EVENTS ='))+2),bpCtx);
 assert.equal(bpCtx.EVENTS.length,13);
 checkNewestFirst(bpCtx.EVENTS,'admin/bulk-publish.html EVENTS');
 assert.equal(bpCtx.EVENTS[0].name,'Send Off');assert.equal(bpCtx.EVENTS[0].grade,'B');assert.equal(bpCtx.EVENTS[0].tier,2);
 // Verify QA-018: seq 8 context includes March 17 affidavit release, seq 12 disclosures reference TCH Dallas, and fixtures/articles.json body matches concept3-data.js
 const seq8=ctx.window.CONCEPT3_DATA.articles.find(a=>a.slug==='no-affidavit-lodge-card-club-due-process-doug-polk-march-16-2026');
 assert.match(seq8.context,/March 17, 2026/);
 const seq12=ctx.window.CONCEPT3_DATA.articles.find(a=>a.slug==='trailblazer-stop-2-kick-off-results');
 assert.match(seq12.disclosures,/Texas Card House Dallas/);
 const seq1=ctx.window.CONCEPT3_DATA.articles.find(a=>a.slug==='the-lodge-raid-first-reaction-march-11-2026');
 const fixSeq1=require('./fixtures/articles.json').find(a=>a.slug==='the-lodge-raid-first-reaction-march-11-2026');
 assert.equal(fixSeq1.body,seq1.body);
 // Verify QA-002..QA-014 invariants: 404.html exists, zero href="#", skip links & <main id="main-content"> on all public HTML pages
 assert.ok(fs.existsSync('404.html'),'404.html must exist');
 for(const htmlFile of fs.readdirSync('.').filter(p=>p.endsWith('.html'))){
  const html=fs.readFileSync(htmlFile,'utf8');
  assert.doesNotMatch(html,/href=["']#["']/,'No dead href="#" in '+htmlFile);
  assert.match(html,/<main id="main-content"/,'<main id="main-content"> required in '+htmlFile);
  assert.match(html,/class="c3-skip" href="#main-content"/,'Skip link required in '+htmlFile);
 }
});
