(() => {
  'use strict';
  const data = window.CONCEPT3_DATA;
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function story(item) {
    const content = `<img src="${esc(item.image)}" alt="${esc(item.alt)}" loading="lazy"><div><p class="c3-meta"><span>${esc(item.category)}</span></p><h3>${esc(item.title)}</h3><p>${esc(item.description)}</p></div>`;
    return item.url ? `<a class="c3-story" href="${esc(item.url)}">${content}</a>` : `<article class="c3-story">${content}</article>`;
  }
  document.getElementById('lead-stories').innerHTML = data.stories.slice(1).map(story).join('');
  document.getElementById('latest-stories').innerHTML = data.stories.map(story).join('');
  document.getElementById('grade-rows').innerHTML = data.grades.map(g => `<tr><td>${esc(g.grade)}</td><td>${esc(g.score)}</td><td>${esc(g.event)}<small>Series curve · v1.0</small></td><td>${esc(g.venue)}</td><td>${esc(g.buyin)}</td><td>${esc(g.time)}</td></tr>`).join('');
  document.getElementById('media-rows').innerHTML = data.reels.map(r => `<a class="c3-story" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer"><div class="c3-thumb"><img src="${esc(r.image)}" alt="${r.alt}" loading="lazy"><span class="c3-play" aria-hidden="true">▷</span></div><div><p class="c3-meta"><span>Facebook Reel ↗</span></p><h3>${r.title}</h3><p>Watch on Facebook (opens a new tab).</p></div></a>`).join('');
  document.getElementById('preview-newsletter').addEventListener('submit', event => {
    event.preventDefault();
    document.getElementById('newsletter-status').textContent = 'Preview complete. No email was saved or submitted; subscriptions are not connected.';
    event.target.reset();
  });
})();
