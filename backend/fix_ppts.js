import mongoose from "mongoose";
import dotenv from "dotenv";
import cloudinary from "cloudinary";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const ParticipantSchema = new mongoose.Schema({}, { strict: false });
    const Participant = mongoose.model("Participant", ParticipantSchema, "participants");

    const participants = await Participant.find({ pptLink: { $exists: true, $ne: null } });
    const missingExt = participants.filter(p => {
      const url = p.get("pptLink");
      if (typeof url !== "string") return false;
      const lower = url.toLowerCase().split("?")[0];
      return !lower.endsWith(".pdf") && !lower.endsWith(".ppt") && !lower.endsWith(".pptx");
    });

    console.log(`Found ${missingExt.length} teams missing extensions. Fixing them now...`);

    for (const p of missingExt) {
      const teamName = p.get("teamDetails")?.teamName || p.get("teamName") || "Unknown Team";
      const oldUrl = p.get("pptLink");
      console.log(`\nProcessing: ${teamName}`);
      console.log(`Downloading from: ${oldUrl}`);

      // 1. Download from Cloudinary
      const res = await fetch(oldUrl);
      const buffer = await res.arrayBuffer();
      
      // 2. Check magic bytes
      const bytes = new Uint8Array(buffer.slice(0, 4));
      let ext = "";
      if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
        ext = ".pdf";
      } else if (bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04) {
        ext = ".pptx";
      } else if (bytes[0] === 0xd0 && bytes[1] === 0xcf && bytes[2] === 0x11 && bytes[3] === 0xe0) {
        ext = ".ppt";
      } else {
        ext = ".pptx"; // default assumption if unknown
      }
      
      const mimeType = ext === ".pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      const base64 = `data:${mimeType};base64,${Buffer.from(buffer).toString("base64")}`;
      
      // 3. Re-upload with proper extension
      const publicId = `ikigai/ppts/fixed/${p._id}${ext}`;
      console.log(`Uploading as ${ext}...`);
      
      const result = await cloudinary.v2.uploader.upload(base64, {
        public_id: publicId,
        resource_type: "auto",
        overwrite: true
      });
      
      console.log(`New URL: ${result.secure_url}`);
      
      // 4. Update Database
      p.set("pptLink", result.secure_url);
      await p.save();
      console.log(`Database updated for ${teamName}!`);
    }

    console.log("\nAll done!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
