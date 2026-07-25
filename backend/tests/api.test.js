/**
 * Phase 6: API Integration Tests (3 Roles)
 *
 * Tests the actual HTTP routes against an in-memory MongoDB instance.
 * Verifies that Student Coordinator, Admin, and Session Chair roles
 * can all correctly fetch/create/update Participant documents with the new schema.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { app } from "../server.js";

let mongod;

// ─── Test data helpers ────────────────────────────────────────────────────────

const TEST_EVENT_ID = new mongoose.Types.ObjectId().toString();
const TEST_TRACK_ID = "track-integration-001";

const sampleMember = (overrides = {}) => ({
  candidateRole: "Team Leader",
  name: "Alice Sharma",
  email: "alice@example.com",
  mobile: "+919876543210",
  location: "Pune, Maharashtra, India",
  userType: "College Students",
  domain: "Engineering",
  course: "B.Tech/BE",
  specialization: "Computer Science and Engineering",
  courseType: "Full Time",
  courseDuration: "4",
  gradYear: "2026",
  organisation: "VIT Pune",
  designation: "",
  registrationTime: "2026-06-24T05:25:34.000Z",
  differentlyAbled: false,
  workExperience: "",
  regStatus: "Complete",
  refCode: "REFABC",
  paymentStatus: "paid",
  isLeader: true,
  ...overrides,
});

const sampleTeamPayload = (overrides = {}) => ({
  eventId: TEST_EVENT_ID,
  trackId: TEST_TRACK_ID,
  submittedBy: "coordinator@test.com",
  teamId: `TM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  teamName: "Integration Test Team",
  problemStatement: "PS-99: AI driven traffic management",
  description: "Using computer vision to manage traffic signals.",
  members: [sampleMember()],
  ...overrides,
});

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  // Inject the in-memory URI into mongoose before any route handler runs
  await mongoose.connect(mongod.getUri());

  // Seed a minimal Event so track auto-derivation works in POST
  const EventModel = mongoose.models.Event || mongoose.model("Event",
    new mongoose.Schema({
      title: String,
      tracks: [{ id: String, title: String, assessmentLocked: Boolean }],
    })
  );
  await EventModel.create({
    _id: new mongoose.Types.ObjectId(TEST_EVENT_ID),
    title: "Hackathon 2026",
    tracks: [{ id: TEST_TRACK_ID, title: "AI Track", assessmentLocked: false }],
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  // Clear participants between tests, keep the Event seed
  const Participant = mongoose.models.Participant;
  if (Participant) await Participant.deleteMany({});
});

// ─── Role: Student Coordinator ────────────────────────────────────────────────

describe("Student Coordinator — API", () => {

  test("POST /api/student/participants — creates a team with new schema fields", async () => {
    const payload = sampleTeamPayload();
    const res = await request(app)
      .post("/api/student/participants")
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.participant.teamName).toBe("Integration Test Team");
    expect(res.body.participant.track).toBe("AI Track"); // auto-derived
    expect(res.body.participant.members[0].organisation).toBe("VIT Pune");
    expect(res.body.participant.members[0].specialization).toBe("Computer Science and Engineering");
    expect(res.body.participant.members[0].mobile).toBe("+919876543210");
    expect(res.body.participant.members[0].paymentStatus).toBe("paid");
  });

  test("POST /api/student/participants — fails without submittedBy", async () => {
    const { submittedBy: _removed, ...payload } = sampleTeamPayload();
    const res = await request(app)
      .post("/api/student/participants")
      .send(payload)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test("PUT /api/student/participants/:id — updates new schema fields, drops nothing", async () => {
    // Seed one participant
    const createRes = await request(app)
      .post("/api/student/participants")
      .send(sampleTeamPayload())
      .expect(200);
    const participantId = createRes.body.participant._id;

    // Update with new fields
    const updateRes = await request(app)
      .put(`/api/student/participants/${participantId}`)
      .send({
        teamName: "Updated Team Name",
        problemStatement: "PS-100: Updated statement",
        description: "Updated description.",
        pptLink: "https://res.cloudinary.com/test/raw/upload/v1/ppt.pdf",
        members: [sampleMember({ name: "Bob", email: "bob@example.com", organisation: "IIT Bombay" })],
      })
      .expect(200);

    expect(updateRes.body.success).toBe(true);
    const updated = updateRes.body.participant;
    expect(updated.teamName).toBe("Updated Team Name");
    expect(updated.problemStatement).toBe("PS-100: Updated statement");
    expect(updated.pptLink).toBe("https://res.cloudinary.com/test/raw/upload/v1/ppt.pdf");
    // Verify new member fields persist
    expect(updated.members[0].name).toBe("Bob");
    expect(updated.members[0].organisation).toBe("IIT Bombay");
    // Old fields should NOT appear
    expect(updated.members[0].institute).toBeUndefined();
    expect(updated.members[0].branch).toBeUndefined();
  });

  test("GET /api/student/participants — returns new schema with all member fields", async () => {
    await request(app)
      .post("/api/student/participants")
      .send(sampleTeamPayload())
      .expect(200);

    const res = await request(app)
      .get(`/api/student/participants?eventId=${TEST_EVENT_ID}&trackId=${TEST_TRACK_ID}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.participants).toHaveLength(1);
    const member = res.body.participants[0].members[0];
    expect(member.course).toBe("B.Tech/BE");
    expect(member.userType).toBe("College Students");
    expect(member.gradYear).toBe("2026");
    expect(member.refCode).toBe("REFABC");
  });

  test("GET /api/student/participants — missing query params returns 400", async () => {
    const res = await request(app)
      .get("/api/student/participants")
      .expect(400);
    expect(res.body.success).toBe(false);
  });
});

// ─── Role: Admin ──────────────────────────────────────────────────────────────

describe("Admin — API", () => {

  test("GET /api/admin/events/:eventId/participants — returns enriched participants with trackName", async () => {
    await request(app).post("/api/student/participants").send(sampleTeamPayload());

    const res = await request(app)
      .get(`/api/admin/events/${TEST_EVENT_ID}/participants`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.participants).toHaveLength(1);
    // Enriched with trackName from event
    expect(res.body.participants[0].trackName).toBe("AI Track");
    // New schema fields present
    expect(res.body.participants[0].members[0].organisation).toBe("VIT Pune");
  });

  test("GET /api/admin/participants?eventId&trackId — returns participants with new schema", async () => {
    await request(app).post("/api/student/participants").send(sampleTeamPayload());

    const res = await request(app)
      .get(`/api/admin/participants?eventId=${TEST_EVENT_ID}&trackId=${TEST_TRACK_ID}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.participants).toHaveLength(1);
    expect(res.body.participants[0].members[0].specialization).toBe("Computer Science and Engineering");
  });

  test("GET /api/admin/participants/:eventId — ObjectId fix: returns results (was broken before)", async () => {
    await request(app).post("/api/student/participants").send(sampleTeamPayload());

    const res = await request(app)
      .get(`/api/admin/participants/${TEST_EVENT_ID}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    // This would have returned [] before the ObjectId cast fix
    expect(res.body.participants.length).toBeGreaterThan(0);
  });

  test("GET /api/admin/participants/:eventId — invalid ObjectId returns 500 gracefully", async () => {
    const res = await request(app)
      .get("/api/admin/participants/not-a-valid-id")
      .expect(500);
    expect(res.body.success).toBe(false);
  });
});

// ─── Role: Session Chair ──────────────────────────────────────────────────────

describe("Session Chair — API", () => {

  test("GET /api/session/participants — returns participants with full new schema (read-only)", async () => {
    await request(app).post("/api/student/participants").send(sampleTeamPayload());

    const res = await request(app)
      .get(`/api/session/participants?eventId=${TEST_EVENT_ID}&trackId=${TEST_TRACK_ID}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.participants).toHaveLength(1);
    const p = res.body.participants[0];
    // All new fields visible to session chair
    expect(p.teamName).toBe("Integration Test Team");
    expect(p.track).toBe("AI Track");
    expect(p.members[0].organisation).toBe("VIT Pune");
    expect(p.members[0].paymentStatus).toBe("paid");
    expect(p.members[0].registrationTime).toBe("2026-06-24T05:25:34.000Z");
  });

  test("GET /api/session/participants — missing params returns 400", async () => {
    const res = await request(app)
      .get("/api/session/participants")
      .expect(400);
    expect(res.body.success).toBe(false);
  });

  test("PATCH /api/session/participants/:id/assessment — can update assessment score", async () => {
    const createRes = await request(app)
      .post("/api/student/participants")
      .send(sampleTeamPayload())
      .expect(200);
    const participantId = createRes.body.participant._id;

    const res = await request(app)
      .patch(`/api/session/participants/${participantId}/assessment`)
      .send({
        assessment: {
          criteria: [8, 9, 7],
          total: 24,
          notes: "Good presentation, strong problem statement.",
          mode: "criteria",
          evaluatedBy: "judge@event.com",
        },
      })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.participant.assessment.total).toBe(24);
    expect(res.body.participant.assessment.criteria).toEqual([8, 9, 7]);
    expect(res.body.participant.assessment.notes).toBe("Good presentation, strong problem statement.");
  });

  test("PATCH assessment — does NOT allow changing teamName or members (scope isolation)", async () => {
    const createRes = await request(app)
      .post("/api/student/participants")
      .send(sampleTeamPayload())
      .expect(200);
    const participantId = createRes.body.participant._id;

    // Attempt to inject teamName change through the assessment endpoint
    await request(app)
      .patch(`/api/session/participants/${participantId}/assessment`)
      .send({
        assessment: { criteria: [5], total: 5, mode: "criteria" },
        teamName: "Hacked Name",
        members: [],
      })
      .expect(200);

    // Verify teamName was NOT changed
    const fetchRes = await request(app)
      .get(`/api/session/participants?eventId=${TEST_EVENT_ID}&trackId=${TEST_TRACK_ID}`)
      .expect(200);
    expect(fetchRes.body.participants[0].teamName).toBe("Integration Test Team");
    expect(fetchRes.body.participants[0].members).toHaveLength(1);
  });
});

// ─── Cloudinary PPT Upload — Graceful degradation ─────────────────────────────

describe("PPT Upload — Graceful degradation", () => {
  test("POST /api/upload-ppt without Cloudinary env returns configured:false, not a 500", async () => {
    // In test env, Cloudinary vars are not set, so it should return graceful response
    const res = await request(app)
      .post("/api/upload-ppt")
      .attach("file", Buffer.from("dummy pdf content"), {
        filename: "test.pdf",
        contentType: "application/pdf",
      })
      .expect(200); // NOT 500

    // Even without Cloudinary configured, the server handles gracefully
    expect(res.body.success).toBe(false);
    expect(res.body.configured).toBe(false);
    expect(res.body.message).toMatch(/cloudinary/i);
  });
});
