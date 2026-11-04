(() => {
  'use strict';
  const data = window.CONCEPT3_DATA;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ts = item => { const t = Date.parse(item.original_fb_date || item.date || ''); return Number.isFinite(t) ? t : 0; };
  const stories = [...(data.stories || [])].map((s, _idx) => ({...s, _idx})).sort((a, b) => ts(b) - ts(a) || (b.seq || 0) - (a.seq || 0) || a._idx - b._idx);
  const reels = [...(data.reels || [])].map((r, _idx) => ({...r, _idx})).sort((a, b) => ts(b) - ts(a) || a._idx - b._idx);
  const creditHtml=(c,e)=>{if(!c)return '';const L=(u,t)=>/^https:\/\//.test(u||'')?`<a href="${e(u)}" target="_blank" rel="noopener noreferrer">${e(t)}<span class="c3-sr"> (opens in new tab)</span></a>`:e(t);return `<p class="c3-photo-credit">${e(c.prefix||'Photo')}: ${L(c.sourceUrl,c.author)}${c.license?', '+L(c.licenseUrl,c.license):''}${c.note?', '+e(c.note):''}</p>`;};
  const withCredit=(html,x,e)=>x.imageCredit?`<div class="c3-credited">${html}${creditHtml(x.imageCredit,e)}</div>`:html;
  function story(item) {
    const content = `<img src="${esc(item.image)}" alt="${esc(item.alt)}" loading="lazy"><div><p class="c3-meta"><span>${esc(item.category)}</span> · ${esc(item.date)}</p><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div>`;
    return withCredit(item.url ? `<a class="c3-story" href="${esc(item.url)}">${content}</a>` : `<article class="c3-story">${content}</article>`, item, esc);
  }
  const shown = new Set(typeof document.querySelectorAll === 'function' ? [...document.querySelectorAll('.c3-hero a[href], .c3-bigread a[href]')].map(a => a.getAttribute('href')) : []);
  const rest = stories.slice(1).filter(s => !shown.has(s.url));
  document.getElementById('lead-stories').innerHTML = rest.slice(0, 4).map(story).join('');
  const dateISO=item=>{const d=new Date(ts(item));return Number.isFinite(d.valueOf())?d.toISOString().slice(0,10):'';};
  document.getElementById('latest-stories').innerHTML = stories.slice(0,3).map(item=>`<article class="latest-item"><a class="latest-card" href="${esc(item.url)}"><div class="latest-image"><img src="${esc(item.image)}" alt="${esc(item.alt)}" loading="lazy" width="800" height="450"></div><div class="latest-copy"><p class="latest-meta"><span>${esc(item.category)}</span><time datetime="${dateISO(item)}">${esc(item.date)}</time></p><h3>${esc(item.title)}</h3><p class="latest-dek">${esc(item.description)}</p><span class="latest-read">Read the report <span aria-hidden="true">↗</span></span></div></a>${creditHtml(item.imageCredit,esc)}</article>`).join('');
  document.getElementById('grade-rows').innerHTML = data.grades.slice(0, 4).map(g => `<tr><td>${esc(g.grade)}</td><td>${esc(g.score)}</td><td>${esc(g.event)}<small>Historical score · source review pending</small></td><td>${esc(g.venue)}</td><td>${esc(g.buyin)}</td><td>${esc(g.time)}</td></tr>`).join('');
  if (window.TSRShorts) window.TSRShorts.mount(document.getElementById('media-rows'));
  const newsletterForm = document.getElementById('preview-newsletter');
  if (newsletterForm && !newsletterForm.hidden) newsletterForm.addEventListener('submit', event => {
    event.preventDefault();
    document.getElementById('newsletter-status').textContent = 'Preview complete. No email was saved or submitted; subscriptions are not connected.';
    event.target.reset();
  });
})();
