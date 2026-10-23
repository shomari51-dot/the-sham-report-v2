const {equal,signToken,limited,ip,guard} = require('../lib/auth');
module.exports = async (req,res) => {
  res.setHeader('Cache-Control','no-store');
  if (!guard(req,res,true)) return;
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const key = 'auth:'+ip(req);
  if (limited(key,5,900000,false)) return res.status(429).json({error:'Too many login failures'});
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (!process.env.ADMIN_PASSWORD || !equal(body?.password || '',process.env.ADMIN_PASSWORD)) {
    limited(key,5,900000);
    return res.status(401).json({error:'Invalid password'});
  }
  if (!process.env.ADMIN_SECRET) return res.status(503).json({error:'Auth unavailable'});
  return res.json({success:true,token:signToken()});
};
