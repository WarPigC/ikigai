import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

async function run() {
  try {
    const ikigaiDb = await mongoose.createConnection(uri).asPromise();
    
    // Have to require the schemas exactly as they are in server.js
    const ParticipantSchema = new mongoose.Schema({}, { strict: false });
    const Participant = ikigaiDb.model('Participant', ParticipantSchema, 'participants');
    
    const TeamLeaderSchema = new mongoose.Schema({
        name: String,
        email: { type: String, lowercase: true, trim: true },
        phone: String,
        teamName: String,
        passwordHash: String,
        eventId: String,
        participantId: { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
        inviteSent: { type: Boolean, default: false }
    }, { strict: false });
    const TeamLeader = ikigaiDb.model('TeamLeader', TeamLeaderSchema, 'teamleaders');

    const email = "sh.aniruddha39@gmail.com";
    const tl = await TeamLeader.findOne({ email }).populate('participantId');

    console.log("TeamLeader via populate:", JSON.stringify(tl, null, 2));
    
    if (tl && tl.participantId) {
        console.log("SUCCESS: participantId is populated!");
    } else {
        console.log("FAILED: participantId is null or missing after populate!");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

run();
