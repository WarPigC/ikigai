import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI;

const ParticipantSchema = new mongoose.Schema({}, { strict: false });
const Participant = mongoose.model("Participant", ParticipantSchema, "participants");

const dummyTeam = {
  eventId: "6a662b10276c0be974e309f6",
  trackId: "007",
  track: "Hybrid",
  createdBy: "aarav.sharma@test.com",
  teamId: "TEAM_ACROPOLIS_TEST_1",
  teamName: "Acropolis Innovators",
  problemStatement: "AI-based Traffic Management System",
  description: "A test team created from Acropolis Institute.",
  pptLink: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf",
  status: "EVALUATED",
  assignedEvaluators: ["6a67d95205455bdf7700860b"],
  assessments: [{
    "evaluatorId": "6a67d95205455bdf7700860b",
    "criteria": [10, 10, 10, 10, true],
    "total": 40,
    "notes": "JSON:[\"Excellent\",\"Good\",\"Innovative\",\"Great\",\"Yes\"]",
    "mode": "criteria",
    "evaluatedBy": "sessionChair",
    "evaluatedAt": new Date()
  }],
  members: [
    {
      candidateRole: "Team Leader",
      name: "Aarav Sharma",
      email: "aarav.sharma@test.com",
      mobile: "9876543210",
      location: "Indore, Madhya Pradesh",
      userType: "College Students",
      domain: "Engineering",
      course: "B.Tech/BE",
      specialization: "Computer Science",
      courseType: "Full Time",
      courseDuration: "4",
      gradYear: "2026",
      organisation: "Acropolis Institute of Technology and Research",
      isLeader: true,
    },
    {
      candidateRole: "Team Member",
      name: "Priya Patel",
      email: "priya.patel@test.com",
      mobile: "9876543211",
      location: "Indore, Madhya Pradesh",
      userType: "College Students",
      domain: "Engineering",
      course: "B.Tech/BE",
      specialization: "Information Technology",
      courseType: "Full Time",
      courseDuration: "4",
      gradYear: "2026",
      organisation: "Acropolis Institute of Technology and Research",
      isLeader: false,
    },
    {
      candidateRole: "Team Member",
      name: "Rohan Singh",
      email: "rohan.singh@test.com",
      mobile: "9876543212",
      location: "Indore, Madhya Pradesh",
      userType: "College Students",
      domain: "Engineering",
      course: "B.Tech/BE",
      specialization: "Artificial Intelligence",
      courseType: "Full Time",
      courseDuration: "4",
      gradYear: "2026",
      organisation: "Acropolis Institute of Technology and Research",
      isLeader: false,
    }
  ]
};

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected.");

    // Avoid duplicates by deleting if it exists
    await Participant.deleteOne({ teamName: dummyTeam.teamName });

    const newTeam = new Participant(dummyTeam);
    await newTeam.save();
    console.log(`Successfully created test team: ${dummyTeam.teamName} (${dummyTeam.teamId})`);
    console.log(`Team Leader Email: ${dummyTeam.createdBy}`);
  } catch (err) {
    console.error("Error creating test team:", err);
  } finally {
    process.exit(0);
  }
}

run();
