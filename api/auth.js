module.exports=(req,res)=>res.status(403).json({error:'Admin access is disabled on this preview branch.'});
