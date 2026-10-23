'use strict';
const assert=require('node:assert/strict');
const E=require('../assets/tsr-engine.js');
let checks=0;
function eq(a,b){assert.equal(a,b);checks++;}
for(const [tier,aliases,thresholds] of [
 [1,['weekly'],[24,28,32,34.67,37.34,40,42.67,45.34,48,50.67,53.34]],
 [2,['series_under_400','series_sub400'],[25,30,34,37.34,40.67,44,47.67,51.34,55,59,63]],
 [3,['series','major'],[40,45,50,55,60,65,71.67,78.34,85,91.67,98.34]]
]) {
 const letters=['D−','D','D+','C−','C','C+','B−','B','B+','A−','A','A+'];
 for(const alias of [tier,...aliases]) {
  for(let i=0;i<thresholds.length;i++) {
   eq(E.letterFor(thresholds[i],alias).letter,letters[i+1]);
   eq(E.letterFor(thresholds[i]-0.000001,alias).letter,letters[i]);
  }
  for(const score of [-100,0,10,thresholds[0]-0.01])assert.deepEqual(E.letterFor(score,alias),{letter:'D−',base:'D'});
  eq(E.letterFor(1000,alias).letter,'A+');
 }
}
const bbs=[200,300,400,500,700,1000,1500,2000,2500,3000,4000,6000,8000,10000,12000,15000,20000,30000,40000,60000];
const levels=E.parseStructure(bbs.map(b=>`${b/2} / ${b} / ${b}`).join('\n')).levels;
const input={buyin:300,fees:40,stack:40000,levelLen:30,levels,event_type:'weekly'};
const base=E.grade(input);eq(base.ok,true);eq(base.tier,1);eq(E.grade({...input,event_type:'series',buyin:399.99}).tier,2);eq(E.grade({...input,event_type:'series',buyin:400}).tier,3);eq(E.grade({...input,event_type:'series',multi_day:true}).tier,3);
assert.ok(Math.abs(base.score-51.42857142857142)<1e-9);checks++;
eq(base.letter,'A');eq(base.penalty,0);eq(base.depthMin,480);
eq(E.grade({...input,levels:levels.slice(0,17)}).ok,false);
eq(E.grade({...input,fees:300}).ok,false);
// Scheduled and explicit minutes retain their original precedence.
const timed=levels.map(l=>({...l,mins:10}));eq(E.grade({...input,levels:timed,len2:40,len2From:2}).depthMin,160);
// Every transition scanned; material jumps use strict >60 and >100 thresholds.
for(const [pct,penalty] of [[60,0],[60.01,4],[100,4],[100.01,8]]){
 const ls=Array.from({length:18},(_,i)=>({orbit:i?100*(1+pct/100):100,sb:1,bb:1,ante:0,mins:30}));
 eq(E.grade({...input,stack:1000,levels:ls}).penalty,penalty);
}
console.log(`Engine tests passed (${checks} checks).`);
