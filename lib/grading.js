const engine = require('../assets/tsr-engine');
const VERSION = 'tsr-2026.10-curve-by-type';
const statuses = ['published','draft','needs_review','retracted','superseded'];
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
  out.event_type = classify(doc);
  out.buyin_parts = normalizeBuyin(doc);
  out.curve = out.event_type === 'weekly' ? 'weekly' : ['series','major'].includes(out.event_type) ? 'series' : null;
  out.methodology_version = VERSION;
  out.status = statuses.includes(doc.status) ? doc.status : 'published';
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
  out.tier = out.curve === 'weekly' ? 1 : out.curve === 'series' ? 2 : null;
  const g = out.tier ? engine.letterFor(score,out.tier) : {letter:null,base:null};
  out.grade = g.letter;
  out.base = g.base;
  if (!out.curve) { out.status = 'needs_review'; out.review_reason = 'Unknown event type; editorial classification required'; }
  return out;
}
const tracked = ['score','grade','tier','curve','methodology_version','status'];
function snapshot(doc) { return Object.fromEntries(tracked.map(k=>[k,doc?.[k] ?? null])); }
function comparable(doc) { const {_id,history,...rest} = doc || {}; return rest; }
function withHistory(doc, previous, by = 'admin') {
  const out = recompute(doc);
  out.history = previous?.history || [];
  if (!require('node:util').isDeepStrictEqual(comparable(out), comparable(previous))) out.history = [...out.history,{at:new Date(),by,change:previous ? 'Grade updated' : 'Grade created',previous:snapshot(previous)}];
  return out;
}
module.exports = {classify,normalizeBuyin,inputsFor,recompute,withHistory,VERSION};
