const crypto = require('node:crypto');
const equal = (a, b) => crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(), crypto.createHash('sha256').update(String(b)).digest());
function signToken(now = Math.floor(Date.now()/1000)) {
  if (!process.env.ADMIN_SECRET) throw new Error('ADMIN_SECRET required');
  const ttl = Number(process.env.ADMIN_TOKEN_TTL_SECONDS || 28800);
  if (!Number.isSafeInteger(ttl) || ttl <= 0) throw new Error('Invalid token TTL');
  const payload = Buffer.from(JSON.stringify({sub:'admin', iat:now, exp:now+ttl, jti:crypto.randomUUID()})).toString('base64url');
  return payload+'.'+crypto.createHmac('sha256', process.env.ADMIN_SECRET).update(payload).digest('base64url');
}
function verifyToken(token, now = Math.floor(Date.now()/1000)) {
  try {
    if (!process.env.ADMIN_SECRET || typeof token !== 'string' || token.length > 2048) return null;
    const parts = token.split('.');
    if (parts.length !== 2 || !parts.every(p => /^[A-Za-z0-9_-]+$/.test(p))) return null;
    const [p,s] = parts;
    if (!equal(s,crypto.createHmac('sha256',process.env.ADMIN_SECRET).update(p).digest('base64url'))) return null;
    const data = JSON.parse(Buffer.from(p,'base64url'));
    return data.sub === 'admin' && Number.isSafeInteger(data.iat) && Number.isSafeInteger(data.exp) && data.iat <= now && data.exp > now && data.exp > data.iat && typeof data.jti === 'string' && data.jti ? data : null;
  } catch { return null; }
}
function isAdmin(req) { return !!verifyToken(req.headers.authorization?.replace(/^Bearer /i,'') || req.headers['x-admin-secret']); }
function allowedOrigin(origin) {
  if (process.env.ALLOWED_ORIGINS !== undefined) return process.env.ALLOWED_ORIGINS.split(',').map(s=>s.trim()).includes(origin);
  return ['https://www.theshamreport.com','https://theshamreport.com'].includes(origin) || /^https:\/\/the-sham-report-v2-[a-z0-9-]+-sham-god-media-s-projects\.vercel\.app$/.test(origin) || /^http:\/\/localhost:\d+$/.test(origin);
}
const buckets = new Map();
function limited(key, max, windowMs, record = true, now = Date.now()) {
  for (const [k,v] of buckets) if (v.until <= now) buckets.delete(k);
  let b = buckets.get(key);
  if (!b) { b = {count:0, until:now+windowMs}; if (record) buckets.set(key,b); }
  if (b.count >= max) return true;
  if (record) b.count++;
  return false;
}
const ip = req => String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
function guard(req,res,auth = false) {
  const read = !auth && ['GET','HEAD'].includes(req.method);
  res.setHeader('Access-Control-Allow-Methods','GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization, X-Admin-Secret');
  if (read) { res.setHeader('Access-Control-Allow-Origin','*'); return true; }
  const origin = req.headers.origin;
  res.setHeader('Vary','Origin');
  if (origin && !allowedOrigin(origin)) { res.status(403).json({error:'Origin forbidden'}); return false; }
  if (origin) res.setHeader('Access-Control-Allow-Origin',origin);
  if (!origin && !isAdmin(req)) { res.status(401).json({error:'Token required without Origin'}); return false; }
  if (req.method === 'OPTIONS') { res.status(204).end(); return false; }
  if (!auth && !isAdmin(req)) { res.status(401).json({error:'Unauthorized'}); return false; }
  if (!auth && limited('write:'+ip(req),60,60000)) { res.status(429).json({error:'Rate limit exceeded'}); return false; }
  return true;
}
module.exports = {equal,signToken,verifyToken,isAdmin,allowedOrigin,limited,ip,guard};
