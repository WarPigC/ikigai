import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI;

const ParticipantSchema = new mongoose.Schema({}, { strict: false });
const Participant = mongoose.model('Participant', ParticipantSchema, 'participants');

const TeamLeaderSchema = new mongoose.Schema({}, { strict: false });
const TeamLeader = mongoose.model('TeamLeader', TeamLeaderSchema, 'teamleaders');

const ShortlistedSchema = new mongoose.Schema({}, { strict: false });
const Shortlisted = mongoose.models.Shortlisted || mongoose.model("Shortlisted", ShortlistedSchema, "shortlisteds");

async function run() {
  try {
    await mongoose.connect(uri);
    const emails = ['vandana.kate@gmail.com', 'hodcsit@acropolis.in'];
    
    // Find in teamleaders
    const tls = await TeamLeader.find({ email: { $in: emails } });
    console.log("Found Team Leaders:");
    console.log(JSON.stringify(tls, null, 2));

    // Find in participants
    for (const tl of tls) {
      if (tl.participantId) {
        const team = await Participant.findById(tl.participantId);
        console.log(`\nFound Team for ${tl.email}:`);
        console.log(JSON.stringify(team, null, 2));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

run();
