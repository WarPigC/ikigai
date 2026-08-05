import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

async function run() {
  try {
    const ikigaiDb = await mongoose.createConnection(uri).asPromise();
    
    const Participant = ikigaiDb.model('Participant', new mongoose.Schema({}, { strict: false }), 'participants');
    const TeamLeader = ikigaiDb.model('TeamLeader', new mongoose.Schema({ participantId: mongoose.Schema.Types.ObjectId, email: String }, { strict: false }), 'teamleaders');

    const email = "sh.aniruddha39@gmail.com";
    const tl = await TeamLeader.findOne({ email });

    console.log("TeamLeader found:", tl);
    
    if (tl) {
      if (tl.participantId) {
        console.log("Participant ID in TeamLeader:", tl.participantId);
        const p = await Participant.findById(tl.participantId);
        if (p) {
          console.log("Associated Participant exists:", p._id);
        } else {
          console.log("Associated Participant does NOT exist! (Dangling Reference)");
        }
      } else {
        console.log("TeamLeader has no participantId field!");
      }
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
