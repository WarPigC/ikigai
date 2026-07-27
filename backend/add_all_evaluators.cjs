const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

const newRoute = `
app.get('/api/admin/evaluators/all', async (req, res) => {
  try {
    const chairs = await SessionChair.find({});
    res.json({ success: true, chairs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
`;

if (!code.includes('/api/admin/evaluators/all')) {
  code = code.replace('app.listen(PORT', newRoute + '\napp.listen(PORT');
  fs.writeFileSync('server.js', code);
  console.log('Added /api/admin/evaluators/all');
} else {
  console.log('Route already exists');
}
