const engine = require('../assets/tsr-engine');
const VERSION = 'v1.1';
const LEGACY_VERSION = 'tsr-2026.10-curve-by-type';
const workflow=['Imported','Draft','Needs Verification','Ready for Review','Approved','Published','Archived'];
const statusMap={published:'Published',draft:'Draft',needs_review:'Needs Verification',retracted:'Archived',superseded:'Archived'};
const statuses = [...workflow,'published','draft','needs_review','retracted','superseded'];
function classify(doc) {
  return ['weekly','series','major','unknown'].includes(doc.event_type) ? doc.event_type : ['weekly','series'].includes(doc.type) ? doc.type : 'unknown';
}
function number(v, name) {
  if (v === null || v === undefined || v === '') return null;
  if (!['number','string'].includes(typeof v) || !Number.isFinite(Number(v)) || Number(v) < 0) throw new TypeError('Invalid '+name);
  return Number(v);
}
function normalizeBuyin(doc) {
  const p = doc.buyin_parts || {};
  const out = {};
  for (const k of ['total','prize_pool','fee','guarantee','actual_prize_pool','entries','unique_players']) out[k] = number(p[k],k);
  if (out.total === null) out.total = number(doc.buyin,'buyin');
  if (out.prize_pool !== null && out.fee !== null) {
    const sum = out.prize_pool + out.fee;
    if (p.total != null && Math.abs(out.total-sum) > 1) throw new TypeError('Buy-in total does not match prize pool + fee');
    out.total = sum;
  }
  if(out.prize_pool === null && out.total !== null && out.fee !== null && out.total >= out.fee) out.prize_pool=out.total-out.fee;
  if (p.addons != null && !Array.isArray(p.addons)) throw new TypeError('Invalid addons');
  out.addons = (p.addons || []).map(a => ({cost:number(a.cost,'addon cost'),chips:number(a.chips,'addon chips'),fee:number(a.fee,'addon fee')}));
  out.reentry_rules = p.reentry_rules ?? null;
  return out;
}
function inputsFor(doc) {
  if (doc.inputs != null) return doc.inputs;
  if (!doc.hash) return null;
  const p = new URLSearchParams(String(doc.hash).replace(/^#/,''));
  if (!p.has('v')) throw new TypeError('Invalid calculator hash');
  const input = {};
  for (const [key,short] of Object.entries({buyin:'b',fees:'f',stack:'s',levelLen:'l',addonCost:'ac',addonChips:'ak',len2:'l2',len2From:'l2f'})) input[key] = Number(p.get(short) || 0);
  input.levels = p.get('v').split('_').map((row,i)=> {
    const [sb,bb,ante=0] = row.split('-').map(Number);
    return {level:i+1,sb,bb,ante,orbit:sb+bb+ante,mins:0};
  });
  return input;
}
function recompute(doc) {
  const out = {...doc};
  if(doc.methodology_version != null && ![VERSION,'v1.0',LEGACY_VERSION].includes(doc.methodology_version)) throw new TypeError('Invalid methodology version');
  if(doc.status != null && !statuses.includes(doc.status)) throw new TypeError('Invalid grade status');
  if(doc.editorial_status != null && !workflow.includes(doc.editorial_status)) throw new TypeError('Invalid editorial status');
  out.event_type = classify(doc);
  out.buyin_parts = normalizeBuyin(doc);
  out.multi_day = Boolean(doc.multi_day);
  Object.assign(out,resolveCurve(out));
  out.methodology_version = VERSION;
  out.status = statuses.includes(doc.status) ? doc.status : 'published';
  out.editorial_status = workflow.includes(doc.editorial_status) ? doc.editorial_status : statusMap[out.status] || out.status;
  validateExperience(out);
  out.superseded_by = doc.superseded_by ?? null;
  out.review_reason = doc.review_reason ?? null;
  const input = inputsFor(doc);
  let score = Number(doc.score);
  if (input) {
    if (![input.buyin,input.fees,input.stack,input.levelLen].every(Number.isFinite) || input.buyin <= 0 || input.fees < 0 || input.fees >= input.buyin || input.stack <= 0) throw new TypeError('Invalid calculator buy-in, fees, stack, or level length');
    if (!Array.isArray(input.levels) || !(input.levelLen > 0) || input.levels.some(l=> !Number.isFinite(l.orbit) || !Number.isFinite(l.mins || 0))) throw new TypeError('Invalid calculator inputs');
    const result = engine.grade(input);
    if (!result.ok || !Number.isFinite(result.score)) throw new TypeError((result.errors || ['Invalid score']).join(' '));
    score = result.score;
    out.score_source = 'engine';
    out.vig = result.vig;
    out.smooth = result.smooth;
  } else out.score_source = 'stored';
  if (doc.score == null && !input || !Number.isFinite(score)) throw new TypeError('A finite score is required');
  out.score = score;

  const g = out.tier ? engine.letterFor(score,out.tier) : {letter:null,base:null};
  out.grade = g.letter;
  out.base = g.base;
  if (!out.curve) { out.status = 'needs_review'; out.editorial_status='Needs Verification'; out.review_reason = 'Unknown event type; editorial classification required'; }
  return out;
}
const resolveCurve = doc => engine.resolveCurve({...doc,event_type:classify(doc)});
const tracked = ['multi_day','score','grade','tier','curve','event_type','methodology_version','status','editorial_status','buyin_parts','inputs','hash','experience_record','shams_take','review_reason','superseded_by'];
function snapshot(doc) { return Object.fromEntries(tracked.map(k=>[k,doc?.[k] ?? null])); }
function comparable(doc) { const {_id,history,...rest} = doc || {}; return rest; }
function withHistory(doc, previous, by = 'admin') {
  if(previous && doc.status!==previous.status && doc.editorial_status===previous.editorial_status){doc={...doc};delete doc.editorial_status;}
  const out = recompute(doc);
  out.history = previous?.history || [];
  if (!require('node:util').isDeepStrictEqual(comparable(out), comparable(previous))) out.history = [...out.history,{at:new Date(),by,change:previous ? 'Grade updated' : 'Grade created',previous:snapshot(previous)}];
  return out;
}
const takeError="Sham's Take requires verified firsthand experience (played, attended, or observed) and publisher approval";
function eligible(doc) {const e=doc.experience_record,t=doc.shams_take;return !!(e && ['played','attended','observed'].includes(e.attendance_status) && e.verified_by_publisher===true && t && typeof t.edited_text==='string' && t.edited_text.trim() && t.approved_by === 'Shomari Williams' && typeof t.approved_at==='string' && Number.isFinite(Date.parse(t.approved_at)));}
function validateExperience(doc) {
 const e=doc.experience_record,t=doc.shams_take;
 if(e){if(!['played','attended','observed','not_attended'].includes(e.attendance_status) || typeof e.verified_by_publisher!=='boolean') throw new TypeError('Invalid experience record');
 for(const k of ['room_atmosphere','dealer_quality','floor_decisions','registration_speed','chip_visibility','food_break_logistics','player_value_feel']) {const v=e.ratings?.[k];if(v!=null && (!Number.isFinite(v)||v<1||v>5)) throw new TypeError('Experience ratings must be 1–5');}
 for(const k of ['freeform_notes','recorded_at','recorded_by']) if(e[k]!=null && typeof e[k]!=='string') throw new TypeError('Invalid experience '+k);
 }
 if(t){if(!['Draft','Ready for Review','Approved','Published','Rejected'].includes(t.status)) throw new TypeError('Invalid take status');
 for(const k of ['ai_draft','edited_text','approved_by','approved_at']) if(t[k]!=null && typeof t[k]!=='string') throw new TypeError('Invalid take '+k);
 if(t.history!=null && !Array.isArray(t.history)) throw new TypeError('Invalid take history');
 if(['Approved','Published'].includes(t.status) && !eligible(doc)) throw new TypeError(takeError);
 }
}
function publicAnalysisLabel(doc) {if(['Approved','Published'].includes(doc.shams_take?.status) && eligible(doc)) return {heading:"Sham's Take",badge:'Verified firsthand experience · Approved by Shomari Williams',text:doc.shams_take.edited_text};
 return {heading:'Data-Based Structure Analysis',badge:'Automated structure read · No firsthand attendance claimed',text:`Structure score: ${doc.score ?? 'not yet graded'}. Event classification: ${classify(doc)}. Fees are reported separately; no firsthand attendance claimed.`};}
const formatPublicTake=publicAnalysisLabel;
module.exports = {resolveCurve,publicAnalysisLabel,formatPublicTake,validateExperience,LEGACY_VERSION,classify,normalizeBuyin,inputsFor,recompute,withHistory,VERSION};
