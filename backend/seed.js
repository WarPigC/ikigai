import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const StudentCoordinatorSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, lowercase: true, trim: true },
    phone: String,
    passwordHash: String,
    trackId: String,
    eventId: String,
  },
  { timestamps: true }
);

const TrackSchema = new mongoose.Schema({ id: String, title: String }, { _id: true });
const EventSchema = new mongoose.Schema({ title: String, tracks: [TrackSchema] }, { timestamps: true });

const StudentCoordinator = mongoose.model("StudentCoordinator", StudentCoordinatorSchema);
const Event = mongoose.model("Event", EventSchema);

const hashPassword = (password) => crypto.createHash("sha256").update(password).digest("hex");

async function seed() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected.");

    let event = await Event.findOne();
    
    if (!event) {
      console.log("No events found. Creating dummy event...");
      event = new Event({
        title: "Test Event 2026",
        tracks: [{ id: "track-1", title: "AI Track" }]
      });
      await event.save();
    } else if (!event.tracks || event.tracks.length === 0) {
      event.tracks.push({ id: "track-1", title: "AI Track" });
      await event.save();
    }

    const eventId = event._id.toString();
    const trackId = event.tracks[0].id;

    const email = "student@ikigai.com";
    const password = "password123";

    await StudentCoordinator.deleteOne({ email });

    const sc = new StudentCoordinator({
      name: "Student Coordinator",
      email: email,
      phone: "1234567890",
      passwordHash: hashPassword(password),
      eventId: eventId,
      trackId: trackId,
    });

    await sc.save();
    
    console.log("🎉 Seed successful!");
    console.log("-----------------------------------------");
    console.log(`Email:    ${email}`);
    console.log(`Password: ${password}`);
    console.log(`Event ID: ${eventId}`);
    console.log(`Track ID: ${trackId}`);
    console.log("-----------------------------------------");
    console.log("You can now log in at http://localhost:5173/login");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
