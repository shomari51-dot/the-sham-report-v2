const {MongoClient}=require('mongodb');
let client;
const message="Refusing to write to production database 'tsrcms' on a non-production deployment. Configure MONGODB_DB=tsrcms_preview.";
function isWritableEnv(env=process.env) {
  const uri=String(env.MONGODB_URI || '');
  const local=/^mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?(?:localhost|127\.0\.0\.1)(?::\d+)?(?:[/?]|$)/i.test(uri);
  return local || !!(env.MONGODB_DB && env.MONGODB_DB !== 'tsrcms') || (env.VERCEL_ENV === 'production' && env.ALLOW_PROD_DB_WRITES === 'true');
}
function assertWritableDb(env=process.env) {if(!isWritableEnv(env)) throw Object.assign(new Error(message),{statusCode:409,code:'PROD_DB_WRITE_BLOCKED'});}
const mutations=new Set(['insertOne','insertMany','updateOne','updateMany','replaceOne','deleteOne','deleteMany','findOneAndUpdate','findOneAndReplace','findOneAndDelete','bulkWrite','drop']);
function protectDb(db) {return new Proxy(db,{get(target,key){if(key==='collection') return name=>{const col=target.collection(name);return new Proxy(col,{get(c,k){if(mutations.has(k)) return ()=>assertWritableDb({});const v=c[k];return typeof v==='function'?v.bind(c):v;}});};const v=target[key];return typeof v==='function'?v.bind(target):v;}});}
async function getDb() {
  if (!client) {
    client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:6000});
    try {await client.connect();} catch(e) {client=undefined;throw e;}
  }
  const db=client.db(process.env.MONGODB_DB || 'tsrcms');
  return isWritableEnv()?db:protectDb(db);
}
async function close() {if(client)await client.close();client=undefined;}
module.exports={getDb,close,isWritableEnv,assertWritableDb,protectDb};
