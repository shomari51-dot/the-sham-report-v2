const fs = require('node:fs');
const {EJSON} = require('bson');
const {withHistory} = require('../lib/grading');
async function migrate(db,{apply=false,log=console.table}={}) {
  if (db.databaseName === 'tsrcms') throw Object.assign(new Error('Production grade migration blocked'),{code:'PROD_DB_WRITE_BLOCKED'});
  const col = db.collection('grades');
  const docs = await col.find({}).toArray();
  return migrateDocs(docs,{apply,log,col});
}
async function migrateDocs(docs,{apply=false,log=console.table,col}={}) {
  let writes=0;
  const rows=[];
  for (const doc of docs) {
    const next = withHistory(doc,doc,'migration:grades-v1.1');
    rows.push({id:doc.id,name:doc.name,'type → event_type':`${doc.type || '(missing)'} → ${next.event_type}`,buyin:next.buyin_parts.total,multi_day:next.multi_day,methodology:next.methodology_version,score:next.score,'old tier/grade':`${doc.tier}/${doc.grade}`,'new curve/grade/status':`${next.curve}/${next.grade}/${next.status}`});
    if (apply && next.history.length !== (doc.history || []).length) {
      const {_id,...fields}=next;
      await col.updateOne({_id:doc._id},{$set:fields}); writes++;
    }
  }
  log(rows);
  const duplicates = docs.filter(d=>/bigger one/i.test(d.name));
  if (duplicates.length) log({'duplicate candidates — Sham decision D8':duplicates.map(d=>d.id).join(', ')});
  return {writes,rows};
}
async function main(args) {
  const apply=args.includes('--apply');
  if (apply && args.includes('--dry-run')) throw new Error('Choose --apply or --dry-run');
  const i=args.indexOf('--backup');
  if (!apply && i>=0) {
    const data=EJSON.parse(fs.readFileSync(args[i+1],'utf8'));
    return migrateDocs(Array.isArray(data)?data:data.grades);
  }
  const {client,db}=await require('./preview-safety').connect(args);
  try { return await migrate(db,{apply}); } finally {await client.close();}
}
if (require.main===module) main(process.argv.slice(2)).catch(e=>{console.error(e.message);process.exitCode=1;});
module.exports={migrate,migrateDocs,main};
