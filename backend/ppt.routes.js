import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import libre from "libreoffice-convert";
import { promisify } from "util";

const convertAsync = promisify(libre.convert);
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
 */
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!isCloudinaryConfigured()) {
      return res.status(200).json({
        success: false,
        configured: false,
        message: "Cloudinary is not configured yet. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in your .env file.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file provided. Send the file as 'file' in a multipart/form-data request.",
      });
    }

    const { teamId, eventId } = req.body;
    let fileBuffer = req.file.buffer;
    let ext = "";
    let mimeType = req.file.mimetype;

    // Determine extension
    if (mimeType === "application/pdf") ext = ".pdf";
    else if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) ext = ".pptx";

    // 🚀 NEW LOGIC: Attempt to convert PPTX to PDF using LibreOffice
    if (ext === ".pptx") {
      try {
        console.log("🔄 Attempting to convert PPTX to PDF using LibreOffice...");
        fileBuffer = await convertAsync(fileBuffer, ".pdf", undefined);
        ext = ".pdf";
        mimeType = "application/pdf";
        console.log("✅ Successfully converted PPTX to PDF in memory!");
      } catch (conversionErr) {
        console.warn("⚠️ Failed to convert PPTX to PDF (LibreOffice might not be installed). Uploading original PPTX instead.", conversionErr.message);
        // Fallback to original buffer and extension if conversion fails
      }
    }

    // Build a human-readable public_id from teamId if available
    const publicId = teamId
      ? `CARE/ppts/${eventId || "general"}/${teamId}${ext}`
      : `CARE/ppts/${eventId || "general"}/${Date.now()}${ext}`;

    const base64 = `data:${mimeType};base64,${fileBuffer.toString("base64")}`;

    const result = await cloudinary.v2.uploader.upload(base64, {
      public_id: publicId,
      resource_type: "auto", // handles PDF, PPT, PPTX
      overwrite: true,
      unique_filename: !teamId,
    });

    console.log("✅ Presentation uploaded:", result.secure_url);
    res.json({ success: true, url: result.secure_url });
  } catch (err) {
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
