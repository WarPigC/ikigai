const mongoose = require('mongoose');
require('dotenv').config();

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/ikigai");
    
    // Get the Participant model
    const collections = await mongoose.connection.db.collections();
    const participantCollection = collections.find(c => c.collectionName === 'participants');
    
    if (!participantCollection) {
      console.log("No participants collection found");
      process.exit(0);
    }

    const participants = await participantCollection.find({}).toArray();
    console.log(`Found ${participants.length} participants.`);
    if (participants.length > 0) {
      console.log("First participant:", JSON.stringify(participants[0], null, 2));
      console.log("Last participant:", JSON.stringify(participants[participants.length - 1], null, 2));
    }
    
    // Get indexes
    const indexes = await participantCollection.indexes();
    console.log("Indexes on participants collection:", JSON.stringify(indexes, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

checkDB();
