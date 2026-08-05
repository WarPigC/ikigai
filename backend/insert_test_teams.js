import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI;

// Same schema definition to bypass strict mode
const ParticipantSchema = new mongoose.Schema({}, { strict: false });
const Participant = mongoose.model("Participant", ParticipantSchema, "participants");

const dummyTeams = [
  {
    eventId: "6a662b10276c0be974e309f6",
    trackId: "007",
    track: "Hybrid",
    createdBy: "test.f.leader@testf.com",
    teamId: "TEAM_TEST_F",
    teamName: "Test F",
    problemStatement: "AI in Agriculture",
    description: "Crop yield prediction model using satellite imagery and soil health data.",
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
        name: "Priya Sharma",
        email: "test.f.leader@testf.com",
        mobile: "9876541111",
        location: "Pune, Maharashtra",
        userType: "College Students",
        domain: "Engineering",
        course: "B.Tech/BE",
        specialization: "Artificial Intelligence",
        courseType: "Full Time",
        courseDuration: "4",
        gradYear: "2025",
        organisation: "Pune Institute of Computer Technology",
        isLeader: true,
      },
      {
        candidateRole: "Team Member",
        name: "Rohan Patel",
        email: "rohan.patel@testf.com",
        mobile: "9876541112",
        location: "Pune, Maharashtra",
        userType: "College Students",
        domain: "Engineering",
        course: "B.Tech/BE",
        specialization: "Data Science",
        courseType: "Full Time",
        courseDuration: "4",
        gradYear: "2025",
        organisation: "Pune Institute of Computer Technology",
        isLeader: false,
      },
      {
        candidateRole: "Team Member",
        name: "Neha Gupta",
        email: "neha.gupta@testf.com",
        mobile: "9876541113",
        location: "Pune, Maharashtra",
        userType: "College Students",
        domain: "Engineering",
        course: "B.Tech/BE",
        specialization: "Computer Science",
        courseType: "Full Time",
        courseDuration: "4",
        gradYear: "2025",
        organisation: "Pune Institute of Computer Technology",
        isLeader: false,
      }
    ]
  },
  {
    eventId: "6a662b10276c0be974e309f6",
    trackId: "007",
    track: "Hybrid",
    createdBy: "test.g.leader@testg.com",
    teamId: "TEAM_TEST_G",
    teamName: "Test G",
    problemStatement: "Smart Traffic Management",
    description: "An adaptive traffic light system based on real-time vehicle density using computer vision.",
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
        name: "Ananya Desai",
        email: "test.g.leader@testg.com",
        mobile: "9876542221",
        location: "Ahmedabad, Gujarat",
        userType: "College Students",
        domain: "Engineering",
        course: "B.Tech/BE",
        specialization: "Information Technology",
        courseType: "Full Time",
        courseDuration: "4",
        gradYear: "2026",
        organisation: "Nirma University",
        isLeader: true,
      },
      {
        candidateRole: "Team Member",
        name: "Vikram Singh",
        email: "vikram.singh@testg.com",
        mobile: "9876542222",
        location: "Ahmedabad, Gujarat",
        userType: "College Students",
        domain: "Engineering",
        course: "B.Tech/BE",
        specialization: "Electronics",
        courseType: "Full Time",
        courseDuration: "4",
        gradYear: "2026",
        organisation: "Nirma University",
        isLeader: false,
      },
      {
        candidateRole: "Team Member",
        name: "Karan Mehta",
        email: "karan.mehta@testg.com",
        mobile: "9876542223",
        location: "Ahmedabad, Gujarat",
        userType: "College Students",
        domain: "Engineering",
        course: "B.Tech/BE",
        specialization: "Computer Science",
        courseType: "Full Time",
        courseDuration: "4",
        gradYear: "2026",
        organisation: "Nirma University",
        isLeader: false,
      }
    ]
  },
  {
    eventId: "6a662b10276c0be974e309f6",
    trackId: "007",
    track: "Hybrid",
    createdBy: "test.h.leader@testh.com",
    teamId: "TEAM_TEST_H",
    teamName: "Test H",
    problemStatement: "Disaster Response Bot",
    description: "An autonomous rover capable of navigating debris and sending video feeds back to rescue teams.",
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
        name: "Siddharth Verma",
        email: "test.h.leader@testh.com",
        mobile: "9876543331",
        location: "Chennai, Tamil Nadu",
        userType: "College Students",
        domain: "Engineering",
        course: "B.Tech/BE",
        specialization: "Robotics",
        courseType: "Full Time",
        courseDuration: "4",
        gradYear: "2024",
        organisation: "SRM Institute of Science and Technology",
        isLeader: true,
      },
      {
        candidateRole: "Team Member",
        name: "Divya Krishnan",
        email: "divya.krishnan@testh.com",
        mobile: "9876543332",
        location: "Chennai, Tamil Nadu",
        userType: "College Students",
        domain: "Engineering",
        course: "B.Tech/BE",
        specialization: "Computer Science",
        courseType: "Full Time",
        courseDuration: "4",
        gradYear: "2024",
        organisation: "SRM Institute of Science and Technology",
        isLeader: false,
      },
      {
        candidateRole: "Team Member",
        name: "Aditya Iyer",
        email: "aditya.iyer@testh.com",
        mobile: "9876543333",
        location: "Chennai, Tamil Nadu",
        userType: "College Students",
        domain: "Engineering",
        course: "B.Tech/BE",
        specialization: "Electronics",
        courseType: "Full Time",
        courseDuration: "4",
        gradYear: "2024",
        organisation: "SRM Institute of Science and Technology",
        isLeader: false,
      }
    ]
  }
];

async function run() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected.");

    for (const data of dummyTeams) {
      const newTeam = new Participant(data);
      await newTeam.save();
      console.log(`Successfully created dummy team: ${data.teamName} (${data.teamId})`);
    }

    console.log("All dummy teams inserted.");
  } catch (err) {
    console.error("Error creating dummy teams:", err);
  } finally {
    process.exit(0);
  }
}

run();
