(() => {
'use strict';
const root=document.querySelector('.hero-carousel');if(!root)return;
const slides=[...root.querySelectorAll('.c3-hero')],choices=[...root.querySelectorAll('[data-slide]')],toggle=document.getElementById('hero-pause'),status=document.getElementById('hero-status');
const reduced=matchMedia('(prefers-reduced-motion:reduce)');let current=0,paused=reduced.matches,timer;
function show(index,announce=false){current=(index+slides.length)%slides.length;slides.forEach((slide,i)=>{slide.hidden=i!==current;});choices.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===current)));if(announce)status.textContent='Story '+(current+1)+' of '+slides.length+': '+(choices[current]?choices[current].textContent:'');}
function schedule(){clearInterval(timer);toggle.textContent=paused?'Start rotation':'Pause rotation';if(!paused&&!document.hidden)timer=setInterval(()=>show(current+1),9000);}
function pause(){paused=true;schedule();}
choices.forEach((button,i)=>button.addEventListener('click',()=>{pause();show(i,true);}));document.getElementById('hero-prev').onclick=()=>{pause();show(current-1,true);};document.getElementById('hero-next').onclick=()=>{pause();show(current+1,true);};toggle.onclick=()=>{paused=!paused;schedule();};root.addEventListener('focusin',event=>{if(event.target!==toggle)pause();});root.addEventListener('pointerenter',()=>clearInterval(timer));root.addEventListener('pointerleave',schedule);document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',()=>{if(reduced.matches)pause();});show(0);schedule();
})();