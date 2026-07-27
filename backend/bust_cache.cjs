const mongoose = require('mongoose');
require('dotenv').config();

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    
    // Find all participants that have a pptLink
    const participants = await db.collection('participants').find({ pptLink: { $exists: true, $ne: null, $ne: "" } }).toArray();
    
    let updatedCount = 0;
    
    for (const p of participants) {
      let link = p.pptLink;
      let changed = false;
      
      // If the link has a version number like /v12345/, replace it with /v1/ to bust the Cloudinary CDN cache
      if (link.includes('/upload/v')) {
        const urlParts = link.split('/upload/v');
        if (urlParts.length === 2) {
          const rightSide = urlParts[1];
          const slashIndex = rightSide.indexOf('/');
          if (slashIndex !== -1) {
             const pathAfterVersion = rightSide.substring(slashIndex);
             const newLink = urlParts[0] + '/upload/v1' + pathAfterVersion;
             if (link !== newLink) {
                link = newLink;
                changed = true;
             }
          }
        }
      }

      if (changed) {
        console.log(`  Updating DB cache bust: ${link}`);
        await db.collection('participants').updateOne(
          { _id: p._id },
          { $set: { pptLink: link } }
        );
        updatedCount++;
      }
    }
    
    console.log(`\nCache busting complete. Fixed ${updatedCount} records.`);
    
  } catch (err) {
    console.error("Fatal error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
