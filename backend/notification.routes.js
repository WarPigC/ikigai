import express from "express";
import mongoose from "mongoose";

const router = express.Router();

/* ================== SCHEMA ================== */
const NotificationSchema = new mongoose.Schema(
  {
    recipientEmail: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["Welcome", "Approval", "Rejection"], required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// We define the model on the default mongoose connection
export const NotificationModel = mongoose.model("Notification", NotificationSchema, "notifications");

/* ================== ROUTES ================== */

// Get all notifications for a specific user
router.get("/", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const notifications = await NotificationModel.find({ recipientEmail: email }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mark a specific notification as read
router.put("/:id/read", async (req, res) => {
  try {
    const notification = await NotificationModel.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Mark all notifications as read for a specific user
router.put("/read-all", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    await NotificationModel.updateMany(
      { recipientEmail: email, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a specific notification
router.delete("/clear", async (req, res) => {
  try {
    const { email } = req.query; // query param for DELETE
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    await NotificationModel.deleteMany({ recipientEmail: email });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete a specific notification
router.delete("/:id", async (req, res) => {
  try {
    await NotificationModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
