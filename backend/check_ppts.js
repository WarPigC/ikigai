import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

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

    console.log("Total participants with pptLink:", participants.length);
    console.log("Participants missing extension:", missingExt.length);
    console.log("-----------------------------------------");
    
    missingExt.forEach(p => {
      const teamName = p.get("teamDetails")?.teamName || p.get("teamName") || "Unknown Team";
      console.log(`Team ID: ${p._id}`);
      console.log(`Team Name: ${teamName}`);
      console.log(`URL: ${p.get("pptLink")}`);
      console.log("-----------------------------------------");
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
