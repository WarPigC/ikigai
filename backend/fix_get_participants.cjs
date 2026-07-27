const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const regex = /app\.get\("\/api\/student\/participants", async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true, participants \}\);\s*\}\);/;

const newLogic = `app.get("/api/student/participants", async (req, res) => {
  try {
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
    }

    res.json({ success: true, participants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});`;

code = code.replace(regex, newLogic);
fs.writeFileSync('server.js', code);
console.log('Regex replace complete.');
