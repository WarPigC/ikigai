const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const newEndpoint = `
app.post("/api/student/participants/bulk", async (req, res) => {
  try {
    const { eventId, participants } = req.body;
    if (!eventId || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ success: false, message: "Invalid payload" });
    }

    let added = 0;
    let updated = 0;
    let errors = [];

    for (const pData of participants) {
      try {
        const existing = await Participant.findOne({ eventId, teamId: pData.teamId });
        if (existing) {
          // Update existing
          existing.teamName = pData.teamName || existing.teamName;
          existing.members = pData.members || existing.members;
          await existing.save();
          updated++;
        } else {
          // Add new
          await Participant.create({
            eventId,
            teamId: pData.teamId,
            teamName: pData.teamName,
            members: pData.members,
            trackId: pData.trackId || null,
            problemStatement: pData.problemStatement || "",
            description: pData.description || ""
          });
          added++;
        }
      } catch (err) {
        errors.push({ teamId: pData.teamId, error: err.message });
      }
    }

    res.json({
      success: true,
      results: { added, updated, errors }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
`;

if (!code.includes('/api/student/participants/bulk')) {
  // Inject before app.get("/api/student/participants"
  const target = 'app.get("/api/student/participants"';
  if (code.includes(target)) {
    code = code.replace(target, newEndpoint + '\\n' + target);
    fs.writeFileSync('server.js', code);
    console.log('Bulk endpoint added successfully.');
  } else {
    console.log('Target string not found.');
  }
} else {
  console.log('Bulk endpoint already exists.');
}
