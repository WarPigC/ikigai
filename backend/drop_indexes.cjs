const mongoose = require('mongoose');
require('dotenv').config();

async function dropLegacyIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ikigai");
    const collections = await mongoose.connection.db.collections();
    const participantCollection = collections.find(c => c.collectionName === 'participants');
    
    if (participantCollection) {
      try {
        await participantCollection.dropIndex("eventId_1_trackId_1_paperId_1");
        console.log("Dropped eventId_1_trackId_1_paperId_1 index.");
      } catch(e) { console.log(e.message); }
      
      try {
        await participantCollection.dropIndex("eventId_1_trackId_1_teamName_1");
        console.log("Dropped eventId_1_trackId_1_teamName_1 index.");
      } catch(e) { console.log(e.message); }
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

dropLegacyIndexes();
