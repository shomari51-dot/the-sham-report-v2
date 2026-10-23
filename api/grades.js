const {guard, isAdmin} = require('../lib/auth');
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
const {getDb} = require('../lib/db');


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

module.exports = async (req, res) => {
  if (!guard(req,res)) return;

  /* ── GET ─────────────────────────────────────────────────── */
  if (req.method === 'GET') {
    if (req.query.include === 'all' && !isAdmin(req)) return res.status(401).json({error:'Unauthorized'});
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 6, 1), 50);
    try {
      const db = await getDb();
      const docs = await db.collection('grades')
        .find(req.query.include === 'all' ? {} : {$or:[{status:'published'},{status:{$exists:false}}]}, { projection: { _id: 0 } })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .toArray();
      return res.json({ grades: docs });
    } catch (err) {
      console.error('Grades read error:', err.message);
      return res.json({ grades: SEED.slice(0, limit) });
    }
  }

  /* ── POST ────────────────────────────────────────────────── */
  if (req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

    try {
      const db = await getDb();
      body = body || {};
      if (!String(body.name || '').trim()) return res.status(400).json({error:'A tournament name is required'});
      const id = String(body.id || 'g'+Date.now().toString(36)).slice(0,64);
      const col = db.collection('grades');
      const previous = await col.findOne({id});
      const doc = require('../lib/grading').withHistory({...previous,...body,id, publishedAt:previous?.publishedAt || new Date()},previous,'admin');
      delete doc._id;
      await col.updateOne({id},{$set:doc},{upsert:true});
      return res.json({ success: true, id: doc.id });
    } catch (err) {
      console.error('Grades write error:', err.message);
      return res.status(err instanceof TypeError ? 400 : 500).json({ error: err instanceof TypeError ? err.message : 'Failed to publish grade' });
    }
  }

  /* ── DELETE ──────────────────────────────────────────────── */
  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const id = String(req.query.id || '').slice(0, 64);
    if (!id) return res.status(400).json({ error: 'An id is required' });
    try {
      const db = await getDb();
      const col = db.collection('grades');
      const previous = await col.findOne({id});
      if (!previous) return res.json({success:true,removed:0});
      const doc = require('../lib/grading').withHistory({...previous,status:'retracted'},previous,'admin');
      delete doc._id;
      const r = await col.updateOne({id},{$set:doc});
      return res.json({ success: true, removed: r.modifiedCount });
    } catch (err) {
      console.error('Grades delete error:', err.message);
      return res.status(500).json({ error: 'Failed to remove grade' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
