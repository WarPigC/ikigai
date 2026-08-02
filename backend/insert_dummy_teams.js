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
    // Get an event to link to
    const event = await Event.findOne({ title: /ikigai Hackathon 2026/i });
    if (!event) {
      console.log("No event found matching 'ikigai Hackathon 2026'");
      process.exit(1);
    }
    const eventId = event._id;

    // We also need a track ID from the event if it exists
    const trackId = event.tracks && event.tracks.length > 0 ? event.tracks[0].id : "001";
    const track = event.tracks && event.tracks.length > 0 ? event.tracks[0].title : "AI & ML";

    const teams = [
      {
        eventId: eventId,
        trackId: trackId,
        track: track,
        createdBy: "sarthakdharkar6@gmail.com",
        teamId: "TEAM_TEST_A",
        teamName: "Test A",
        problemStatement: "Predictive Analytics for Crop Yield Optimization",
        description: "An AI-powered model that leverages satellite imagery and soil data to predict crop yields with high accuracy, assisting farmers in decision-making.",
        pptLink: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        members: [
          {
            candidateRole: "Team Leader",
            name: "Sarthak Dharkar",
            email: "sarthakdharkar6@gmail.com",
            mobile: "9876543210",
            location: "Pune, Maharashtra",
            userType: "College Students",
            domain: "Engineering",
            course: "B.Tech/BE",
            specialization: "Computer Science and Engineering",
            courseType: "Full Time",
            courseDuration: "4",
            gradYear: "2026",
            organisation: "Pune Institute of Computer Technology",
            isLeader: true
          },
          {
            candidateRole: "Team Member",
            name: "Rahul Sharma",
            email: "rahul.sharma123@gmail.com",
            mobile: "9876543211",
            location: "Pune, Maharashtra",
            userType: "College Students",
            domain: "Engineering",
            course: "B.Tech/BE",
            specialization: "Computer Science and Engineering",
            courseType: "Full Time",
            courseDuration: "4",
            gradYear: "2026",
            organisation: "Pune Institute of Computer Technology",
            isLeader: false
          }
        ]
      },
      {
        eventId: eventId,
        trackId: trackId,
        track: track,
        createdBy: "sh.aniruddha39@gmail.com",
        teamId: "TEAM_TEST_B",
        teamName: "Test B",
        problemStatement: "Smart Traffic Management System",
        description: "IoT and CV based traffic management system designed to reduce congestion at major intersections by dynamically adapting signal timings.",
        pptLink: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        members: [
          {
            candidateRole: "Team Leader",
            name: "Aniruddha Sharma",
            email: "sh.aniruddha39@gmail.com",
            mobile: "9123456780",
            location: "Bhopal, Madhya Pradesh",
            userType: "College Students",
            domain: "Engineering",
            course: "B.Tech/BE",
            specialization: "Information Technology",
            courseType: "Full Time",
            courseDuration: "4",
            gradYear: "2025",
            organisation: "Maulana Azad National Institute of Technology",
            isLeader: true
          },
          {
            candidateRole: "Team Member",
            name: "Priya Desai",
            email: "priya.desai88@gmail.com",
            mobile: "9123456781",
            location: "Indore, Madhya Pradesh",
            userType: "College Students",
            domain: "Engineering",
            course: "B.Tech/BE",
            specialization: "Information Technology",
            courseType: "Full Time",
            courseDuration: "4",
            gradYear: "2025",
            organisation: "Shri G. S. Institute of Technology and Science",
            isLeader: false
          }
        ]
      },
      {
        eventId: eventId,
        trackId: trackId,
        track: track,
        createdBy: "s.aniruddha3993@gmail.com",
        teamId: "TEAM_TEST_C",
        teamName: "Test C",
        problemStatement: "Blockchain Based Academic Credential Verification",
        description: "A decentralized application to securely store, issue and verify academic certificates using smart contracts to prevent forgery.",
        pptLink: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        members: [
          {
            candidateRole: "Team Leader",
            name: "Aniruddha S",
            email: "s.aniruddha3993@gmail.com",
            mobile: "9988776655",
            location: "Bangalore, Karnataka",
            userType: "College Students",
            domain: "Engineering",
            course: "B.Tech/BE",
            specialization: "Computer Science and Engineering",
            courseType: "Full Time",
            courseDuration: "4",
            gradYear: "2024",
            organisation: "RV College of Engineering",
            isLeader: true
          },
          {
            candidateRole: "Team Member",
            name: "Kavya Iyer",
            email: "kavya.iyer_tech@gmail.com",
            mobile: "9988776656",
            location: "Bangalore, Karnataka",
            userType: "College Students",
            domain: "Engineering",
            course: "B.Tech/BE",
            specialization: "Computer Science and Engineering",
            courseType: "Full Time",
            courseDuration: "4",
            gradYear: "2024",
            organisation: "RV College of Engineering",
            isLeader: false
          },
          {
            candidateRole: "Team Member",
            name: "Arjun Reddy",
            email: "arjun.reddy_xyz@gmail.com",
            mobile: "9988776657",
            location: "Bangalore, Karnataka",
            userType: "College Students",
            domain: "Engineering",
            course: "B.Tech/BE",
            specialization: "Information Science",
            courseType: "Full Time",
            courseDuration: "4",
            gradYear: "2024",
            organisation: "RV College of Engineering",
            isLeader: false
          }
        ]
      }
    ];

    for (const team of teams) {
      // Check if exists
      const exists = await Participant.findOne({ teamId: team.teamId });
      if (exists) {
        console.log(`Team ${team.teamName} already exists, updating...`);
        await Participant.updateOne({ teamId: team.teamId }, team);
      } else {
        console.log(`Inserting ${team.teamName}...`);
        await Participant.create(team);
      }
    }

    console.log("Finished inserting 3 dummy teams.");
    process.exit(0);

  } catch (err) {
    console.error("Error inserting teams:", err);
    process.exit(1);
  }
}

run();
