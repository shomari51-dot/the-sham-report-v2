/* ================================================================
   TSR CMS — Published grades (the Tournament Index feed)

   GET    /api/grades?limit=6  →  published grades, newest first
   POST   /api/grades          →  publish one grade   (auth required)
   DELETE /api/grades?id=...   →  unpublish one grade (auth required)

   Writes are admin-only on purpose. The calculator is public and
   ungated, so anything a visitor scores stays in their browser; a
   grade only becomes part of the Index when it is published from the
   admin, which is what keeps the rail an editorial surface rather
   than an open guestbook.
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

/* ── Seed set ──────────────────────────────────────────────────
   The five reference structures, scored by the engine as it stands.
   Served when the collection is empty or the database is unreachable
   so the homepage rail is never blank. Publishing anything replaces
   them in the feed.                                                */
const SEED = [
  { id: 'seed-lone-star',  name: 'Lone Star Showdown',     room: 'TCH Dallas',             city: 'Dallas',      type: 'weekly', day: 'Thursdays',  grade: 'A',  base: 'A', score: 51.4, buyin: 250, vig: 16.0, tier: 1, smooth: true, date: 'Last verified Aug 9, 2026',  seed: true },
  { id: 'seed-thirty',     name: 'Thirty Throwdown',       room: 'Palace Poker',           city: 'Houston',     type: 'weekly', day: 'Tuesdays',   grade: 'C',  base: 'C', score: 35.1, buyin: 150, vig: 20.0, tier: 1, smooth: true, date: 'Last verified Aug 9, 2026',  seed: true },
  { id: 'seed-champ-9',    name: 'Championship Series #9', room: 'Lodge Card Club',        city: 'Austin',      type: 'series', day: '',           grade: 'C−', base: 'C', score: 54.3, buyin: 310, vig: 20.0, tier: 2, smooth: true, date: 'Played Aug 8, 2026',         seed: true },
  { id: 'seed-friday',     name: 'Friday Night Lights',    room: 'San Antonio Card House', city: 'San Antonio', type: 'weekly', day: 'Fridays',    grade: 'D+', base: 'D', score: 30.6, buyin: 200, vig: 19.0, tier: 1, smooth: true, date: 'Last verified Aug 7, 2026',  seed: true },
  { id: 'seed-mega-turbo', name: 'Mega Stack Turbo',       room: 'Local Room',             city: 'Austin',      type: 'weekly', day: 'Wednesdays', grade: 'F',  base: 'F', score: 14.2, buyin: 120, vig: 23.3, tier: 1, smooth: true, date: 'Last verified Aug 7, 2026',  seed: true }
];

function authed(req) {
  const secret = process.env.ADMIN_SECRET;
  return !!secret && req.headers['x-admin-secret'] === secret;
}

/* Accept only the fields the rail and the calculator need, coerced to
   the right types, so a malformed or oversized body cannot land in the
   collection or reach the page as markup. */
function clean(body) {
  const str = (v, max) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, max);
  const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

  const name = str(body.name, 90);
  if (!name) return null;

  return {
    id: str(body.id, 64) || 'g' + Date.now().toString(36),
    name,
    room: str(body.room, 90),
    city: str(body.city, 60),
    // How the event recurs. It drives the Type filter on the Tournaments
    // page, and decides whether the card is looked up by the night it
    // runs or the date it ran.
    type: body.type === 'series' ? 'series' : 'weekly',
    day: str(body.day, 12),
    eventDate: str(body.eventDate, 24),
    grade: str(body.grade, 3),
    base: str(body.base, 1),
    score: Math.round(num(body.score) * 10) / 10,
    buyin: num(body.buyin),
    vig: Math.round(num(body.vig) * 10) / 10,
    tier: num(body.tier) === 2 ? 2 : 1,
    smooth: !!body.smooth,
    fmt: body.fmt === 'plo' ? 'plo' : 'nlh',
    date: str(body.date, 24),
    // The calculator's own share fragment, so a card reopens the exact
    // tournament with every input intact and nothing re-keyed.
    hash: str(body.hash, 4000),
    publishedAt: new Date()
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Secret');
  if (req.method === 'OPTIONS') return res.status(200).end();

  /* ── GET ─────────────────────────────────────────────────── */
  if (req.method === 'GET') {
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 50);
    try {
      const db = await getDb();
      const docs = await db.collection('grades')
        .find({}, { projection: { _id: 0 } })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .toArray();
      return res.json({ grades: docs.length ? docs : SEED.slice(0, limit) });
    } catch (err) {
      console.error('Grades read error:', err.message);
      return res.json({ grades: SEED.slice(0, limit) });
    }
  }

  /* ── POST ────────────────────────────────────────────────── */
  if (req.method === 'POST') {
    if (!authed(req)) return res.status(401).json({ error: 'Unauthorized' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

    const doc = clean(body || {});
    if (!doc) return res.status(400).json({ error: 'A tournament name is required' });

    try {
      const db = await getDb();
      await db.collection('grades').replaceOne({ id: doc.id }, doc, { upsert: true });
      return res.json({ success: true, id: doc.id });
    } catch (err) {
      console.error('Grades write error:', err.message);
      return res.status(500).json({ error: 'Failed to publish grade' });
    }
  }

  /* ── DELETE ──────────────────────────────────────────────── */
  if (req.method === 'DELETE') {
    if (!authed(req)) return res.status(401).json({ error: 'Unauthorized' });
    const id = String(req.query.id || '').slice(0, 64);
    if (!id) return res.status(400).json({ error: 'An id is required' });
    try {
      const db = await getDb();
      const r = await db.collection('grades').deleteOne({ id });
      return res.json({ success: true, removed: r.deletedCount });
    } catch (err) {
      console.error('Grades delete error:', err.message);
      return res.status(500).json({ error: 'Failed to remove grade' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
