import mongoose from 'mongoose';
import 'dotenv/config';

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ Connection error:", err);
    process.exit(1);
  });

const ParticipantSchema = new mongoose.Schema({}, { strict: false });
const Participant = mongoose.models.Participant || mongoose.model("Participant", ParticipantSchema);

const TeamLeaderSchema = new mongoose.Schema({}, { strict: false });
const TeamLeader = mongoose.models.TeamLeader || mongoose.model("TeamLeader", TeamLeaderSchema);

const NotificationSchema = new mongoose.Schema({}, { strict: false });
const Notification = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema, "notifications");

const TeamSchema = new mongoose.Schema({}, { strict: false });

async function run() {
  try {
    const email = "krishnakhirbadodiya@gmail.com";

    // 1. Find and delete the TeamLeader
    const deletedLeader = await TeamLeader.findOneAndDelete({ email: email.toLowerCase() });
    if (deletedLeader) {
       console.log("✅ Deleted TeamLeader!");
    } else {
       console.log("⚠️ TeamLeader not found.");
    }
    
    // 2. Force delete Participant by teamId
    await Participant.deleteMany({ teamId: "TEST_TEAM_ALPHA" });
    console.log("✅ Deleted Participant by teamId!");
    
    // 3. Delete any notifications for this email
    const deletedNotifs = await Notification.deleteMany({ recipientEmail: email.toLowerCase() });
    console.log(`✅ Deleted ${deletedNotifs.deletedCount} notifications.`);

    // 4. Delete any round2 registration (Team) for this email
    try {
      const uri2 = process.env.MONGO_URI.replace("/ikigai?", "/ikigai2?");
      const ikigai2Db = mongoose.createConnection(uri2);
      const Team2 = ikigai2Db.model("Team", TeamSchema);
      const deletedR2 = await Team2.deleteMany({ leaderEmail: email.toLowerCase() });
      console.log(`✅ Deleted ${deletedR2.deletedCount} Round 2 registrations from ikigai2.`);
    } catch(e) {
      console.log("Could not connect to ikigai2 to delete Round 2 registrations, continuing...");
    }

    // 5. Delete Shortlisted just in case
    const ShortlistedSchema = new mongoose.Schema({}, { strict: false });
    const Shortlisted = mongoose.models.Shortlisted || mongoose.model("Shortlisted", ShortlistedSchema, "shortlisted");
    const delShort = await Shortlisted.deleteMany({ email: email.toLowerCase() });
    console.log(`✅ Deleted ${delShort.deletedCount} Shortlisted entries.`);

    console.log("---------------------------------");
    console.log("CLEANUP COMPLETE!");
    console.log("---------------------------------");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error running script:", error);
    process.exit(1);
  }
}

run();
