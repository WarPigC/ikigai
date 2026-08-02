import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const ParticipantSchema = new mongoose.Schema({}, { strict: false });
    const Participant = mongoose.model("Participant", ParticipantSchema, "participants");
    
    const p = await Participant.findOne({ pptLink: { $exists: true } });
    console.log(JSON.stringify(p, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
