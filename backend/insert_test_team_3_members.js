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
      createdBy: "aarav.patel@teste.com",
      teamId: "TEAM_TEST_E",
      teamName: "Test E",
      problemStatement: "AI in Agriculture",
      description: "Crop disease detection using drones and AI for Indian farmers.",
      pptLink: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf",
      members: [
        {
          candidateRole: "Team Leader",
          name: "Aarav Patel",
          email: "aarav.patel@teste.com",
          mobile: "9876543444",
          location: "Mumbai, India",
          userType: "College Students",
          domain: "Engineering",
          course: "B.Tech/BE",
          specialization: "Computer Science",
          courseType: "Full Time",
          courseDuration: "4",
          gradYear: "2026",
          organisation: "Indian Institute of Technology Bombay",
          isLeader: true
        },
        {
          candidateRole: "Team Member",
          name: "Diya Singh",
          email: "diya.singh@teste.com",
          mobile: "9876543555",
          location: "Mumbai, India",
          userType: "College Students",
          domain: "Engineering",
          course: "B.Tech/BE",
          specialization: "Information Technology",
          courseType: "Full Time",
          courseDuration: "4",
          gradYear: "2026",
          organisation: "Indian Institute of Technology Bombay",
          isLeader: false
        },
        {
          candidateRole: "Team Member",
          name: "Rohan Gupta",
          email: "rohan.gupta@teste.com",
          mobile: "9876543666",
          location: "Mumbai, India",
          userType: "College Students",
          domain: "Engineering",
          course: "B.Tech/BE",
          specialization: "Electronics and Communication",
          courseType: "Full Time",
          courseDuration: "4",
          gradYear: "2026",
          organisation: "Indian Institute of Technology Bombay",
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

    console.log("Finished inserting Test E dummy team.");
    process.exit(0);

  } catch (err) {
    console.error("Error inserting team:", err);
    process.exit(1);
  }
}

run();
