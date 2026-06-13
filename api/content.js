/* ================================================================
   TSR CMS — Content API
   GET  /api/content?page=homepage  →  returns page content
   POST /api/content                →  saves page content (auth required)
   ================================================================ */
const { MongoClient } = require('mongodb');

let _client = null;

async function getDb() {
  if (_client) {
    try {
      await _client.db('admin').command({ ping: 1 });
      return _client.db('tsrcms');
    } catch {
      _client = null;
    }
  }
  _client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 6000 });
  await _client.connect();
  return _client.db('tsrcms');
}

/* ── Default content (mirrors current live homepage) ───────── */
const DEFAULT_CONTENT = {
  page: 'homepage',
  ticker: [
    "Houston's Lone Star Social Club reports record $2.1M in tournament payouts for Q1 2026",
    "Dallas underground circuit faces third consecutive raid in Uptown corridor",
    "WSOP Circuit stop confirmed for San Antonio — first Texas satellite in four years",
    "High-stakes PLO game at private Midland club draws federal scrutiny",
    "Legendary road gambler \"Tex\" Morada surfaces in Austin after two-year absence",
    "House Bill 4417 stalls in committee — legal poker clubs remain in limbo",
    "Beaumont card room operator charged with running unlicensed game exceeding $500K rake",
    "Texas Hold'em legend Creed \"The Iceman\" Holloway announces retirement after 22-year circuit run"
  ],
  hero: {
    categories: ['Investigation', 'Exclusive'],
    headline: 'The Texas High<br>Roller Circuit',
    subtext: 'Beneath the neon lights and behind closed doors, a new era of unbridled aggression defines the highest stakes in the Lone Star State. We go inside the underground rooms reshaping global poker.',
    ctaText: 'Read the Investigation',
    ctaLink: '#',
    backgroundImage: 'images/IMG_3745.jpg'
  },
  latestReports: [
    {
      id: 1,
      image: 'images/DSC00353.jpg',
      categories: ['Tournaments', 'Exclusive'],
      headline: 'The $50M Pot That Changed Everything in Dallas',
      date: 'Nov 14, 2024',
      link: '#'
    },
    {
      id: 2,
      image: 'images/IMG_2338.JPG',
      categories: ['Players', 'Profile'],
      headline: "Unmasking 'The Ghost': Poker's Most Private Pro",
      date: 'Nov 12, 2024',
      link: '#'
    },
    {
      id: 3,
      image: 'images/DSC00359.JPG',
      categories: ['Legal', 'Analysis'],
      headline: 'New Texas Regulations: The Death of the Social Club?',
      date: 'Nov 10, 2024',
      link: '#'
    }
  ],
  tournamentResults: {
    results: [
      { champion: '[Champion TBD]', tournament: 'TCH Dallas Main Event',       prize: '$42,000' },
      { champion: '[Champion TBD]', tournament: 'Poker Club of Texas Series',  prize: '$18,500' },
      { champion: '[Champion TBD]', tournament: 'Houston Poker Open',          prize: '$24,000' }
    ],
    standingsLink: '#',
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
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Secret');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const page = req.query.page || 'homepage';

  /* ── GET ─────────────────────────────────────────────────── */
  if (req.method === 'GET') {
    try {
      const db  = await getDb();
      const doc = await db.collection('pages').findOne({ page }, { projection: { _id: 0 } });
      return res.json(doc || { ...DEFAULT_CONTENT, page });
    } catch (err) {
      console.error('DB read error:', err.message);
      // Graceful fallback — site still works if DB is down
      return res.json({ ...DEFAULT_CONTENT, page });
    }
  }

  /* ── POST ────────────────────────────────────────────────── */
  if (req.method === 'POST') {
    if (!req.headers['x-admin-secret'] || req.headers['x-admin-secret'] !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
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
