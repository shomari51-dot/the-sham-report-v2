module.exports=(req,res)=>res.redirect(307,'/article.html?slug='+encodeURIComponent(req.query.slug||''));
