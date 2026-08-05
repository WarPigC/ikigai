import mongoose from 'mongoose';
import 'dotenv/config';
import crypto from 'crypto';

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch(err => {
    console.error("❌ Connection error:", err);
    process.exit(1);
  });

const EventSchema = new mongoose.Schema({}, { strict: false });
const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

const ParticipantSchema = new mongoose.Schema({}, { strict: false });
const Participant = mongoose.models.Participant || mongoose.model("Participant", ParticipantSchema);

const TeamLeaderSchema = new mongoose.Schema({}, { strict: false });
const TeamLeader = mongoose.models.TeamLeader || mongoose.model("TeamLeader", TeamLeaderSchema);

const ShortlistedSchema = new mongoose.Schema({}, { strict: false });
const Shortlisted = mongoose.models.Shortlisted || mongoose.model("Shortlisted", ShortlistedSchema, "shortlisteds");

const hashPassword = (password) => {
  return crypto.createHash("sha256").update(password).digest("hex");
};

async function run() {
  try {
    // 1. Find the correct event
    const event = await Event.findOne({ 
      title: /ikigai Hackathon 2026/i, 
      title: { $not: /Round 2/i } 
    });
    
    if (!event) {
      console.log("❌ No event found for 'Ikigai Hackathon 2026'");
      process.exit(1);
    }
    const eventId = event._id;

    // Use the first track available
    const trackId = event.tracks && event.tracks.length > 0 ? event.tracks[0].id : "001";
    const trackTitle = event.tracks && event.tracks.length > 0 ? event.tracks[0].title : "AI & ML";

    const email = "krishnakhirbadodiya@gmail.com";
    const teamName = "Alpha Strikers Test";
    const name = "Krishna (Test Leader)";
    const password = "krishna123";

    // First check if already exists to avoid duplicate errors
    const existingLeader = await TeamLeader.findOne({ email: email.toLowerCase() });
    if (existingLeader) {
       console.log("⚠️ Team Leader already exists in DB! Aborting. Please run delete_test_team.js first.");
       process.exit(0);
    }

    // 2. Create the Participant (Team) Document
    const participant = new Participant({
      eventId: eventId,
      trackId: trackId,
      track: trackTitle,
      createdBy: "admin@csit.in",
      teamId: "TEST_TEAM_ALPHA",
      teamName: teamName,
      problemStatement: "Developing an AI-driven automated evaluation system to reduce manual grading overhead in large-scale hackathons.",
      description: "Our team is building a streamlined platform that uses advanced NLP models to pre-evaluate student submissions based on a strict rubric.",
      pptLink: "https://docs.google.com/presentation/d/dummy-test-link/edit",
      members: [
        {
          candidateRole: "Team Leader",
          name: name,
          email: email,
          mobile: "9999999999",
          location: "Mumbai, Maharashtra",
          userType: "College Students",
          domain: "Engineering",
          course: "B.Tech",
          specialization: "Computer Science",
          courseType: "Full Time",
          courseDuration: "4",
          gradYear: "2026",
          organisation: "Tech University",
          isLeader: true
        },
        {
          candidateRole: "Team Member",
          name: "Rahul Sharma (Test Member 1)",
          email: "rahul.test1@gmail.com",
          mobile: "8888888888",
          location: "Pune, Maharashtra",
          userType: "College Students",
          domain: "Engineering",
          course: "B.Tech",
          specialization: "Information Technology",
          courseType: "Full Time",
          courseDuration: "4",
          gradYear: "2026",
          organisation: "Tech University",
          isLeader: false
        },
        {
          candidateRole: "Team Member",
          name: "Priya Patel (Test Member 2)",
          email: "priya.test2@gmail.com",
          mobile: "7777777777",
          location: "Ahmedabad, Gujarat",
          userType: "College Students",
          domain: "Engineering",
          course: "B.Tech",
          specialization: "Artificial Intelligence",
          courseType: "Full Time",
          courseDuration: "4",
          gradYear: "2026",
          organisation: "Tech University",
          isLeader: false
        },
        {
          candidateRole: "Team Member",
          name: "Amit Kumar (Test Member 3)",
          email: "amit.test3@gmail.com",
          mobile: "6666666666",
          location: "Delhi, NCR",
          userType: "College Students",
          domain: "Engineering",
          course: "B.Tech",
          specialization: "Data Science",
          courseType: "Full Time",
          courseDuration: "4",
          gradYear: "2026",
          organisation: "Tech University",
          isLeader: false
        }
      ]
    });
    
    const savedParticipant = await participant.save();
    console.log("✅ Created Participant (Team) successfully: " + savedParticipant._id);

    // 3. Create the TeamLeader Document for Login
    const teamLeader = new TeamLeader({
      name: name,
      email: email.toLowerCase().trim(),
      phone: "9999999999",
      teamName: teamName,
      passwordHash: hashPassword(password),
      eventId: String(eventId),
      participantId: savedParticipant._id,
      inviteSent: false
    });
    
    await teamLeader.save();
    console.log("✅ Created TeamLeader successfully!");

    // 4. Create the Shortlisted Document
    const shortlisted = new Shortlisted({
      participantId: savedParticipant._id,
      eventId: eventId,
      email: email.toLowerCase().trim(),
      status: "EVALUATED",
      teamName: teamName,
      leaderName: name
    });
    await shortlisted.save();
    console.log("✅ Created Shortlisted successfully!");

    console.log(`
      ---------------------------------
      TEST TEAM CREATED SUCCESSFULLY!
      ---------------------------------
      Email: ${email}
      Password: ${password}
      Team Name: ${teamName}
      Members: 4
      ---------------------------------
    `);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error running script:", error);
    process.exit(1);
  }
}

run();
