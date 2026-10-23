(() => {
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const d=window.CONCEPT3_DATA,slug=new URLSearchParams(location.search).get('slug'),mount=document.getElementById('article-content');
 if(!slug){mount.innerHTML=d.stories.map(s=>`<p><a href="${esc(s.url)}">${esc(s.title)}</a></p>`).join('');return;}
 const a=d.articles.find(a=>a.slug===slug);
 if(!a){mount.innerHTML='<h2>Article not found</h2><a href="news.html">Browse published reporting</a>';return;}
 document.title=a.title+' — The Sham Report';
 document.getElementById('main-content').innerHTML=`<article><h1>${esc(a.title)}</h1><p>${esc(a.deck)}</p><p>By ${esc(a.author)} · ${esc(a.date)} · ${a.categories.map(esc).join(' / ')}</p><aside class="notice"><h2>Editorial Context / Update Note</h2><p>${esc(a.context)}</p><a href="https://www.pokernews.com/news/2026/04/lodge-card-club-poker-room-to-reopen-51144.htm">April 28 timeline reporting</a></aside><figure><img src="${esc(a.heroImage)}" alt="${esc(a.caption)}"><figcaption>${esc(a.caption)} Credit: ${esc(a.credit)}</figcaption></figure>${a.body.split(/\n+/).map(p=>`<p>${esc(p)}</p>`).join('')}<h2>Disclosures</h2><p>${esc(a.disclosures)}</p><h2>Corrections</h2><p>Submit the article URL, disputed statement and supporting source through the publisher’s confirmed contact channel. Mailboxes are staged pending routing confirmation. Substantive changes retain dated revision notes.</p><a href="about.html#corrections">Corrections policy and revisions log</a></article>`;
})();
