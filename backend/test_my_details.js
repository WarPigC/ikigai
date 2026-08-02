import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const TeamLeaderSchema = new mongoose.Schema({}, { strict: false });
    const TeamLeader = mongoose.model("TeamLeader", TeamLeaderSchema, "teamleaders");
    
    const tl = await TeamLeader.findOne({ email: "sharma.aniruddha9666@gmail.com" });
    console.log("TeamLeader?", !!tl);
    if (tl) {
      console.log("tl.participantId =", tl.participantId);
      
      const ShortlistedSchema = new mongoose.Schema({}, { strict: false });
      const Shortlisted = mongoose.model("Shortlisted", ShortlistedSchema, "shortlisteds");
      
      // Try to find the participant ID
      // tl.participantId in DB is ObjectId('6a6efed692a12a7ba049f6b3')
      const shortlistedTeam = await Shortlisted.findOne({ participantId: tl.participantId });
      console.log("Shortlisted team found by participantId?", !!shortlistedTeam);
      
      // Let's check what's in Shortlisted
      const allShortlisted = await Shortlisted.find({});
      console.log("Total Shortlisted Teams:", allShortlisted.length);
      allShortlisted.forEach(s => {
        console.log("- participantId in Shortlisted:", s.participantId);
      });
    }
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
