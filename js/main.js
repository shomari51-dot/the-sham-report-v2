/* ============================================================
   THE SHAM REPORT — main.js
   Handles: ticker build, subscribe modal, mobile nav
   ============================================================ */

// ── Ticker ──────────────────────────────────────────────────
async function buildTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  let headlines = [];

  try {
    const res = await fetch('content/ticker.txt');
    const text = await res.text();
    headlines = text.split('|').map(s => s.trim()).filter(Boolean);
  } catch {
    headlines = [
      'Houston\'s Lone Star Social Club reports record $2.1M in tournament payouts',
      'Dallas underground circuit faces third consecutive raid in Uptown corridor',
      'WSOP Circuit stop confirmed for San Antonio — first Texas satellite in four years',
      'House Bill 4417 stalls in committee — legal poker clubs remain in limbo',
      'Legendary road gambler "Tex" Morada surfaces in Austin after two-year absence'
    ];
  }

  const SEP = '<span class="ticker-sep">&#9830;</span>';

  // Double the list so seamless loop works
  const allHeadlines = [...headlines, ...headlines];
  track.innerHTML = allHeadlines
    .map(h => `<span class="ticker-item">${h}</span>${SEP}`)
    .join('');

  // Measure natural width and set animation duration proportionally
  requestAnimationFrame(() => {
    const halfWidth = track.scrollWidth / 2;
    const speed = 80; // px per second
    const duration = halfWidth / speed;
    track.style.animationDuration = `${duration}s`;
  });
}

// ── Subscribe Modal ──────────────────────────────────────────
function initModal() {
  const overlay    = document.getElementById('subscribe-modal');
  const closeBtn   = document.getElementById('modal-close');
  const form       = document.getElementById('modal-form');
  const success    = document.getElementById('modal-success');
  const triggers   = document.querySelectorAll('[data-modal="subscribe"]');

  if (!overlay) return;

  const open  = () => overlay.classList.add('open');
  const close = () => overlay.classList.remove('open');

  triggers.forEach(t => t.addEventListener('click', e => { e.preventDefault(); open(); }));
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value.trim();
    if (!email) return;

    // Store locally
    const stored = JSON.parse(localStorage.getItem('tsr_subscribers') || '[]');
    if (!stored.includes(email)) {
      stored.push(email);
      localStorage.setItem('tsr_subscribers', JSON.stringify(stored));
    }

    form.style.display = 'none';
    success.classList.add('show');

    setTimeout(() => {
      close();
      setTimeout(() => {
        form.style.display = '';
        success.classList.remove('show');
        form.reset();
      }, 400);
    }, 2200);
  });
}

// ── Inline Email Capture (section form) ─────────────────────
function initEmailCapture() {
  const form = document.getElementById('email-capture-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value.trim();
    if (!email) return;

    const stored = JSON.parse(localStorage.getItem('tsr_subscribers') || '[]');
    if (!stored.includes(email)) {
      stored.push(email);
      localStorage.setItem('tsr_subscribers', JSON.stringify(stored));
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'YOU\'RE IN';
    btn.style.background = '#1a5c1a';
    form.querySelector('input').value = '';

    setTimeout(() => {
      btn.textContent = 'SUBSCRIBE';
      btn.style.background = '';
    }, 3000);
  });
}

// ── Mobile Nav ───────────────────────────────────────────────
function initMobileNav() {
  const hamburger = document.getElementById('nav-hamburger');
  const overlay   = document.getElementById('nav-overlay');
  const closeBtn  = document.getElementById('nav-overlay-close');

  if (!hamburger || !overlay) return;

  hamburger.addEventListener('click', () => overlay.classList.add('open'));
  closeBtn.addEventListener('click',  () => overlay.classList.remove('open'));

  overlay.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => overlay.classList.remove('open'));
  });
}

// ── Nav Scroll Shadow ────────────────────────────────────────
function initNavScroll() {
  const nav = document.querySelector('.primary-nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildTicker();
  initModal();
  initEmailCapture();
  initMobileNav();
  initNavScroll();
});
