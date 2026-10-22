(() => {
'use strict';
const $=id=>document.getElementById(id),form=$('score-form'),status=$('score-status'),result=$('score-result');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let revision=0,summary='',busy=false;
const clear=message=>{revision++;result.hidden=true;summary='';$('score-empty').hidden=false;status.textContent=message;$('retry-score').hidden=true;};
form.addEventListener('input',()=>clear('Inputs edited — calculate again for an updated score.'));
form.addEventListener('reset',()=>{clear('Reset complete. Enter a structure or load the sample to begin.');});
$('load-example').onclick=()=>{form.reset();const values={event:'Sample structure · Development preview',venue:'Illustrative room',buyin:250,fees:40,stack:40000,levelLen:30,fmt:'nlh'};for(const [k,v] of Object.entries(values))$(k).value=v;$('structure').value=[200,300,400,500,700,1000,1500,2000,2500,3000,4000,6000,8000,10000,12000,15000,20000,30000,40000,60000].map(bb=>`${bb/2} / ${bb} / ${bb}`).join('\n');clear('Sample loaded. Calculate to evaluate this illustrative structure.');};
async function calculate(e){if(e)e.preventDefault();if(busy)return;result.hidden=true;summary='';$('retry-score').hidden=true;
 const required=['buyin','fees','stack','levelLen','structure'];const missing=required.filter(k=>!$(k).value.trim());
 if(missing.length){status.textContent='Missing data — no definitive score. Complete: '+missing.join(', ')+'.';$(missing[0]).focus();return;}
 const numeric=['buyin','fees','stack','levelLen','gtd','addonChips','addonCost','len2','len2From'];const invalid=numeric.filter(k=>!$(k).validity.valid);
 if(invalid.length){status.textContent='Validation: check '+invalid.join(', ')+'. Values must meet the field minimums.';$(invalid[0]).focus();return;}
 busy=true;$('calculate').disabled=true;status.textContent='Calculating structure…';const stamp=revision;
 await new Promise(resolve=>setTimeout(resolve,180));
 try{
 const parsed=TSREngine.parseStructure($('structure').value);
 if(parsed.unparsed.length){status.textContent='Validation: could not read every structure line. Check: '+parsed.unparsed.join('; ');return;}
 const input={};for(const k of numeric)input[k]=$(k).value===''?0:Number($(k).value);input.fmt=$('fmt').value;input.levels=parsed.levels;
 if(!(input.levelLen>0)){status.textContent='Validation: level length must be positive.';return;}
 const r=TSREngine.grade(input);
 if(stamp!==revision){status.textContent='Inputs changed during calculation — calculate again.';return;}
 if(!r.ok){status.textContent='Missing or invalid data — no definitive score. '+r.errors.join(' ');return;}
 if(!Number.isFinite(r.score))throw Error('Non-finite result');
 const selected=Number(form.elements.curve.value),curve=r.tier===1?'Weekly / Tier 1':'Series / Tier 2';
 const why=`Total buy-in $${input.buyin.toLocaleString('en-US')} is ${r.tier===1?'$300 or less':'above $300'}. The official rule selects this curve by total buy-in, including fees.`;
 const mismatch=selected!==r.tier?"Curve mismatch — pending Sham's decision (SCO-001)":'';
 const take=`The supplied structure has ${r.depthMin} minutes of playable depth through level ${r.lastDeep}. ${r.penalty?`A material blind jump subtracts ${r.penalty} points.`:'No material blind-jump penalty applies.'} Fees represent ${r.vig.toFixed(1)}% of effective spend. This is a structure assessment, not a forecast of results.`;
 summary=`${$('event').value||'Tournament'}\nTSR Score: ${r.letter} ${r.score.toFixed(1)}\nCurve: ${curve}\n${why}\n${mismatch}\n${take}\nSham’s Take: Automated draft`;
 const rows=[['Fee share',`${r.vig.toFixed(1)}% effective · ${r.entryVig.toFixed(1)}% entry`],['Playable depth',`${r.depthMin} minutes · through level ${r.lastDeep}`],['Largest material jump',`${r.maxJump.toFixed(1)}%${r.maxJumpAt?' at level '+r.maxJumpAt:''}`],['Raw / penalty',`${r.raw.toFixed(3)} / −${r.penalty}`],['Growth denominator',r.denom.toFixed(4)],['Base / effective stack',`${input.stack} / ${r.effStack}`],['Base score / grade',`${r.scoreBase.toFixed(1)} / ${r.letterBase}`],['Level minutes',input.levelLen+' base; per-level overrides take priority']];
 result.innerHTML=`${mismatch?`<p class="notice" role="alert">${mismatch}</p>`:''}<div class="grade-display">${r.letter} ${r.score.toFixed(1)}<small>${curve} curve</small></div><p>${esc(why)}</p><h3>Score breakdown</h3><dl>${rows.map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl><h3>Strengths</h3><ul><li>${r.smooth?'No material jump above 60% was found.':'The full schedule was scanned for material jumps.'}</li><li>Starting chips cover orbit costs through level ${r.lastDeep}.</li></ul><h3>Tradeoffs</h3><ul><li>${r.penalty?`A ${r.penalty}-point blind-jump penalty reduces the score.`:'No penalty does not guarantee a smooth player experience.'}</li><li>Fee share and guarantees do not alter the numeric score.</li>${input.fmt==='plo'?'<li>PLO plays differently from the hold’em assumptions; numeric score is unchanged.</li>':''}${r.len2OutsideWindow?'<li>The scheduled level-length change is beyond the playable-depth window.</li>':''}</ul><h3>Sham’s Take <small>Automated draft</small></h3><p>${esc(take)}</p><p>Editor commentary: Not provided.</p><div class="actions"><button id="edit-inputs" class="plain-button">Edit inputs</button><button id="copy-result" class="plain-button">Copy result</button><button id="print-result" class="plain-button">Print</button></div><p id="copy-status" role="status"></p><a class="c3-text-link" href="about.html#methodology">Methodology →</a>`;
 result.hidden=false;$('score-empty').hidden=true;status.textContent='Calculation complete. Scores are uncapped and are not percentages.';
 $('edit-inputs').onclick=()=>{$('buyin').focus();};$('print-result').onclick=()=>window.print();$('copy-result').onclick=async()=>{try{await navigator.clipboard.writeText(summary);$('copy-status').textContent='Result copied.';}catch{const area=document.createElement('textarea');area.value=summary;result.append(area);area.focus();area.select();$('copy-status').textContent='Clipboard unavailable. Select and copy the result text below.';}};
 }catch(error){status.textContent='Calculation failed. Your inputs are retained. Retry or review the structure.';$('retry-score').hidden=false;}
 finally{busy=false;$('calculate').disabled=false;}
}
form.onsubmit=calculate;$('retry-score').onclick=calculate;
// Preserve existing shared calculator hash URLs without submitting or publishing.
try {
 const params=new URLSearchParams(location.hash.slice(1));
 if(params.has('v')){
  const mapping={n:'event',r:'venue',b:'buyin',f:'fees',s:'stack',q:'gtd',ac:'addonCost',ak:'addonChips',l:'levelLen',l2:'len2',l2f:'len2From',g:'fmt'};
  for(const [key,id] of Object.entries(mapping))if(params.has(key))$(id).value=params.get(key);
  $('structure').value=params.get('v').split('_').map(row=>row.split('-').join(' / ')).join('\n');
  form.elements.curve.value=params.get('fq')==='series'?'2':'1';
  clear('Shared structure loaded. Review inputs and calculate to refresh the result.');
 }
}catch{status.textContent='Shared link could not be loaded. Enter the structure or load an example.';}
})();
