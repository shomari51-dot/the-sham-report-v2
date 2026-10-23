const {MongoClient}=require('mongodb');
let client;
async function getDb() {
  if (!client) {
    client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:6000});
    try {await client.connect();} catch(e) {client=undefined;throw e;}
  }
  return client.db(process.env.MONGODB_DB || 'tsrcms');
}
async function close() {if(client)await client.close();client=undefined;}
module.exports={getDb,close};
