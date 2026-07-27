const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const newRoute = `
// ✅ Admin: Create Global Student Coordinator
app.post("/api/admin/student-coordinators/global", async (req, res) => {
  try {
    const { name, firstName, email, phone } = req.body;
    
    // Check if exists
    const exists = await StudentCoordinator.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already in use" });
    }

    const tempPassword = (firstName || "student").toLowerCase().replace(/[^a-z0-9]/g, "") + "123";
    const passwordHash = await hashPassword(tempPassword);

    const newStudent = await StudentCoordinator.create({
      name,
      email,
      phone,
      passwordHash,
      eventId: "global",
      trackId: "global"
    });

    res.json({ success: true, user: { ...newStudent.toObject(), tempPassword } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/admin/student-coordinators/global", async (req, res) => {
  try {
    const students = await StudentCoordinator.find({ eventId: "global" });
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
`;

if (!code.includes('/api/admin/student-coordinators/global')) {
  code = code.replace('app.listen(PORT', newRoute + '\napp.listen(PORT');
  fs.writeFileSync('server.js', code);
  console.log('Added global student coordinator routes');
} else {
  console.log('Route already exists');
}
