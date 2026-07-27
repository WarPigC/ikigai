const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const regexSession = /app\.get\("\/api\/student\/session\/:email", async \(req, res\) => \{[\s\S]*?(?=app\.get|app\.post|app\.put|app\.delete|\/\/\/)/;

const newSessionLogic = `
app.get("/api/student/session/:email", async (req, res) => {
  try {
    const student = await StudentCoordinator.findOne({
      email: req.params.email,
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student coordinator not found",
      });
    }

    // Global Student Coordinator logic
    if (student.eventId === "global") {
      const allEvents = await Event.find({}).lean();
      const allParticipants = await Participant.find({}).lean();
      return res.json({
        success: true,
        student,
        event: { _id: "global", title: "Global Events" },
        track: { id: "global", title: "All Tracks" },
        participants: allParticipants,
        sessionChairs: [],
        allEvents // send events to frontend to populate dropdowns
      });
    }

    const event = await Event.findById(student.eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const track = event.tracks.find((t) => String(t.id) === String(student.trackId));
    if (!track) {
      return res.status(404).json({ success: false, message: "Assigned track not found" });
    }

    const participants = await Participant.find({ eventId: event._id, trackId: track.id }).lean();
    const sessionChairs = await SessionChair.find({ eventId: event._id, trackId: track.id }).lean();

    res.json({ success: true, event, track, participants, sessionChairs, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
`;

code = code.replace(regexSession, newSessionLogic + '\n');
fs.writeFileSync('server.js', code);
console.log('Fixed student session for global SC');
