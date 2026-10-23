const {guard, isAdmin} = require('../lib/auth');
/* ================================================================
   TSR CMS — Content API
   GET  /api/content?page=homepage  →  returns page content
   POST /api/content                →  saves page content (auth required)
   ================================================================ */
const {getDb,assertWritableDb} = require('../lib/db');


/* ── Default content (mirrors current live homepage) ───────── */
const DEFAULT_CONTENT = {
  page: 'homepage',
  ticker: [],
  hero: {
    categories: ['Investigation', 'Exclusive'],
    headline: 'The Texas High<br>Roller Circuit',
    subtext: 'Beneath the neon lights and behind closed doors, a new era of unbridled aggression defines the highest stakes in the Lone Star State. We go inside the underground rooms reshaping global poker.',
    ctaText: 'Read the Investigation',
    ctaLink: '#',
    backgroundImage: 'images/IMG_3745.jpg'
  },
  latestReports: [],
  tournamentResults: {
    spotlight: {
      image:    'images/anthony-tch-kickoff.jpg',
      headline: 'Anthony Takes Down the Lone Star Kick Off — TCH Signature Series',
      body:     '403 entries. $132,990 prize pool. Anthony outlasted them all to take first place. What a way to start the series.'
    }
  },
  emailCapture: {
    headline:   'STAY ON THE FELT',
    subtext:    'Get exclusive investigations, tournament reports, and breaking news from the Texas poker scene delivered to your inbox.',
    buttonText: 'Subscribe',
    finePrint:  'No Fluff. No Spam. Only the Cards.'
  },
  footer: {
    copyright: '© 2026 The Sham Report. All Rights Reserved. Texas Poker. Unfiltered.',
    tagline:   'TEXAS POKER. UNFILTERED.'
  },
  logo: {
    tsrText:        'TSR',
    shamReportText: 'THE SHAM\nREPORT',
    bgColor:        '#D4AF37',
    link:           '/'
  },
  socialMedia: {
    facebook:  { url: '#', visible: true },
    instagram: { url: '#', visible: true },
    x:         { url: '#', visible: true },
    tiktok:    { url: '#', visible: true },
    youtube:   { url: '#', visible: true }
  },
  subscribeButton: {
    text:    'SUBSCRIBE',
    link:    '',
    visible: true
  }
};

module.exports = async (req, res) => {
  if (!guard(req,res)) return;
  if (['POST','DELETE'].includes(req.method)) {
    if (!isAdmin(req)) return res.status(401).json({error:'Unauthorized'});
    try { assertWritableDb(); } catch(err) {return res.status(409).json({error:err.message,code:err.code});}
  }

  const page = req.query.page || 'homepage';

  /* ── GET ─────────────────────────────────────────────────── */
  if (req.method === 'GET') {
    try {
      const db  = await getDb();
      const doc = await db.collection('pages').findOne({ page }, { projection: { _id: 0 } });
      const out = { ...(doc || DEFAULT_CONTENT), page, ticker: [] };
      out.latestReports = (out.latestReports || []).filter(r => /trailblazer-stop-2|rungood-houston/.test(r.link || ''));
      if (out.tournamentResults) out.tournamentResults = { ...out.tournamentResults, results: [] };
      return res.json(out);
    } catch (err) {
      console.error('DB read error:', err.message);
      // Graceful fallback — site still works if DB is down
      return res.json({ ...DEFAULT_CONTENT, page, ticker: [] });
    }
  }

  /* ── POST ────────────────────────────────────────────────── */
  if (req.method === 'POST') {

    try {
      const db   = await getDb();
      const body = { ...req.body, page: req.body.page || page, updatedAt: new Date() };
      delete body._id;
      await db.collection('pages').replaceOne({ page: body.page }, body, { upsert: true });
      return res.json({ success: true });
    } catch (err) {
      console.error('DB write error:', err.message);
      return res.status(500).json({ error: 'Failed to save content' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
