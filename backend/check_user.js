import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const hashPassword = (password) => crypto.createHash("sha256").update(password).digest("hex");

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const TeamLeaderSchema = new mongoose.Schema({}, { strict: false });
    const TeamLeader = mongoose.model("TeamLeader", TeamLeaderSchema, "teamleaders");
    
    const tl = await TeamLeader.findOne({ email: "sharma.aniruddha9666@gmail.com" });
    if (!tl) {
      console.log("TeamLeader not found with that email");
      
      // Look in Shortlisted
      const ShortlistedSchema = new mongoose.Schema({}, { strict: false });
      const Shortlisted = mongoose.model("Shortlisted", ShortlistedSchema, "shortlisteds");
      
      const team = await Shortlisted.findOne({ "members.email": "sharma.aniruddha9666@gmail.com" });
      if (team) {
         console.log("Found in shortlisted, but not in TeamLeader. Creating TeamLeader...");
         // We can create it.
      } else {
         console.log("Not found in Shortlisted either.");
      }
    } else {
      console.log("TeamLeader found:", tl);
      // Let's set a known password for testing
      const testPass = "password123";
      const hashed = hashPassword(testPass);
      await TeamLeader.updateOne({ _id: tl._id }, { $set: { passwordHash: hashed } });
      console.log(`Password reset to: ${testPass}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
