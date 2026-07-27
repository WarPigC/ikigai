const fs = require('fs');

let code = fs.readFileSync('backend/server.js', 'utf8');

// Update trackId required: false
code = code.replace(
  /trackId: \{\s*type: String,\s*required: true,\s*index: true,\s*\}/,
  `trackId: {\n      type: String,\n      required: false,\n      index: true,\n    }`
);

// Update Hackathon details
code = code.replace(
  /\/\/ Hackathon details[\s\S]*?members: \[[\s\S]*?\],\s*\n/,
  `// Hackathon details
    teamId: { type: String, unique: true, sparse: true },
    teamName: { type: String, required: true },
    problemStatement: { type: String, required: false },
    description: { type: String, required: false },
    pptLink: { type: String, required: false }, // url uploaded somewhere

    members: [
      {
        name: String,
        gender: String,
        institute: String,
        branch: String,
        year: String,
        phone: String,
        email: String,
        location: String,
        category: String,
        stream: String,
        degree: String,
        mode: String,
        gradYear: String,
        isLeader: Boolean
      }
    ],
`
);

// Add bulk upload endpoint
const bulkEndpoint = `
// Bulk create/update participants from CSV
app.post("/api/student/participants/bulk", authMiddleware, roleMiddleware(["student_coordinator", "admin"]), async (req, res) => {
  try {
    const { eventId, participants } = req.body;
    if (!eventId || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ error: "Invalid payload" });
    }
    
    const results = { added: 0, updated: 0, errors: [] };
    
    for (const p of participants) {
      try {
        if (p.teamId) {
          const existing = await Participant.findOne({ eventId, teamId: p.teamId });
          if (existing) {
            // Update existing
            existing.members = p.members || existing.members;
            existing.teamName = p.teamName || existing.teamName;
            if (p.trackId) existing.trackId = p.trackId;
            if (p.problemStatement) existing.problemStatement = p.problemStatement;
            await existing.save();
            results.updated++;
          } else {
            // Create new
            const newP = new Participant({
              eventId,
              trackId: p.trackId || "unassigned",
              teamId: p.teamId,
              teamName: p.teamName,
              problemStatement: p.problemStatement || "",
              createdBy: req.user.email,
              members: p.members
            });
            await newP.save();
            results.added++;
          }
        } else {
          // No teamId provided
          const newP = new Participant({
            eventId,
            trackId: p.trackId || "unassigned",
            teamName: p.teamName || "Unknown Team",
            problemStatement: p.problemStatement || "",
            createdBy: req.user.email,
            members: p.members
          });
          await newP.save();
          results.added++;
        }
      } catch (err) {
        console.error("Bulk insert error for team", p.teamName, err);
        results.errors.push({ teamName: p.teamName, error: err.message });
      }
    }
    
    res.json({ message: "Bulk upload completed", results });
  } catch (err) {
    console.error("Bulk upload err:", err);
    res.status(500).json({ error: "Server error" });
  }
});
`;

if (!code.includes('/api/student/participants/bulk')) {
  code = code.replace(
    /app\.post\("\/api\/student\/participants", authMiddleware/,
    bulkEndpoint + '\napp.post("/api/student/participants", authMiddleware'
  );
}

// Remove unique index on eventId, trackId, teamName since teamName might repeat or be null etc
// Actually we had: ParticipantSchema.index({ eventId: 1, trackId: 1, teamName: 1 }, { unique: true });
code = code.replace(
  /ParticipantSchema\.index\(\s*\{\s*eventId:\s*1,\s*trackId:\s*1,\s*teamName:\s*1\s*\},\s*\{\s*unique:\s*true\s*\}\s*\);/,
  `// Removed strict unique index to allow incomplete CSV imports`
);

fs.writeFileSync('backend/server.js', code);
console.log('Backend patched.');
