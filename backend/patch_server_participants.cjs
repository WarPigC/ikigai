const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const oldLogic = `app.get("/api/student/participants", async (req, res) => {
  const { eventId, trackId } = req.query;

if (!eventId || !trackId) {
  return res.status(400).json({
    success: false,
    message: "Missing eventId or trackId",
  });
}
const participants = await Participant.find({
  eventId: new mongoose.Types.ObjectId(eventId),
  trackId: trackId
}).sort({ createdAt: 1 });`;

const newLogic = `app.get("/api/student/participants", async (req, res) => {
  const { eventId, trackId } = req.query;

if (!eventId || !trackId) {
  return res.status(400).json({
    success: false,
    message: "Missing eventId or trackId",
  });
}

let participants;
if (eventId === "global") {
  participants = await Participant.find({}).sort({ createdAt: 1 });
} else {
  participants = await Participant.find({
    eventId: new mongoose.Types.ObjectId(eventId),
    trackId: trackId
  }).sort({ createdAt: 1 });
}`;

if (code.includes('new mongoose.Types.ObjectId(eventId)')) {
  code = code.replace(oldLogic, newLogic);
  fs.writeFileSync('server.js', code);
  console.log('Fixed GET /api/student/participants for global');
} else {
  console.log('Could not find old logic to replace');
}
