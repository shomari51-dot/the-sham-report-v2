/* ================================================================
   TSR CMS — Content Applier  (cms-content.js)
   Fetches CMS content from the API and patches the live page DOM.
   Runs after DOMContentLoaded. Falls back silently on any error.
   ================================================================ */
(function () {

  /* Escape HTML to prevent XSS in user-entered content */
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function applyContent() {
    let content;
    try {
      const res = await fetch('/api/content?page=homepage');
      if (!res.ok) return;
      content = await res.json();
    } catch { return; }
    if (!content) return;

    /* Store globally so main.js ticker can use it */
    window.__TSR_CMS = content;

    /* ── 1. Ticker ───────────────────────────────────────────── */
    if (content.ticker && content.ticker.length) {
      const track = document.getElementById('ticker-track');
      if (track) {
        const sep = '<span class="ticker-sep">&#9830;</span>';
        const all = [...content.ticker, ...content.ticker];
        track.innerHTML = all.map(h => `<span class="ticker-item">${esc(h)}</span>${sep}`).join('');
        requestAnimationFrame(() => {
          const halfWidth = track.scrollWidth / 2;
          track.style.animationDuration = `${halfWidth / 80}s`;
        });
      }
    }

    /* ── 2. Logo (nav + footer) ─────────────────────────────── */
    if (content.logo) {
      const l = content.logo;
      const lines = (l.shamReportText || 'THE SHAM\nREPORT').split(/\n| {2,}/);
      const logoHTML = `
        <a href="${esc(l.link || '/')}" style="text-decoration:none;padding:0;margin:0;display:inline-flex;align-items:center;gap:12px;line-height:1;">
          <div style="background:${esc(l.bgColor || '#D4AF37')};color:#0A0A0A;font-family:'Playfair Display',serif;font-size:17px;font-weight:900;padding:8px 12px;letter-spacing:0.03em;flex-shrink:0;">${esc(l.tsrText || 'TSR')}</div>
          <div style="color:#FFFFFF;font-family:'Inter',sans-serif;font-size:10.5px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;line-height:1.4;">${lines.map(esc).join('<br>')}</div>
        </a>`;
      /* Nav logo */
      const navInner = document.querySelector('.nav-inner');
      if (navInner) {
        const navLogo = navInner.querySelector('a:first-child');
        if (navLogo) navLogo.outerHTML = logoHTML;
      }
      /* Footer logo */
      const footer = document.querySelector('.site-footer');
      if (footer) {
        const fLogo = footer.querySelector('a[href*="index"], a[href="/"]');
        if (fLogo) fLogo.outerHTML = logoHTML;
      }
    }

    /* ── 3. Subscribe Button ─────────────────────────────────── */
    if (content.subscribeButton) {
      const sb = content.subscribeButton;
      document.querySelectorAll('.btn-nav-subscribe').forEach(btn => {
        btn.style.display = sb.visible === false ? 'none' : '';
        if (sb.text) btn.textContent = sb.text;
        if (sb.link) {
          btn.removeAttribute('data-modal');
          btn.onclick = (e) => { e.preventDefault(); window.open(sb.link, '_blank'); };
        }
      });
    }

    /* ── 4. Social Media ─────────────────────────────────────── */
    if (content.socialMedia) {
      const sm = content.socialMedia;
      const platformMap = {
        'facebook': 'facebook', 'instagram': 'instagram',
        'x': 'x', 'twitter': 'x', 'tiktok': 'tiktok', 'youtube': 'youtube'
      };
      document.querySelectorAll('.util-icons a, .footer-socials a').forEach(link => {
        const label = (link.getAttribute('aria-label') || '').toLowerCase().replace(/[^a-z]/g, '');
        const key   = platformMap[label];
        if (key && sm[key]) {
          link.style.display = sm[key].visible === false ? 'none' : '';
          if (sm[key].url && sm[key].url !== '#') link.href = sm[key].url;
        }
      });
    }

    /* ── 5. Hero ─────────────────────────────────────────────── */
    if (content.hero) {
      const h = content.hero;
      const bgImg = document.querySelector('.hero-bg-image');
      if (bgImg && h.backgroundImage) bgImg.src = h.backgroundImage;

      const heroCat = document.querySelector('.hero-category');
      if (heroCat && h.categories) heroCat.innerHTML = h.categories.map(esc).join(' · ');

      const heroH1 = document.querySelector('.hero-headline');
      if (heroH1 && h.headline) heroH1.innerHTML = h.headline; /* allow <br> */

      const heroDeck = document.querySelector('.hero-deck');
      if (heroDeck && h.subtext) heroDeck.textContent = h.subtext;

      const heroCta = document.querySelector('.btn-hero');
      if (heroCta) {
        if (h.ctaText) heroCta.textContent = h.ctaText + '  →';
        if (h.ctaLink) heroCta.href = h.ctaLink;
      }
    }

    /* ── 6. Latest Reports ───────────────────────────────────── */
    if (content.latestReports && content.latestReports.length) {
      const grid = document.querySelector('.card-grid');
      if (grid) {
        const tones = ['tone-1', 'tone-2', 'tone-3'];
        grid.innerHTML = content.latestReports.map((card, i) => `
          <article class="article-card" style="cursor:${card.link && card.link !== '#' ? 'pointer' : 'default'}" onclick="${card.link && card.link !== '#' ? `window.location='${card.link}'` : ''}">
            <div class="card-img ${tones[i % 3]}">
              <img src="${esc(card.image)}" alt="${esc(card.headline)}" class="card-img-photo" loading="lazy">
            </div>
            <div class="card-body">
              <p class="card-tags">${(card.categories || []).map(esc).join('&nbsp;&nbsp;|&nbsp;&nbsp;')}</p>
              <h3 class="card-headline">${esc(card.headline)}</h3>
              <div class="card-divider"></div>
              <div class="card-meta">
                <span class="card-date">${esc(card.date)}</span>
                <span class="card-arrow" aria-hidden="true">↗</span>
              </div>
            </div>
          </article>`).join('');
      }
    }

    /* ── 7. Tournament Results ───────────────────────────────── */
    if (content.tournamentResults) {
      const tr = content.tournamentResults;

      const list = document.querySelector('.results-list');
      if (list && tr.results) {
        list.innerHTML = tr.results.map((r, i) => `
          <li class="result-entry">
            <span class="result-num">${String(i + 1).padStart(2, '0')}</span>
            <div>
              <p class="result-player">${esc(r.champion)}</p>
              <p class="result-detail">${esc(r.tournament)}</p>
            </div>
            <span class="result-prize">${esc(r.prize)}</span>
          </li>`).join('');
      }

      const standingsA = document.querySelector('.results-footer a');
      if (standingsA && tr.standingsLink) standingsA.href = tr.standingsLink;

      if (tr.spotlight) {
        const sp = tr.spotlight;
        const spImg = document.querySelector('.spotlight-photo img');
        if (spImg && sp.image) { spImg.src = sp.image; spImg.alt = sp.headline || ''; }

        const spBody = document.querySelector('.spotlight-body');
        if (spBody) {
          const ps = spBody.querySelectorAll('p');
          if (ps[0] && sp.headline) ps[0].textContent = sp.headline;
          if (ps[1] && sp.body)     ps[1].textContent = sp.body;
        }
      }
    }

    /* ── 8. Email Capture ────────────────────────────────────── */
    if (content.emailCapture) {
      const ec = content.emailCapture;
      const title = document.querySelector('.email-capture-title');
      const sub   = document.querySelector('.email-capture-sub');
      const btn   = document.querySelector('.btn-email-submit');
      const disc  = document.querySelector('.email-disclaimer');
      if (title && ec.headline)   title.textContent = ec.headline;
      if (sub   && ec.subtext)    sub.textContent   = ec.subtext;
      if (btn   && ec.buttonText) btn.textContent   = ec.buttonText;
      if (disc  && ec.finePrint)  disc.textContent  = ec.finePrint;
    }

    /* ── 9. Footer ───────────────────────────────────────────── */
    if (content.footer) {
      const copy = document.querySelector('.footer-copy');
      if (copy && content.footer.copyright) copy.textContent = content.footer.copyright;
      const tag = document.querySelector('.footer-tagline');
      if (tag && content.footer.tagline) tag.textContent = content.footer.tagline;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyContent);
  } else {
    applyContent();
  }
})();
