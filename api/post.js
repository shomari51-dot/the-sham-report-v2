/* ================================================================
   TSR — Server-rendered article page
   Served at /post/:slug  (via vercel.json rewrite → /api/post?slug=:slug)
   Renders full HTML from MongoDB for SEO + social link previews.
   ================================================================ */
const { MongoClient } = require('mongodb');

let _client = null;
async function getDb() {
  if (_client) {
    try { await _client.db('admin').command({ ping: 1 }); return _client.db('tsrcms'); }
    catch { _client = null; }
  }
  _client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 6000 });
  await _client.connect();
  return _client.db('tsrcms');
}

/* ── helpers ──────────────────────────────────────────────── */
function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escAttr(s) { return esc(s).replace(/'/g, '&#39;'); }

function absUrl(origin, path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return origin + (path.startsWith('/') ? path : '/' + path);
}

// Inline markdown: bold, italic, code, links, images
function inline(text) {
  let t = esc(text);
  t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g,
        (m, alt, src) => `<img src="${escAttr(src)}" alt="${escAttr(alt)}" class="post-inline-img">`);
  t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,
        (m, txt, url) => `<a href="${escAttr(url)}">${txt}</a>`);
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
  t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
  return t;
}

// Block-level markdown → HTML
function renderBody(md) {
  const lines = String(md || '').replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let para = [];
  let list = null; // 'ul'

  const flushPara = () => { if (para.length) { html.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (list) { html.push(`</${list}>`); list = null; } };

  for (let raw of lines) {
    const line = raw.replace(/\s+$/,'');
    const trimmed = line.trim();

    if (!trimmed) { flushPara(); flushList(); continue; }

    let m;
    if ((m = trimmed.match(/^(#{1,4})\s+(.*)$/))) {
      flushPara(); flushList();
      const lvl = m[1].length + 1; // h2..h5
      html.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`);
    } else if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      flushPara(); flushList();
      html.push('<hr>');
    } else if ((m = trimmed.match(/^>\s?(.*)$/))) {
      flushPara(); flushList();
      html.push(`<blockquote>${inline(m[1])}</blockquote>`);
    } else if ((m = trimmed.match(/^[-*]\s+(.*)$/))) {
      flushPara();
      if (!list) { list = 'ul'; html.push('<ul>'); }
      html.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = trimmed.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/))) {
      flushPara(); flushList();
      html.push(`<figure class="post-figure"><img src="${escAttr(m[2])}" alt="${escAttr(m[1])}">${m[1] ? `<figcaption>${esc(m[1])}</figcaption>` : ''}</figure>`);
    } else {
      flushList();
      para.push(trimmed);
    }
  }
  flushPara(); flushList();
  return html.join('\n');
}

function stripMd(md) {
  return String(md || '')
    .replace(/[#>*`_\-]/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ').trim();
}

/* ── nav + footer (site-consistent, absolute paths) ───────── */
const NAV = `
<div class="utility-bar"><div class="container"><div class="util-icons">
  <a href="/" aria-label="Facebook"><img src="/assets/icons/facebook.svg" alt="Facebook" width="18" height="18"></a>
  <a href="/" aria-label="Instagram"><img src="/assets/icons/instagram.svg" alt="Instagram" width="18" height="18"></a>
  <a href="/" aria-label="X"><img src="/assets/icons/x.svg" alt="X" width="18" height="18"></a>
  <a href="/" aria-label="TikTok"><img src="/assets/icons/tiktok.svg" alt="TikTok" width="18" height="18"></a>
  <a href="/" aria-label="YouTube"><img src="/assets/icons/youtube.svg" alt="YouTube" width="18" height="18"></a>
</div></div></div>
<nav class="primary-nav"><div class="nav-inner">
  <a href="/index.html" style="text-decoration:none;line-height:0;"><img src="/logo.svg" alt="The Sham Report" height="50"></a>
  <ul class="nav-links" role="list">
    <li><a href="/news.html">NEWS</a></li>
    <li><a href="/tournaments.html">TOURNAMENTS</a></li>
    <li><a href="/hosted-games.html">HOSTED GAMES</a></li>
    <li><a href="/media.html">MEDIA</a></li>
    <li><a href="/about.html">ABOUT</a></li>
  </ul>
  <a href="/news.html" class="btn-nav-subscribe" style="text-decoration:none;">SUBSCRIBE</a>
</div></nav>`;

const FOOTER = `
<footer class="site-footer" role="contentinfo"><div class="container">
  <a href="/index.html" style="display:inline-block;line-height:0;margin-bottom:28px;"><img src="/logo.svg" alt="The Sham Report" height="50"></a>
  <nav class="footer-nav" aria-label="Footer navigation">
    <a href="/news.html">News</a><a href="/tournaments.html">Tournaments</a>
    <a href="/hosted-games.html">Hosted Games</a><a href="/media.html">Media</a><a href="/about.html">About</a>
  </nav>
  <div class="footer-divider"></div>
  <p class="footer-copy">&copy; 2026 The Sham Report. All Rights Reserved. Texas Poker. Unfiltered.</p>
</div></footer>`;

const STYLES = `
  .post-wrap { max-width: 760px; margin: 0 auto; padding: 56px 24px 80px; }
  .post-back { display:inline-block; color:#D4AF37; font-family:'Inter',sans-serif; font-size:13px;
               letter-spacing:.08em; text-transform:uppercase; text-decoration:none; margin-bottom:28px; }
  .post-back:hover { text-decoration:underline; }
  .post-cats { color:#D4AF37; font-family:'Inter',sans-serif; font-size:12px; font-weight:600;
               letter-spacing:.18em; text-transform:uppercase; margin-bottom:16px; }
  .post-title { font-family:'Playfair Display',Georgia,serif; font-weight:900; color:#fff;
                font-size:clamp(32px,5vw,52px); line-height:1.08; letter-spacing:-.01em; margin-bottom:18px; }
  .post-deck { font-family:'Inter',sans-serif; font-size:clamp(16px,1.4vw,19px); color:#CCC;
               line-height:1.6; margin-bottom:22px; }
  .post-meta { display:flex; gap:14px; align-items:center; font-family:'Inter',sans-serif; font-size:13px;
               color:#888; letter-spacing:.04em; border-top:1px solid #2A2A2A; border-bottom:1px solid #2A2A2A;
               padding:14px 0; margin-bottom:32px; }
  .post-meta .author { color:#D4AF37; font-weight:600; }
  .post-hero { width:100%; border:1px solid #2A2A2A; margin-bottom:36px; display:block; }
  .post-body { font-family:'Inter',sans-serif; font-size:17px; line-height:1.8; color:#E2E2E2; }
  .post-body p { margin:0 0 22px; }
  .post-body h2 { font-family:'Playfair Display',serif; color:#fff; font-size:28px; margin:40px 0 16px; }
  .post-body h3 { font-family:'Playfair Display',serif; color:#fff; font-size:22px; margin:32px 0 14px; }
  .post-body h4,.post-body h5 { color:#fff; font-size:18px; margin:26px 0 12px; }
  .post-body a { color:#D4AF37; text-decoration:underline; }
  .post-body strong { color:#fff; }
  .post-body ul { margin:0 0 22px; padding-left:22px; }
  .post-body li { margin-bottom:10px; }
  .post-body blockquote { border-left:3px solid #D4AF37; margin:28px 0; padding:6px 0 6px 22px;
                          color:#fff; font-style:italic; font-size:20px; line-height:1.6; }
  .post-body hr { border:none; border-top:1px solid #2A2A2A; margin:40px 0; }
  .post-body code { background:#1A1A1A; padding:2px 6px; border-radius:3px; font-size:.9em; color:#D4AF37; }
  .post-figure { margin:32px 0; } .post-figure img { width:100%; border:1px solid #2A2A2A; display:block; }
  .post-figure figcaption { color:#888; font-size:13px; margin-top:8px; text-align:center; }
  .post-inline-img { max-width:100%; }
  .post-foot-rule { max-width:760px; margin:48px auto 0; border-top:1px solid #2A2A2A; }
  .post-404 { text-align:center; padding:120px 24px; }
  .post-404 h1 { font-family:'Playfair Display',serif; color:#fff; font-size:48px; margin-bottom:14px; }
  .post-404 p { color:#999; margin-bottom:24px; }`;

function page({ head, bodyHtml, status }) {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
${head}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/css/styles.css">
<style>${STYLES}</style>
</head><body>
${NAV}
${bodyHtml}
${FOOTER}
<script src="/js/main.js"></script>
</body></html>`;
}

module.exports = async (req, res) => {
  const slug = (req.query.slug || '').toString();
  const origin = 'https://' + (req.headers['x-forwarded-host'] || req.headers.host || 'www.theshamreport.com');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // 404 helper
  const notFound = () => {
    res.status(404).send(page({
      status: 404,
      head: `<title>Article Not Found — The Sham Report</title><meta name="robots" content="noindex">`,
      bodyHtml: `<div class="post-404"><h1>404</h1><p>This article doesn't exist or has been moved.</p>
        <a class="post-back" href="/news.html">← Back to News</a></div>`
    }));
  };

  let art;
  try {
    const db = await getDb();
    art = await db.collection('articles').findOne({ slug });
  } catch (err) {
    console.error('Post render DB error:', err.message);
    res.status(500).send(page({
      head: `<title>The Sham Report</title><meta name="robots" content="noindex">`,
      bodyHtml: `<div class="post-404"><h1>Temporarily Unavailable</h1><p>Please try again shortly.</p></div>`
    }));
    return;
  }

  if (!art || art.status !== 'published') return notFound();

  const cats   = (art.categories || []).join('  |  ');
  const desc   = (art.seo && art.seo.metaDescription) || art.deck || stripMd(art.body).slice(0, 155);
  const title  = (art.seo && art.seo.metaTitle) || art.title;
  const canon  = origin + '/post/' + art.slug;
  const ogImg  = absUrl(origin, art.heroImage);

  const head = `
<title>${esc(title)} — The Sham Report</title>
<meta name="description" content="${escAttr(desc)}">
<link rel="canonical" href="${escAttr(canon)}">
<meta property="og:type" content="article">
<meta property="og:title" content="${escAttr(art.title)}">
<meta property="og:description" content="${escAttr(desc)}">
<meta property="og:url" content="${escAttr(canon)}">
${ogImg ? `<meta property="og:image" content="${escAttr(ogImg)}">` : ''}
<meta property="og:site_name" content="The Sham Report">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escAttr(art.title)}">
<meta name="twitter:description" content="${escAttr(desc)}">
${ogImg ? `<meta name="twitter:image" content="${escAttr(ogImg)}">` : ''}
<script type="application/ld+json">${JSON.stringify({
  '@context':'https://schema.org','@type':'NewsArticle',
  headline: art.title, description: desc,
  image: ogImg || undefined,
  datePublished: art.publishedAt, dateModified: art.updatedAt,
  author: art.author ? { '@type':'Person', name: art.author } : undefined,
  publisher: { '@type':'Organization', name:'The Sham Report' },
  mainEntityOfPage: canon
})}</script>`;

  const heroHtml = art.heroImage
    ? `<img class="post-hero" src="${escAttr(absUrl(origin, art.heroImage))}" alt="${escAttr(art.title)}">` : '';
  const metaBits = [];
  if (art.author) metaBits.push(`<span class="author">${esc(art.author)}</span>`);
  if (art.date)   metaBits.push(`<span>${esc(art.date)}</span>`);

  const bodyHtml = `
<article class="post-wrap">
  <a class="post-back" href="/news.html">← Back to News</a>
  ${cats ? `<div class="post-cats">${esc(cats)}</div>` : ''}
  <h1 class="post-title">${esc(art.title)}</h1>
  ${art.deck ? `<p class="post-deck">${esc(art.deck)}</p>` : ''}
  ${metaBits.length ? `<div class="post-meta">${metaBits.join('')}</div>` : ''}
  ${heroHtml}
  <div class="post-body">${renderBody(art.body)}</div>
</article>
<div class="post-foot-rule"></div>`;

  res.status(200).send(page({ head, bodyHtml }));
};
