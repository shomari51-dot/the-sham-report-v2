#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const {createImport}=require('../lib/fb-import');
async function main(args=process.argv.slice(2),log=console.log){
 const idx=args.indexOf('--input');
 if(idx<0 || !args[idx+1] || args.some((a,i)=>a!=='--dry-run' && a!=='--input' && i!==idx+1))throw new Error('Usage: node scripts/import-fb-post.js --input <json> [--dry-run]');
 const doc=createImport(JSON.parse(fs.readFileSync(args[idx+1],'utf8')));
 if(args.includes('--dry-run')){log(JSON.stringify(doc,null,2));return doc;}
 const {assertWritableDb,getDb,close}=require('../lib/db');
 assertWritableDb();
 try{const db=await getDb();const old=await db.collection('articles').findOne({fb_post_id:doc.fb_post_id});if(old)throw new Error('Import already exists; review the staged article instead of overwriting its original');await db.collection('articles').insertOne(doc);log('Staged import: '+doc.slug);}finally{await close();}
}
module.exports={main};
if(require.main===module)main().catch(e=>{console.error(e.code?e.code+': '+e.message:e.message);process.exitCode=1;});
