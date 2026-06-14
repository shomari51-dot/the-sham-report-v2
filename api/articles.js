/* ================================================================
   TSR CMS — Articles API
   GET    /api/articles                 → list (published only;
                                           includes drafts if admin secret sent)
   GET    /api/articles?slug=xyz         → single full article
   POST   /api/articles                  → create / update  (auth required)
   DELETE /api/articles?slug=xyz         → delete            (auth required)
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

function slugify(s) {
  return String(s || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function isAdmin(req) {
  const secret = req.headers['x-admin-secret'];
  return secret && secret === process.env.ADMIN_SECRET;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Secret');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let db;
  try { db = await getDb(); }
  catch (err) {
    console.error('DB connect error:', err.message);
    return res.status(500).json({ error: 'Database unavailable' });
  }
  const col = db.collection('articles');

  /* ── GET ─────────────────────────────────────────────────── */
  if (req.method === 'GET') {
    const slug = req.query.slug;
    try {
      if (slug) {
        const doc = await col.findOne({ slug }, { projection: { _id: 0 } });
        if (!doc) return res.status(404).json({ error: 'Article not found' });
        return res.json(doc);
      }
      // Listing — drafts visible only to admin
      const filter = isAdmin(req) ? {} : { status: 'published' };
      const list = await col
        .find(filter, { projection: { _id: 0, body: 0 } })
        .sort({ publishedAt: -1, updatedAt: -1 })
        .toArray();
      return res.json(list);
    } catch (err) {
      console.error('Articles read error:', err.message);
      return res.status(500).json({ error: 'Failed to load articles' });
    }
  }

  /* ── POST (create / update) ──────────────────────────────── */
  if (req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    body = body || {};

    const title = String(body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Title is required' });

    let slug = slugify(body.slug || title);
    if (!slug) slug = 'article-' + Date.now();

    const now = new Date();
    const status = body.status === 'published' ? 'published' : 'draft';

    try {
      const existing = await col.findOne({ slug });

      const doc = {
        slug,
        title,
        deck:       String(body.deck || '').trim(),
        categories: Array.isArray(body.categories)
                      ? body.categories.filter(Boolean)
                      : String(body.categories || '').split(',').map(s => s.trim()).filter(Boolean),
        heroImage:  String(body.heroImage || '').trim(),
        author:     String(body.author || '').trim(),
        date:       String(body.date || '').trim(),
        body:       String(body.body || ''),
        status,
        seo: {
          metaTitle:       String((body.seo && body.seo.metaTitle)       || '').trim(),
          metaDescription: String((body.seo && body.seo.metaDescription) || '').trim(),
          keyphrase:       String((body.seo && body.seo.keyphrase)       || '').trim()
        },
        updatedAt:  now,
        createdAt:  existing ? (existing.createdAt || now) : now,
        publishedAt: status === 'published'
                      ? (existing && existing.publishedAt ? existing.publishedAt : now)
                      : (existing ? existing.publishedAt || null : null)
      };

      await col.replaceOne({ slug }, doc, { upsert: true });
      return res.json({ success: true, slug, url: '/post/' + slug });
    } catch (err) {
      console.error('Articles write error:', err.message);
      return res.status(500).json({ error: 'Failed to save article' });
    }
  }

  /* ── DELETE ──────────────────────────────────────────────── */
  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const slug = req.query.slug;
    if (!slug) return res.status(400).json({ error: 'slug required' });
    try {
      await col.deleteOne({ slug });
      return res.json({ success: true });
    } catch (err) {
      console.error('Articles delete error:', err.message);
      return res.status(500).json({ error: 'Failed to delete article' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
