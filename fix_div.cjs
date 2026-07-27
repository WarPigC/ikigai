const fs = require('fs');
let code = fs.readFileSync('frontend/src/pages/StudentDashboard.jsx', 'utf8');

const regex = /<div className="bg-white\/95 border border-purple-100 rounded-2xl p-5 shadow-sm">\s*<div className="flex items-start justify-between gap-6">\s*<\/div>\s*/;
code = code.replace(regex, '');

fs.writeFileSync('frontend/src/pages/StudentDashboard.jsx', code);
console.log('Divs fixed');
