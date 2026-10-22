'use strict';
const assert=require('node:assert/strict');
const E=require('../assets/tsr-engine.js');
let checks=0;
function eq(a,b){assert.equal(a,b);checks++;}
for(const tier of [1,2]){
 const bands=E.BANDS[tier];
 for(let i=0;i<bands.length-1;i++){
  const b=bands[i],width=b.max-b.min;
  eq(E.letterFor(b.min,tier).letter,b.g+'−');
  eq(E.letterFor(b.min+width/3+1e-9,tier).letter,b.g);
  eq(E.letterFor(b.min+2*width/3+1e-9,tier).letter,b.g+'+');
  eq(E.letterFor(b.min-1e-9,tier).base,bands[i+1].g);
 }
 eq(E.letterFor(-100,tier).letter,'F');
 eq(E.letterFor(1000,tier).letter,'A+');
}
eq(E.letterFor(73,1).letter,'A+');eq(E.letterFor(73,2).letter,'B');
const bbs=[200,300,400,500,700,1000,1500,2000,2500,3000,4000,6000,8000,10000,12000,15000,20000,30000,40000,60000];
const levels=E.parseStructure(bbs.map(b=>`${b/2} / ${b} / ${b}`).join('\n')).levels;
const input={buyin:300,fees:40,stack:40000,levelLen:30,levels};
const base=E.grade(input);eq(base.ok,true);eq(base.tier,1);eq(E.grade({...input,buyin:300.01}).tier,2);eq(E.grade({...input,buyin:299.99}).tier,1);
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
