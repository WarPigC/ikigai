const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    
    // Find all participants that have a pptLink
    const participants = await db.collection('participants').find({ pptLink: { $exists: true, $ne: null, $ne: "" } }).toArray();
    
    let updatedCount = 0;
    
    for (const p of participants) {
      const link = p.pptLink;
      
      // If it doesn't end in .pdf or .pptx, it's missing an extension
      if (!link.toLowerCase().split('?')[0].endsWith('.pdf') && !link.toLowerCase().split('?')[0].endsWith('.pptx')) {
        console.log(`Fixing: ${link}`);
        
        try {
          // Extract public_id from Cloudinary URL
          // URL format: https://res.cloudinary.com/dixdw1mus/raw/upload/v1785149903/CARE/ppts/6a662b10276c0be974e309f6/UCJ1M258
          const urlParts = link.split('/upload/');
          if (urlParts.length !== 2) {
            console.log("Not a standard Cloudinary URL, skipping.");
            continue;
          }
          
          let publicIdWithVersion = urlParts[1];
          // Remove version string (e.g., v1785149903/) if present
          let publicId = publicIdWithVersion;
          if (publicIdWithVersion.match(/^v\d+\//)) {
            publicId = publicIdWithVersion.split('/').slice(1).join('/');
          }
          
          const newPublicId = `${publicId}.pptx`;
          
          // Rename in Cloudinary
          console.log(`  Renaming Cloudinary resource (raw): ${publicId} -> ${newPublicId}`);
          try {
            await cloudinary.uploader.rename(publicId, newPublicId, { resource_type: 'raw', overwrite: true });
            console.log(`  ✅ Renamed in Cloudinary.`);
          } catch (cErr) {
            if (cErr.message && cErr.message.includes('not found')) {
               console.log(`  ⚠️ Resource not found in Cloudinary (might already be renamed).`);
            } else {
               throw cErr;
            }
          }
          
          // Update MongoDB
          const newLink = link + '.pptx';
          console.log(`  Updating DB: ${newLink}`);
          await db.collection('participants').updateOne(
            { _id: p._id },
            { $set: { pptLink: newLink } }
          );
          console.log(`  ✅ Updated in DB.`);
          updatedCount++;
          
        } catch (err) {
          console.error(`  ❌ Error processing ${link}:`, err.message);
        }
      }
    }
    
    console.log(`\nMigration complete. Fixed ${updatedCount} records.`);
    
  } catch (err) {
    console.error("Fatal error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
