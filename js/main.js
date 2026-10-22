/* ============================================================
   THE SHAM REPORT — main.js
   Handles: subscribe modal, mobile nav
   ============================================================ */

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
  initModal();
  initEmailCapture();
  initMobileNav();
  initNavScroll();
});
