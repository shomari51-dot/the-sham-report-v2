const fs=require('node:fs');
const path=require('node:path');
const {EJSON}=require('bson');
async function main(args) {
  const folder=args[args.indexOf('--folder')+1];
  if (!args.includes('--folder') || !folder) throw new Error('--folder required');
  const {client,db}=await require('./preview-safety').connect(args);
  try {
    for (const file of fs.readdirSync(folder).filter(f=>/\.(json|ejson)$/.test(f))) {
      const name=path.basename(file).replace(/\.(json|ejson)$/,'');
      if (!['grades','articles','pages'].includes(name)) throw new Error('Expected collection EJSON filename: '+file);
      const raw=fs.readFileSync(path.join(folder,file),'utf8');
      let docs;
      try { const data=EJSON.parse(raw); docs=Array.isArray(data)?data:(data[name] || [data]); }
      catch { docs=raw.trim().split('\n').map(line=>EJSON.parse(line)); }
      for (const doc of docs) {
        const key=doc._id ? {_id:doc._id} : name==='grades'?{id:doc.id}:name==='articles'?{slug:doc.slug}:{page:doc.page};
        if (Object.values(key).some(v=>v==null)) throw new Error('Missing document key');
        await db.collection(name).replaceOne(key,doc,{upsert:true});
      }
      console.log(name+': '+docs.length+' loaded');
    }
  } finally {await client.close();}
}
if(require.main===module) main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={main};
