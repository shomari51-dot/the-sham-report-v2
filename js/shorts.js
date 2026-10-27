(() => {
'use strict';
const clips=[{id:'dkhCSbM7Pic',title:'Wolfgang flops a set vs. John B'},{id:'i8lIHMms_8I',title:'Amy gives JB the death stare · AK vs. A10'},{id:'J48uk_31H-g',title:'Kyle puts Dr. Andy in the blender'}];
let active=null;
const stop=()=>{if(active){active.querySelector('iframe')?.remove();active.classList.remove('playing');active.querySelector('button').setAttribute('aria-pressed','false');active=null;}};
window.TSRShorts={mount(root){root.className='tsr-shorts';clips.forEach(clip=>{
const card=document.createElement('article');card.className='tsr-short';
const visual=document.createElement('div');visual.className='tsr-short-visual';
const image=document.createElement('img');image.src='https://i.ytimg.com/vi/'+clip.id+'/hqdefault.jpg';image.alt='';image.loading='lazy';
const button=document.createElement('button');button.type='button';button.className='tsr-short-play';button.textContent='▶';button.setAttribute('aria-label','Play muted preview: '+clip.title);button.setAttribute('aria-pressed','false');
const heading=document.createElement('h3');const link=document.createElement('a');link.href='https://www.youtube.com/shorts/'+clip.id;link.target='_blank';link.rel='noopener noreferrer';link.textContent=clip.title;heading.append(link);
const start=()=>{if(active===card)return;stop();active=card;card.classList.add('playing');button.setAttribute('aria-pressed','true');const frame=document.createElement('iframe');frame.title='Muted video preview: '+clip.title;frame.src='https://www.youtube-nocookie.com/embed/'+clip.id+'?autoplay=1&mute=1&playsinline=1&loop=1&playlist='+clip.id+'&rel=0';frame.allow='autoplay; encrypted-media; picture-in-picture';frame.referrerPolicy='strict-origin-when-cross-origin';frame.allowFullscreen=true;visual.append(frame);};
button.onclick=()=>active===card?stop():start();card.addEventListener('pointerenter',()=>{if(matchMedia('(hover:hover) and (pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches)start();});card.addEventListener('pointerleave',stop);card.addEventListener('keydown',e=>{if(e.key==='Escape')stop();});card.addEventListener('focusout',e=>{if(!card.contains(e.relatedTarget))stop();});
visual.append(image,button);card.append(visual,heading);const note=document.createElement('a');note.href=link.href;note.target='_blank';note.rel=link.rel;note.className='short-watch';note.textContent='Watch on YouTube ↗';card.append(note);root.append(card);
});document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});}};
})();