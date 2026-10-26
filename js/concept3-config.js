window.TSR_CONFIG = {
  "features": {
    "hostedGamesNav": false
  },
  "contacts": {
    "editor": {
      "address": "editor@theshamreport.com",
      "enabled": false,
      "status": "Staged \u2014 Pending Mailbox Confirmation"
    },
    "news": {
      "address": "news@theshamreport.com",
      "enabled": false,
      "status": "Staged \u2014 Pending Mailbox Confirmation"
    },
    "corrections": {
      "address": "corrections@theshamreport.com",
      "enabled": false,
      "status": "Staged \u2014 Pending Mailbox Confirmation"
    }
  },
  "socials": {
    "x": {
      "url": "https://x.com/The_ShamReport",
      "enabled": true
    },
    "facebook": {
      "url": "https://www.facebook.com/shomari.l.williams",
      "enabled": true
    },
    "instagram": {
      "url": "",
      "enabled": false
    },
    "youtube": {
      "url": "https://youtube.com/@theshamreport",
      "enabled": true
    },
    "tiktok": {
      "url": "https://www.tiktok.com/@theshamreport",
      "enabled": true
    }
  }
};

(() => {const icons={x:'<path d="M18 2h3l-7 8 8 12h-6l-5-7-6 7H2l8-10L2 2h6l5 6zm-1 18h2L7 4H5z"/>',youtube:'<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 6 3-6 3z" fill="black"/>',facebook:'<path d="M14 22v-9h3l.5-4H14V7c0-1 .5-2 2-2h2V1h-3c-4 0-5 3-5 6v2H7v4h3v9z"/>',tiktok:'<path d="M14 2h4c0 3 2 5 5 5v4a10 10 0 0 1-5-2v8a7 7 0 1 1-7-7v4a3 3 0 1 0 3 3z"/>'};for(const host of document.querySelectorAll('.c3-top,.c3-footrow')){const nav=document.createElement('nav');nav.className='c3-socials';nav.setAttribute('aria-label','Follow The Sham Report');for(const [key,icon] of Object.entries(icons)){const item=window.TSR_CONFIG.socials[key];if(!item?.enabled||!item.url.startsWith('https://'))continue;const a=document.createElement('a');a.href=item.url;a.target='_blank';a.rel='noopener noreferrer';a.setAttribute('aria-label','The Sham Report on '+key);a.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">'+icon+'</svg>';nav.append(a);}if(nav.children.length)host.append(nav);}})();
