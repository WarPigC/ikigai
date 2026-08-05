import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cloudinary from "cloudinary";
import { NotificationModel } from "./notification.routes.js";

const router = express.Router();

/* ================== IKIGAI2 CONNECTION ================== */
// Create a separate connection for the "ikigai2" database
let ikigai2Db;
if (process.env.MONGO_URI) {
  const uri2 = process.env.MONGO_URI.replace("/ikigai?", "/ikigai2?");
  ikigai2Db = mongoose.createConnection(uri2);
}

/* ================== SCHEMA ================== */
const TeamSchema = new mongoose.Schema(
  {
    participantId: { type: String, required: true },
    teamName: { type: String, required: true },
    leaderEmail: { type: String, required: true },
    eventId: { type: String, required: true },
    members: { type: Array, default: [] },
    trackPreferences: { type: [String], required: true },
    transactionId: { type: String, default: "" },
    receiptUrl: { type: String, default: "" },
    status: { type: String, default: "Pending" }, // Pending, Approved, Contact
    reopenAccess: {
      fields: { type: [String], default: [] },
      expiresAt: { type: Date }
    }
  },
  { timestamps: true }
);

// We define the model on the ikigai2 connection.
// If ikigai2Db is not initialized, fallback to standard mongoose connection (for local tests if needed)
const TeamModel = ikigai2Db
  ? ikigai2Db.model("Team", TeamSchema, "teams")
  : mongoose.model("Team", TeamSchema, "teams");

// Need access to Shortlisted to pull members
const ShortlistedSchema = new mongoose.Schema({}, { strict: false });
const Shortlisted = mongoose.models.Shortlisted || mongoose.model("Shortlisted", ShortlistedSchema, "shortlisteds");

/* ================== MULTER ================== */
const upload = multer({ storage: multer.memoryStorage() });

/* ================== CLOUDINARY CONFIG ================== */
const getCloudinaryConfig = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (name && key && secret) {
    cloudinary.v2.config({
      cloud_name: name,
      api_key: key,
      api_secret: secret,
    });
    return true;
  }
  return false;
};

/* ================== ROUTES ================== */

// Student submits Round 2 registration
router.post(
  "/register",
  upload.single("receiptFile"),
  async (req, res) => {
    try {
      const { participantId, teamName, leaderEmail, eventId, transactionId, trackPreferences } = req.body;

      const existing = await TeamModel.findOne({ participantId });

      // Check reopen mode if already exists
      const isReopen = existing && existing.reopenAccess && existing.reopenAccess.expiresAt > new Date();

      if (!req.file && (!existing || !existing.receiptUrl)) {
        return res.status(400).json({ success: false, message: "No receipt provided" });
      }

      if (!getCloudinaryConfig()) {
        return res.status(500).json({ success: false, message: "Cloudinary is not configured" });
      }

      // Fetch members from Shortlisted
      let members = [];
      const shortlisted = await Shortlisted.findOne({
        $or: [
          { participantId: participantId },
          { participantId: String(participantId) },
          { participantId: mongoose.Types.ObjectId.isValid(participantId) ? new mongoose.Types.ObjectId(participantId) : null }
        ]
      });
      if (shortlisted && shortlisted.members) {
        members = shortlisted.members;
      }

      let finalReceiptUrl = existing ? existing.receiptUrl : "";

      if (req.file) {
        if (!getCloudinaryConfig()) {
          return res.status(500).json({ success: false, message: "Cloudinary is not configured" });
        }
        const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
        const result = await cloudinary.v2.uploader.upload(base64, {
          folder: `IKIGAI_Round2/${eventId}`,
          public_id: `${participantId}_receipt`,
          overwrite: true,
        });
        finalReceiptUrl = result.secure_url;
      }

      let prefs = [];
      if (trackPreferences) {
        prefs = JSON.parse(trackPreferences);
      } else if (existing) {
        prefs = existing.trackPreferences;
      }

      const updateData = {
        participantId,
        teamName,
        leaderEmail,
        eventId,
        members,
        status: "Pending"
      };

      if (prefs.length > 0) updateData.trackPreferences = prefs;
      if (transactionId) updateData.transactionId = transactionId;
      if (finalReceiptUrl) updateData.receiptUrl = finalReceiptUrl;

      // If this was a reopen submission, we can clear the reopenAccess
      if (isReopen) {
        updateData.reopenAccess = { fields: [], expiresAt: null };
      }

      const registration = await TeamModel.findOneAndUpdate(
        { participantId },
        updateData,
        { upsert: true, new: true }
      );

      res.json({ success: true, registration });
    } catch (err) {
      console.error("Round 2 Registration Error:", err);
      res.status(500).json({ success: false, message: "Registration failed" });
    }
  }
);

// Admin fetches all registrations
router.get("/admin", async (req, res) => {
  try {
    const registrations = await TeamModel.find().sort({ createdAt: -1 });
    res.json({ success: true, registrations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin update status (Allow / Contact)
router.put("/admin/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const registration = await TeamModel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    // Generate Notification if Approved
    if (status === "Approved" && registration) {
      await NotificationModel.create({
        recipientEmail: registration.leaderEmail,
        title: "Registration Approved",
        message: "Your registration has been approved successfully.",
        type: "Approval"
      });
    }

    res.json({ success: true, registration });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Admin re-open specific fields
router.put("/admin/:id/reopen", async (req, res) => {
  try {
    const { fields, durationMinutes } = req.body; // array of fields, duration
    const expiresAt = new Date(Date.now() + durationMinutes * 60000);

    const registration = await TeamModel.findByIdAndUpdate(
      req.params.id,
      {
        status: "Contact", // Keeps them in Contact status until resubmission
        reopenAccess: { fields, expiresAt }
      },
      { new: true }
    );

    if (registration) {
      await NotificationModel.create({
        recipientEmail: registration.leaderEmail,
        title: "Registration Requires Changes",
        message: "Your registration requires modifications. Please review the comments and resubmit.",
        type: "Rejection"
      });
    }

    res.json({ success: true, registration });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Fetch my registration status for timeline
router.get("/my-status", async (req, res) => {
  try {
    const email = req.query.email;
    if (!email) return res.status(400).json({ success: false });

    const registration = await TeamModel.findOne({ leaderEmail: email });
    // Registration is only complete if a transactionId exists (meaning the final form was submitted).
    // If they only saved the sequence, transactionId will be missing.
    if (!registration || !registration.transactionId) {
      return res.json({ success: true, registered: false });
    }

    return res.json({
      success: true,
      registered: true,
      status: registration.status,
      reopenAccess: registration.reopenAccess
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Save track sequence directly
router.post("/save-sequence", async (req, res) => {
  try {
    const { participantId, teamName, leaderEmail, eventId, trackPreferences } = req.body;
    if (!participantId || !trackPreferences) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const prefs = typeof trackPreferences === "string" ? JSON.parse(trackPreferences) : trackPreferences;

    // Fetch members from Shortlisted to ensure they are populated on upsert
    let members = [];
    const shortlisted = await Shortlisted.findOne({
      $or: [
        { participantId: participantId },
        { participantId: String(participantId) },
        { participantId: mongoose.Types.ObjectId.isValid(participantId) ? new mongoose.Types.ObjectId(participantId) : null }
      ]
    });
    if (shortlisted && shortlisted.members) {
      members = shortlisted.members;
    }

    const registration = await TeamModel.findOneAndUpdate(
      { participantId },
      {
        participantId,
        teamName,
        leaderEmail,
        eventId,
        trackPreferences: prefs,
        $setOnInsert: {
          members,
          status: "Pending"
        }
      },
      { upsert: true, new: true }
    );

    res.json({ success: true, registration });
  } catch (err) {
    console.error("Save Sequence Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

export { TeamModel };
export default router;
