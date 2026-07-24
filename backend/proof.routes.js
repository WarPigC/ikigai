import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cloudinary from "cloudinary";

const router = express.Router();

/* ================== CLOUDINARY ================== */
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* ================== SCHEMA ================== */
const ProofSchema = new mongoose.Schema(
  {
    participantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },
    paperId: { type: String, required: true },
    eventId: { type: mongoose.Schema.Types.ObjectId, required: true },
    trackId: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    url: { type: String, required: true },
  },
  { timestamps: true }
);

/* prevent model overwrite in dev */
const Proof =
  mongoose.models.Proof || mongoose.model("Proof", ProofSchema);

/* ================== MULTER ================== */
const upload = multer({ storage: multer.memoryStorage() });

/* ================== ROUTES ================== */

router.post(
  "/upload",
  upload.single("proofImage"),
  async (req, res) => {
    try {
      const { participantId, paperId, eventId, trackId, uploadedBy } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "No image provided" });
      }

      const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString(
        "base64"
      )}`;

      const result = await cloudinary.v2.uploader.upload(base64, {
        folder: `CARE/${eventId}/${trackId}`,
        public_id: paperId,
        overwrite: true,
        unique_filename: false,
      });

      const proof = await Proof.findOneAndUpdate(
        { participantId },
        {
          participantId,
          paperId,
          eventId,
          trackId,
          uploadedBy,
          url: result.secure_url,
        },
        { upsert: true, new: true }
      );

      res.json({ success: true, url: proof.url });
    } catch (err) {
      console.error("❌ Proof upload error:", err);
      res.status(500).json({ message: "Upload failed" });
    }
  }
);

router.get("/:participantId", async (req, res) => {
  const proof = await Proof.findOne({
    participantId: req.params.participantId,
  });

  if (!proof) {
    return res.json({ success: false, exists: false });
  }

  res.json({ success: true, exists: true, url: proof.url });
});

router.delete("/:participantId", async (req, res) => {
  const proof = await Proof.findOneAndDelete({
    participantId: req.params.participantId,
  });

  if (proof) {
    const publicId = `CARE/${proof.eventId}/${proof.trackId}/${proof.paperId}`;
    await cloudinary.v2.uploader.destroy(publicId);
  }

  res.json({ success: true });
});

export default router;
