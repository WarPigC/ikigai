const fs = require('fs');
let c = fs.readFileSync('frontend/src/App.jsx', 'utf8');

if (!c.includes('import AdminConsole')) {
  c = c.replace(/import Login from ['"]\.\/Login['"];/, "import Login from './Login';\nimport AdminConsole from './AdminConsole';");
}

c = c.replace(/<Route path="\/dashboard".*?\/>/, '<Route path="/dashboard" element={<AdminConsole events={events} refreshEvents={refreshEvents} />} />');

fs.writeFileSync('frontend/src/App.jsx', c);
console.log("App.jsx modified successfully");
