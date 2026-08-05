import mongoose from 'mongoose';
import 'dotenv/config';

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Connection error:", err));

const EventSchema = new mongoose.Schema({}, { strict: false });
const Event = mongoose.models.Event || mongoose.model("Event", EventSchema);

const ParticipantSchema = new mongoose.Schema({}, { strict: false });
const Participant = mongoose.models.Participant || mongoose.model("Participant", ParticipantSchema);

async function run() {
  try {
    const event = await Event.findOne({ title: /ikigai Hackathon 2026/i });
    if (!event) {
      console.log("No event found matching 'ikigai Hackathon 2026'");
      process.exit(1);
    }
    const eventId = event._id;

    const trackId = event.tracks && event.tracks.length > 0 ? event.tracks[0].id : "001";
    const track = event.tracks && event.tracks.length > 0 ? event.tracks[0].title : "AI & ML";

    const team = {
      eventId: eventId,
      trackId: trackId,
      track: track,
      createdBy: "rahul.verma@testd.com",
      teamId: "TEAM_TEST_D",
      teamName: "Test D",
      problemStatement: "Healthcare Accessibility in Rural India",
      description: "A telemedicine application focusing on bringing healthcare services to remote Indian villages using AI for preliminary diagnosis.",
      pptLink: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf",
      members: [
        {
          candidateRole: "Team Leader",
          name: "Rahul Verma",
          email: "rahul.verma@testd.com",
          mobile: "9876543222",
          location: "Delhi, India",
          userType: "College Students",
          domain: "Engineering",
          course: "B.Tech/BE",
          specialization: "Computer Science",
          courseType: "Full Time",
          courseDuration: "4",
          gradYear: "2026",
          organisation: "Delhi Technological University",
          isLeader: true
        },
        {
          candidateRole: "Team Member",
          name: "Anjali Sharma",
          email: "anjali.sharma@testd.com",
          mobile: "9876543333",
          location: "Delhi, India",
          userType: "College Students",
          domain: "Engineering",
          course: "B.Tech/BE",
          specialization: "Information Technology",
          courseType: "Full Time",
          courseDuration: "4",
          gradYear: "2026",
          organisation: "Delhi Technological University",
          isLeader: false
        }
      ],
      assessments: []
    };

    const exists = await Participant.findOne({ teamId: team.teamId });
    if (exists) {
      console.log(`Team ${team.teamName} already exists, updating...`);
      await Participant.updateOne({ teamId: team.teamId }, team);
    } else {
      console.log(`Inserting ${team.teamName}...`);
      await Participant.create(team);
    }

    console.log("Finished inserting Test D dummy team.");
    process.exit(0);

  } catch (err) {
    console.error("Error inserting team:", err);
    process.exit(1);
  }
}

run();
