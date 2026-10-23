const {MongoClient} = require('mongodb');
function target(args, env = process.env) {
  const value = key => { const i=args.indexOf(key); return i<0 ? undefined : args[i+1]; };
  const envName = value('--db-uri-env');
  if (!envName || envName === 'MONGODB_URI' || envName !== 'PREVIEW_MONGODB_URI') throw new Error('Use --db-uri-env PREVIEW_MONGODB_URI');
  if (!args.includes('--confirm-preview')) throw new Error('--confirm-preview required');
  const uri = env[envName];
  if (!uri) throw new Error('Preview URI is missing');
  const uriDb = new URL(uri.replace(/^mongodb\+srv:/,'https:').replace(/^mongodb:/,'http:')).pathname.slice(1);
  const dbName = value('--db') || env.MONGODB_DB || uriDb;
  const allow = args.find(a=>a.startsWith('--allow-db='))?.slice(11);
  if (!dbName || dbName === 'tsrcms') throw new Error('Target must differ from tsrcms');
  if ((env.MONGODB_DB === 'tsrcms' || uriDb === 'tsrcms') && (allow !== dbName || allow === 'tsrcms')) throw new Error('Explicit --allow-db=<non-production target> required');
  if (allow && allow !== dbName) throw new Error('--allow-db must match target');
  return {uri,dbName};
}
async function connect(args) { const {uri,dbName}=target(args); const client=new MongoClient(uri); await client.connect(); return {client,db:client.db(dbName)}; }
module.exports={target,connect};
