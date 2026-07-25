/**
 * Phase 5: Schema Unit Tests
 *
 * Tests the Participant Mongoose schema in isolation using an in-memory MongoDB instance.
 * No real database connection required.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// ─── Inline the schema so tests are self-contained and don't boot the full server ───
const ParticipantSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    trackId: { type: String, required: false },
    createdBy: { type: String, required: true },

    teamId: { type: String, unique: true, sparse: true },
    teamName: { type: String, required: true },
    track: { type: String },
    problemStatement: { type: String },
    description: { type: String },
    pptLink: { type: String },

    members: [
      {
        candidateRole: String,
        name: String,
        email: String,
        mobile: String,
        location: String,
        userType: String,
        domain: String,
        course: String,
        specialization: String,
        courseType: String,
        courseDuration: String,
        classGrade: String,
        gradYear: String,
        organisation: String,
        designation: String,
        registrationTime: { type: mongoose.Schema.Types.Mixed },
        differentlyAbled: { type: mongoose.Schema.Types.Mixed },
        workExperience: String,
        regStatus: String,
        refCode: String,
        paymentStatus: String,
        isLeader: { type: Boolean, default: false },
      },
    ],

    status: {
      type: String,
      enum: ["DRAFT", "SUBMITTED", "EVALUATED"],
      default: "DRAFT",
    },
    assessment: {
      criteria: { type: [Number], default: [] },
      total: Number,
      notes: String,
      mode: { type: String, enum: ["criteria", "direct"] },
      evaluatedBy: String,
      evaluatedAt: Date,
    },
  },
  { timestamps: true }
);

let Participant;
let mongod;

// ─── Helpers ────────────────────────────────────────────────────────────────────
const fakeEventId = () => new mongoose.Types.ObjectId();

const validTeam = (overrides = {}) => ({
  eventId: fakeEventId(),
  trackId: "track-001",
  createdBy: "coordinator@test.com",
  teamId: `TM-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  teamName: "Test Team",
  track: "AI Track",
  members: [
    {
      candidateRole: "Team Leader",
      name: "Alice",
      email: "alice@example.com",
      mobile: "+919999999999",
      location: "Mumbai, Maharashtra, India",
      userType: "College Students",
      domain: "Engineering",
      course: "B.Tech/BE",
      specialization: "Computer Science and Engineering",
      courseType: "Full Time",
      courseDuration: "4",
      gradYear: "2026",
      organisation: "IIT Bombay",
      designation: "",
      registrationTime: "2026-06-24T05:25:34.000Z",
      differentlyAbled: false,
      workExperience: "",
      regStatus: "Complete",
      refCode: "REF123",
      paymentStatus: "paid",
      isLeader: true,
    },
  ],
  ...overrides,
});

// ─── Setup / Teardown ────────────────────────────────────────────────────────────
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Prevent "Cannot overwrite model" error when tests reload the module
  Participant =
    mongoose.models.Participant ||
    mongoose.model("Participant", ParticipantSchema);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Participant.deleteMany({});
});

// ─── Tests ───────────────────────────────────────────────────────────────────────

describe("ParticipantSchema — Phase 5 Unit Tests", () => {

  // ── Required fields ────────────────────────────────────────────────────────
  describe("Required field enforcement", () => {
    test("creates a valid participant successfully", async () => {
      const doc = await Participant.create(validTeam());
      expect(doc._id).toBeDefined();
      expect(doc.teamName).toBe("Test Team");
      expect(doc.status).toBe("DRAFT"); // default
    });

    test("fails without eventId", async () => {
      const { eventId: _removed, ...data } = validTeam();
      await expect(Participant.create(data)).rejects.toThrow(/eventId/);
    });

    test("fails without teamName", async () => {
      const { teamName: _removed, ...data } = validTeam();
      await expect(Participant.create(data)).rejects.toThrow(/teamName/);
    });

    test("fails without createdBy", async () => {
      const { createdBy: _removed, ...data } = validTeam();
      await expect(Participant.create(data)).rejects.toThrow(/createdBy/);
    });
  });

  // ── New CSV-aligned member fields ──────────────────────────────────────────
  describe("CSV-aligned member fields", () => {
    test("stores all new member fields without loss", async () => {
      const doc = await Participant.create(validTeam());
      const member = doc.members[0];

      expect(member.candidateRole).toBe("Team Leader");
      expect(member.mobile).toBe("+919999999999");
      expect(member.organisation).toBe("IIT Bombay");
      expect(member.specialization).toBe("Computer Science and Engineering");
      expect(member.course).toBe("B.Tech/BE");
      expect(member.userType).toBe("College Students");
      expect(member.domain).toBe("Engineering");
      expect(member.courseType).toBe("Full Time");
      expect(member.gradYear).toBe("2026");
      expect(member.paymentStatus).toBe("paid");
      expect(member.regStatus).toBe("Complete");
      expect(member.refCode).toBe("REF123");
      expect(member.isLeader).toBe(true);
    });

    test("stores old field names (institute, branch) as undefined — confirms schema migration", async () => {
      const doc = await Participant.create(validTeam());
      const member = doc.members[0];
      // These old fields no longer exist in the schema
      expect(member.institute).toBeUndefined();
      expect(member.branch).toBeUndefined();
      expect(member.phone).toBeUndefined();
      expect(member.gender).toBeUndefined();
    });
  });

  // ── Team-level fields ──────────────────────────────────────────────────────
  describe("Team-level fields", () => {
    test("stores track field at team level", async () => {
      const doc = await Participant.create(validTeam({ track: "Robotics Track" }));
      expect(doc.track).toBe("Robotics Track");
    });

    test("stores pptLink as a string URL", async () => {
      const url = "https://res.cloudinary.com/test/raw/upload/v1/CARE/ppts/general/TM001.pdf";
      const doc = await Participant.create(validTeam({ pptLink: url }));
      expect(doc.pptLink).toBe(url);
    });

    test("stores problemStatement and description", async () => {
      const doc = await Participant.create(
        validTeam({
          problemStatement: "PS-42: Smart waste sorting using CV",
          description: "We use YOLOv8 to detect and classify waste in real time.",
        })
      );
      expect(doc.problemStatement).toBe("PS-42: Smart waste sorting using CV");
      expect(doc.description).toContain("YOLOv8");
    });
  });

  // ── registrationTime — zero data loss ─────────────────────────────────────
  describe("registrationTime (Mixed type — zero data loss)", () => {
    test("stores a valid ISO date string as-is", async () => {
      const isoDate = "2026-06-24T05:25:34.000Z";
      const doc = await Participant.create(
        validTeam({
          members: [{ ...validTeam().members[0], registrationTime: isoDate }],
        })
      );
      expect(doc.members[0].registrationTime).toBe(isoDate);
    });

    test("stores a malformed date string without data loss", async () => {
      const weirdDate = "24-june-2026 garbage_value!!";
      const doc = await Participant.create(
        validTeam({
          members: [{ ...validTeam().members[0], registrationTime: weirdDate }],
        })
      );
      expect(doc.members[0].registrationTime).toBe(weirdDate);
    });

    test("stores null registrationTime without error", async () => {
      const doc = await Participant.create(
        validTeam({
          members: [{ ...validTeam().members[0], registrationTime: null }],
        })
      );
      expect(doc.members[0].registrationTime).toBeNull();
    });
  });

  // ── differentlyAbled — Mixed type ─────────────────────────────────────────
  describe("differentlyAbled (Mixed type — graceful handling)", () => {
    test("stores Boolean true correctly", async () => {
      const doc = await Participant.create(
        validTeam({ members: [{ ...validTeam().members[0], differentlyAbled: true }] })
      );
      expect(doc.members[0].differentlyAbled).toBe(true);
    });

    test("stores Boolean false correctly", async () => {
      const doc = await Participant.create(
        validTeam({ members: [{ ...validTeam().members[0], differentlyAbled: false }] })
      );
      expect(doc.members[0].differentlyAbled).toBe(false);
    });

    test("stores raw string 'Yes' without error (pre-parsed CSV value)", async () => {
      const doc = await Participant.create(
        validTeam({ members: [{ ...validTeam().members[0], differentlyAbled: "Yes" }] })
      );
      expect(doc.members[0].differentlyAbled).toBe("Yes");
    });
  });

  // ── teamId unique index ────────────────────────────────────────────────────
  describe("teamId — global unique sparse index", () => {
    test("allows two documents with no teamId (sparse index)", async () => {
      const { teamId: _1, ...data1 } = validTeam();
      const { teamId: _2, ...data2 } = validTeam();
      const d1 = await Participant.create(data1);
      const d2 = await Participant.create(data2);
      expect(d1._id).toBeDefined();
      expect(d2._id).toBeDefined();
    });

    test("prevents two documents with the same teamId", async () => {
      const sharedId = "SHARED-001";
      await Participant.create(validTeam({ teamId: sharedId }));
      await expect(
        Participant.create(validTeam({ teamId: sharedId }))
      ).rejects.toThrow(/duplicate key/i);
    });

    test("allows two documents with different teamIds", async () => {
      const d1 = await Participant.create(validTeam({ teamId: "TEAM-AAA" }));
      const d2 = await Participant.create(validTeam({ teamId: "TEAM-BBB" }));
      expect(d1.teamId).toBe("TEAM-AAA");
      expect(d2.teamId).toBe("TEAM-BBB");
    });
  });

  // ── Status default & enum ──────────────────────────────────────────────────
  describe("Status field", () => {
    test("defaults to DRAFT", async () => {
      const doc = await Participant.create(validTeam());
      expect(doc.status).toBe("DRAFT");
    });

    test("rejects invalid status values", async () => {
      await expect(
        Participant.create(validTeam({ status: "INVALID" }))
      ).rejects.toThrow(/status/);
    });
  });

});
