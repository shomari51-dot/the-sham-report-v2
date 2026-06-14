/* ================================================================
   TSR CMS — Auth endpoint
   POST /api/auth  →  verifies password, returns admin secret token
   ================================================================ */
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Body may arrive as a parsed object or a raw string depending on runtime
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const password = (body && body.password ? String(body.password) : '').trim();
  const expected = (process.env.ADMIN_PASSWORD || '').trim();

  // Small delay to resist brute-force
  await new Promise(r => setTimeout(r, 300));

  if (!expected || password !== expected) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  return res.status(200).json({ success: true, token: process.env.ADMIN_SECRET });
};
