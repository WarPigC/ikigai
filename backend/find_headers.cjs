const mongoose = require('mongoose');
require('dotenv').config();

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ikigai");
    
    const collections = await mongoose.connection.db.collections();
    const participantCollection = collections.find(c => c.collectionName === 'participants');
    
    const participants = await participantCollection.find({ "members.name": { $regex: /name/i } }).toArray();
    console.log("Found participants with 'name' in member name:", JSON.stringify(participants, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

checkDB();
