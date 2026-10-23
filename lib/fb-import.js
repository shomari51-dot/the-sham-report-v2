'use strict';
const {createHash}=require('node:crypto');
const initialStatuses=['Imported','Needs Verification','Ready for Review'];
const required=['fb_post_id','original_fb_date','website_import_date','fb_source_url','original_post_text','expanded_title','expanded_deck','expanded_body','author','categories','fact_verification_flags','outdated_info_flags','image_rights','seo','editorial_status'];
function nonempty(v,k){if(typeof v!=='string'||!v.trim())throw new TypeError('Required field: '+k);}
function createImport(payload,previous=null) {
 if(!payload||typeof payload!=='object')throw new TypeError('Import payload required');
 for(const k of required) if(payload[k]==null)throw new TypeError('Required field: '+k);
 const p=structuredClone(payload);
 for(const k of required.filter(k=>!['categories','fact_verification_flags','outdated_info_flags','image_rights','seo'].includes(k)))nonempty(p[k],k);
 for(const k of ['original_fb_date','website_import_date'])if(!Number.isFinite(Date.parse(p[k])))throw new TypeError('Invalid '+k);
 const url=new URL(p.fb_source_url);if(url.protocol!=='https:' || !/(^|\.)facebook\.com$/.test(url.hostname))throw new TypeError('Invalid Facebook source URL');
 if(p.author!=='Shomari Williams')throw new TypeError('Import author must be Shomari Williams');
 if(!initialStatuses.includes(p.editorial_status))throw new TypeError('Imports cannot be Approved or Published directly');
 for(const k of ['categories','fact_verification_flags','outdated_info_flags'])if(!Array.isArray(p[k]))throw new TypeError('Invalid '+k);
 if(!p.categories.length)throw new TypeError('Categories required');p.categories.forEach(v=>nonempty(v,'category'));
 for(const f of p.fact_verification_flags){nonempty(f.claim,'claim');nonempty(f.source,'source');if(typeof f.note!=='string'||!['verified','needs_verification','allegation','opinion'].includes(f.status))throw new TypeError('Invalid verification flag');}
 for(const f of p.outdated_info_flags){nonempty(f.original_statement,'original_statement');nonempty(f.current_status,'current_status');if(typeof f.editorial_note!=='string')throw new TypeError('Invalid editorial_note');}
 for(const k of ['image_path','source','credit','caption'])nonempty(p.image_rights[k],'image_rights.'+k);
 if(!['owned','licensed','permission_pending'].includes(p.image_rights.permission_status)||typeof p.image_rights.ai_processed!=='boolean')throw new TypeError('Invalid image rights');
 for(const k of ['metaTitle','metaDescription','keyphrase'])nonempty(p.seo[k],'seo.'+k);
 if(p.editorial_status==='Ready for Review'&&(p.fact_verification_flags.some(f=>f.status==='needs_verification')||p.outdated_info_flags.some(f=>!f.editorial_note.trim())))throw new TypeError('Resolve verification flags and add outdated-information editorial notes before review');
 if(previous && p.original_post_text!==previous.original_post_text)throw new TypeError('Original Facebook text is immutable');
 const article={...p,slug:p.expanded_title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),title:p.expanded_title,deck:p.expanded_deck,body:p.expanded_body,status:'draft',original_post_sha256:createHash('sha256').update(p.original_post_text).digest('hex')};
 Object.defineProperty(article,'original_post_text',{value:p.original_post_text,enumerable:true,writable:false,configurable:false});
 return article;
}
module.exports={createImport,required,initialStatuses};
