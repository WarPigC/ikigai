import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";

const router = express.Router();

/* ================== CLOUDINARY ================== */
// Config is shared from env vars. If not configured, uploads return a graceful error.
const isCloudinaryConfigured = () => {
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

/* ================== MULTER ================== */
// Memory storage — no files written to disk.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    // Accept only presentation formats
    const allowed = [
      "application/pdf",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, PPT, and PPTX are allowed."));
    }
  },
});

/* ================== ROUTES ================== */

/**
 * POST /api/upload-ppt
 * Uploads a team's presentation file to Cloudinary.
 *
 * Body: multipart/form-data
 *   - file: the presentation file (PDF, PPT, PPTX, ZIP)
 *   - teamId: (optional) used to name the file in Cloudinary
 *   - eventId: (optional) used to organise the file in a folder
 *
 * Response:
 *   - { success: true, url: "https://..." }      — upload succeeded
 *   - { success: false, configured: false, ... } — Cloudinary not configured yet
 *   - { success: false, message: "..." }          — upload failed
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(200).json({
        success: false,
        configured: false,
        message:
          "Cloudinary is not configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided. Send the file as 'file' in a multipart/form-data request.",
      });
    }

    const { teamId, eventId } = req.body;

    let ext = "";
    if (req.file.mimetype === "application/pdf") ext = ".pdf";
    else if (req.file.mimetype.includes("powerpoint") || req.file.mimetype.includes("presentation")) ext = ".pptx";

    // Build a human-readable public_id from teamId if available
    const publicId = teamId
      ? `CARE/ppts/${eventId || "general"}/${teamId}${ext}`
      : `CARE/ppts/${eventId || "general"}/${Date.now()}${ext}`;

    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;

    const result = await cloudinary.v2.uploader.upload(base64, {
      public_id: publicId,
      resource_type: "auto", // handles PDF, PPT, PPTX
      overwrite: true,
      unique_filename: !teamId,
    });

    console.log("✅ PPT uploaded:", result.secure_url);

    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    // Cloudinary can throw plain objects, Error instances, or even raw strings.
    const errString = typeof err === "string" ? err : String(err?.message || err);
    
    const isAuthError =
      err?.http_code === 401 ||
      errString.toLowerCase().includes("api_key") ||
      errString.toLowerCase().includes("cloud_name") ||
      errString.toLowerCase().includes("disabled");

    if (isAuthError) {
      console.warn("⚠️ PPT upload: Cloudinary credentials are invalid or not configured correctly. Error:", errString);
      return res.status(200).json({
        success: false,
        configured: false,
        message: "Cloudinary credentials are invalid. Check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.",
      });
    }


    console.error("❌ PPT upload error:", err);
    res.status(500).json({
      success: false,
      message: err?.message || "Upload failed",
    });
  }

});

export default router;
