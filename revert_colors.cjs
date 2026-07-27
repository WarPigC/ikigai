const fs = require('fs');
const path = require('path');

function revertColors(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      revertColors(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      content = content.replace(/bg-gray-50/g, 'bg-green-50');
      content = content.replace(/bg-purple-700/g, 'bg-green-600');
      content = content.replace(/bg-purple-800/g, 'bg-green-700');
      content = content.replace(/hover:bg-purple-800/g, 'hover:bg-green-700');
      content = content.replace(/text-purple-700/g, 'text-green-700');
      content = content.replace(/border-purple-200/g, 'border-green-200');
      content = content.replace(/border-purple-100/g, 'border-green-100');
      content = content.replace(/bg-pink-50/g, 'bg-green-50');
      content = content.replace(/bg-purple-900\/60/g, 'bg-green-100/60');
      content = content.replace(/bg-purple-100/g, 'bg-green-100');
      content = content.replace(/text-purple-800/g, 'text-green-800');
      content = content.replace(/text-purple-600/g, 'text-green-600');
      
      // Also apply user requested UI styling (minimal black borders instead of heavy colored borders)
      // "use minimal black lines as a border or outlines"
      // So we can convert border-green-100/200 to border-gray-200, and remove shadow where it makes sense, but we'll do this carefully.
      content = content.replace(/border-green-100/g, 'border-gray-200');
      content = content.replace(/border-green-200/g, 'border-gray-300');
      content = content.replace(/border border-gray-200/g, 'border border-gray-800/10');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

revertColors('frontend/src/components/student');
revertColors('frontend/src/pages');

// Update StudentHeader.jsx to use the logo
const headerCode = `import React from "react";
import ProfileMenu from "./ProfileMenu";
import ramsitaLogo from "../../assets/ramsita-logo.png";

export default function StudentHeader({ student }) {
  return (
    <header className="w-full bg-white/70 backdrop-blur-md border-b border-gray-800/10 shadow-sm">
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:h-20">
        <div className="flex items-center gap-3 min-w-0">
          <img
            src={ramsitaLogo}
            alt="HackEval Logo"
            className="w-12 h-12 object-contain shrink-0"
          />
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

console.log('Reverted colors to use green-* variables and added logo');
