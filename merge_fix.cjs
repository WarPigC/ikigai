const fs = require('fs');
const path = require('path');

// 1. Fix App.jsx
let appJsx = fs.readFileSync('frontend/src/App.jsx', 'utf8');
appJsx = appJsx.replace(
  'import AdminEventParticipants from "./AdminEventParticipants";',
  'import AdminEventParticipants from "./AdminEventParticipants";\nimport StudentDashboard from "./pages/StudentDashboard";'
);
const iframeRegex = /<iframe[\s\S]*?<\/iframe>/;
appJsx = appJsx.replace(iframeRegex, '<StudentDashboard />');
appJsx = appJsx.replace(/className="w-full h-\[calc\(100vh-0px\)\] border-none"/, '');
fs.writeFileSync('frontend/src/App.jsx', appJsx);

// 2. Fix StudentDashboard.jsx (Remove TrackDetails, SessionChairsList, apply colors)
let dashboard = fs.readFileSync('frontend/src/pages/StudentDashboard.jsx', 'utf8');
dashboard = dashboard.replace(/import TrackDetails.*/g, '');
dashboard = dashboard.replace(/import SessionChairsList.*/g, '');
const trackDetailsRegex = /<div className="bg-white\/95 border border-green-100 rounded-2xl p-5 shadow-sm w-full">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
dashboard = dashboard.replace(trackDetailsRegex, '');
dashboard = dashboard.replace(/<div className="bg-white\/95 border border-purple-100 rounded-2xl p-5 shadow-sm">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/, '');

fs.writeFileSync('frontend/src/pages/StudentDashboard.jsx', dashboard);

// 3. Fix StudentHeader.jsx
const headerCode = `import React from "react";
import ProfileMenu from "./ProfileMenu";

export default function StudentHeader({ student }) {
  return (
    <header className="w-full bg-white/70 backdrop-blur-md border-b border-purple-200 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:h-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-gradient-to-br from-purple-800 to-pink-500 text-white rounded-xl shadow-lg w-10 h-10 flex items-center justify-center font-extrabold text-xl shrink-0">
            HE
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-gray-800 tracking-tight leading-none truncate">
            HackEval
          </h1>
        </div>
        <ProfileMenu student={student} />
      </div>
    </header>
  );
}`;
fs.writeFileSync('frontend/src/components/student/StudentHeader.jsx', headerCode);

// 4. Color Palette Search and Replace for all student files
function replaceColors(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceColors(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/bg-gradient-to-br from-green-50 via-green-100 to-green-200/g, 'bg-gray-50');
      content = content.replace(/bg-green-600/g, 'bg-purple-700');
      content = content.replace(/bg-green-700/g, 'bg-purple-800');
      content = content.replace(/hover:bg-green-700/g, 'hover:bg-purple-800');
      content = content.replace(/text-green-700/g, 'text-purple-700');
      content = content.replace(/border-green-200/g, 'border-purple-200');
      content = content.replace(/border-green-100/g, 'border-purple-100');
      content = content.replace(/bg-green-50/g, 'bg-pink-50');
      content = content.replace(/bg-green-100\/60/g, 'bg-purple-900/60');
      content = content.replace(/bg-green-100/g, 'bg-purple-100');
      content = content.replace(/text-green-800/g, 'text-purple-800');
      content = content.replace(/text-green-600/g, 'text-purple-600');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceColors('frontend/src/components/student');
replaceColors('frontend/src/pages');

console.log('Merge fixes applied');
