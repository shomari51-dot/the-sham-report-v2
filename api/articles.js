const {guard, isAdmin} = require('../lib/auth');
/* ================================================================
   TSR CMS — Articles API
   GET    /api/articles                 → list (published only;
                                           includes drafts if admin secret sent)
   GET    /api/articles?slug=xyz         → single full article
   POST   /api/articles                  → create / update  (auth required)
   DELETE /api/articles?slug=xyz         → delete            (auth required)
   ================================================================ */
const {getDb,assertWritableDb} = require('../lib/db');


function slugify(s) {
  return String(s || '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}


module.exports = async (req, res) => {
  if (!guard(req,res)) return;
  if (['POST','DELETE'].includes(req.method)) {
    if (!isAdmin(req)) return res.status(401).json({error:'Unauthorized'});
    try { assertWritableDb(); } catch(err) {return res.status(409).json({error:err.message,code:err.code});}
  }

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
        if (!doc || (doc.status !== 'published' && !isAdmin(req))) return res.status(404).json({ error: 'Article not found' });
        return res.json(doc);
      }
      // Listing — drafts visible only to admin
      const filter = isAdmin(req) ? {} : { status: 'published' };
      const list = await col
        .find(filter, { projection: { _id: 0, body: 0 } })
        .sort({ publishedAt: -1, updatedAt: -1 })
        .toArray();
      list.sort((a, b) => (Date.parse(b.original_fb_date || b.date || '') || 0) - (Date.parse(a.original_fb_date || a.date || '') || 0) || (b.seq || 0) - (a.seq || 0));
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
    const workflow=['Imported','Draft','Needs Verification','Ready for Review','Approved','Published','Archived'];
    const editorial_status=body.editorial_status || (body.status==='published'?'Published':'Draft');
    if(!workflow.includes(editorial_status))return res.status(400).json({error:'Invalid editorial status'});
    const status=editorial_status==='Published'?'published':editorial_status==='Archived'?'archived':'draft';

    try {
      const existing = await col.findOne({ slug });

      let imported={};
      if(body.original_post_text != null || existing?.original_post_text != null) {
        const merged={...existing,...body,editorial_status};
        if(!['Imported','Needs Verification','Ready for Review','Draft','Approved','Published','Archived'].includes(editorial_status)) throw new TypeError('Invalid import workflow');
        const validationStatus=['Approved','Published'].includes(editorial_status)?'Ready for Review':['Draft','Archived'].includes(editorial_status)?'Imported':editorial_status;
        imported=require('../lib/fb-import').createImport({...merged,editorial_status:validationStatus},existing);
        if(!existing && ['Approved','Published'].includes(editorial_status)) throw new TypeError('Imports cannot be Approved or Published directly');
        if(['Approved','Published'].includes(editorial_status) && (merged.image_rights.permission_status==='permission_pending' || /pending/.test(merged.fb_post_id) || !/\/(posts|permalink|reel)\//.test(new URL(merged.fb_source_url).pathname)))throw new TypeError('Confirm Facebook provenance and image rights before approval');
      }
      const doc = {
        ...imported,
        editorial_status,
        history:[...(existing?.history || []),{at:now,by:'admin',previous_status:existing?.editorial_status || existing?.status || null,status:editorial_status}],
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
      return res.status(err instanceof TypeError?400:500).json({ error:err instanceof TypeError?err.message:'Failed to save article' });
    }
  }

  /* ── DELETE ──────────────────────────────────────────────── */
  if (req.method === 'DELETE') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const slug = req.query.slug;
    if (!slug) return res.status(400).json({ error: 'slug required' });
    try {
      await col.updateOne({slug},{$set:{status:'archived',editorial_status:'Archived',updatedAt:new Date()},$push:{history:{at:new Date(),by:'admin',change:'Article archived; original retained'}}});
      return res.json({ success: true });
    } catch (err) {
      console.error('Articles delete error:', err.message);
      return res.status(500).json({ error: 'Failed to delete article' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
