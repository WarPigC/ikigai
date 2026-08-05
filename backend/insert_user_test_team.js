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
  createdBy: "alpha.test.leader@test.com",
  teamId: "TEAM_TEST_ALPHA",
  teamName: "Test Team Alpha",
  problemStatement: "Testing New Registration Flow",
  description: "A dummy team created to test the newly added features like T-shirt selection and rules acceptance.",
  pptLink: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.pdf",
  status: "EVALUATED",
  assignedEvaluators: ["6a67d95205455bdf7700860b"],
  assessments: [{
    "evaluatorId": "6a67d95205455bdf7700860b",
    "criteria": [10, 10, 10, 10, true],
    "total": 40,
    "notes": "JSON:[\"ok\",\"ok\",\"ok\",\"ok\",\"ok\"]",
    "mode": "criteria",
    "evaluatedBy": "sessionChair",
    "evaluatedAt": new Date()
  }],
  members: [
    {
      candidateRole: "Team Leader",
      name: "Ravi Kumar",
      email: "alpha.test.leader@test.com",
      mobile: "9999999991",
      location: "Indore, Madhya Pradesh",
      userType: "College Students",
      domain: "Engineering",
      course: "B.Tech/BE",
      specialization: "Computer Science",
      courseType: "Full Time",
      courseDuration: "4",
      gradYear: "2025",
      organisation: "Test Institute",
      isLeader: true,
    },
    {
      candidateRole: "Team Member",
      name: "Sneha Patel",
      email: "sneha.patel@test.com",
      mobile: "9999999992",
      location: "Indore, Madhya Pradesh",
      userType: "College Students",
      domain: "Engineering",
      course: "B.Tech/BE",
      specialization: "Data Science",
      courseType: "Full Time",
      courseDuration: "4",
      gradYear: "2025",
      organisation: "Test Institute",
      isLeader: false,
    },
    {
      candidateRole: "Team Member",
      name: "Amit Sharma",
      email: "amit.sharma@test.com",
      mobile: "9999999993",
      location: "Indore, Madhya Pradesh",
      userType: "College Students",
      domain: "Engineering",
      course: "B.Tech/BE",
      specialization: "Artificial Intelligence",
      courseType: "Full Time",
      courseDuration: "4",
      gradYear: "2025",
      organisation: "Test Institute",
      isLeader: false,
    }
  ]
};

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected.");

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
