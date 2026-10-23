(() => {
  'use strict';
  const data = window.CONCEPT3_DATA;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ts = item => { const t = Date.parse(item.original_fb_date || item.date || ''); return Number.isFinite(t) ? t : 0; };
  const stories = [...(data.stories || [])].map((s, _idx) => ({...s, _idx})).sort((a, b) => ts(b) - ts(a) || (b.seq || 0) - (a.seq || 0) || a._idx - b._idx);
  const reels = [...(data.reels || [])].map((r, _idx) => ({...r, _idx})).sort((a, b) => ts(b) - ts(a) || a._idx - b._idx);
  function story(item) {
    const content = `<img src="${esc(item.image)}" alt="${esc(item.alt)}" loading="lazy"><div><p class="c3-meta"><span>${esc(item.category)}</span> · ${esc(item.date)}</p><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div>`;
    return item.url ? `<a class="c3-story" href="${esc(item.url)}">${content}</a>` : `<article class="c3-story">${content}</article>`;
  }
  document.getElementById('lead-stories').innerHTML = stories.slice(1, 5).map(story).join('');
  document.getElementById('latest-stories').innerHTML = stories.slice(5, 10).map(story).join('');
  document.getElementById('grade-rows').innerHTML = data.grades.slice(0, 5).map(g => `<tr><td>${esc(g.grade)}</td><td>${esc(g.score)}</td><td>${esc(g.event)}<small>3-Curve A–D Scale · v1.1</small></td><td>${esc(g.venue)}</td><td>${esc(g.buyin)}</td><td>${esc(g.time)}</td></tr>`).join('');
  document.getElementById('media-rows').innerHTML = reels.map(r => `<a class="c3-story" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"><div class="c3-thumb"><img src="${esc(r.image)}" alt="${r.alt}" loading="lazy"><span class="c3-play" aria-hidden="true">▷</span></div><div><p class="c3-meta"><span>Facebook Reel ↗</span>${r.date ? ' · ' + esc(r.date) : ''}</p><h3>${r.title}</h3><p>Watch on Facebook (opens a new tab).</p></div></a>`).join('');
  document.getElementById('preview-newsletter').addEventListener('submit', event => {
    event.preventDefault();
    document.getElementById('newsletter-status').textContent = 'Preview complete. No email was saved or submitted; subscriptions are not connected.';
    event.target.reset();
  });
})();
