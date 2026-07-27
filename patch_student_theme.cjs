const fs = require('fs');

let html = fs.readFileSync('frontend/public/student.html', 'utf8');

// 1. Color Palette Updates
html = html.replace(/bg-gradient-to-br from-green-50 via-green-100 to-green-200/g, 'bg-gray-50');
html = html.replace(/bg-green-600/g, 'bg-purple-700');
html = html.replace(/bg-green-700/g, 'bg-purple-800');
html = html.replace(/hover:bg-green-700/g, 'hover:bg-purple-800');
html = html.replace(/text-green-700/g, 'text-purple-700');
html = html.replace(/border-green-200/g, 'border-purple-200');
html = html.replace(/border-green-100/g, 'border-purple-100');
html = html.replace(/bg-green-50/g, 'bg-pink-50');
html = html.replace(/bg-green-100\/60/g, 'bg-purple-900/60');
html = html.replace(/bg-green-100/g, 'bg-purple-100');
html = html.replace(/text-green-800/g, 'text-purple-800');
html = html.replace(/text-green-600/g, 'text-purple-600');

// 2. Remove RAMSITA Text and Update Logo
const headerSectionRegex = /<img[\s\S]*?id="profileAvatar"/;
const newHeaderSection = `<div class="flex items-center gap-3">
  <!-- LOGO -->
  <div class="bg-gradient-to-br from-purple-800 to-pink-500 text-white rounded-xl shadow-lg w-10 h-10 flex items-center justify-center font-extrabold text-xl shrink-0">
    HE
  </div>
  <!-- TITLE -->
  <h1 class="text-xl md:text-2xl font-extrabold text-gray-800 tracking-tight leading-none truncate">
    HackEval
  </h1>
</div>
</div>

        <div class="relative">
          <div
  onclick="toggleProfileMenu()"
  class="flex items-center gap-3 cursor-pointer select-none"
>
  <!-- Avatar -->
  <div
    id="profileAvatar"`;
html = html.replace(headerSectionRegex, newHeaderSection);

// 3. Remove the entire white section containing Track Details, Meeting Link, Session Chairs
// That is from <div class="bg-white/95 border border-purple-100 rounded-2xl p-5 shadow-sm">
// Down to </div> </div> </div> before <!-- ===== Search / Filter / Sort Controls ===== -->
const blockToRemoveStart = html.indexOf('<div class="bg-white/95 border border-purple-100 rounded-2xl p-5 shadow-sm">');
if (blockToRemoveStart !== -1) {
  const blockToRemoveEnd = html.indexOf('<!-- ===== Search / Filter / Sort Controls ===== -->');
  html = html.substring(0, blockToRemoveStart) + html.substring(blockToRemoveEnd);
}

// 4. Clean up JS references to the removed elements so it doesn't throw errors
html = html.replace(/document\.getElementById\('trackTitle'\)\.innerText.*?;/g, '');
html = html.replace(/document\.getElementById\('eventTitle'\)\.innerText.*?;/g, '');
html = html.replace(/document\.getElementById\('trackDesc'\)\.innerText.*?;/g, '');
html = html.replace(/document\.getElementById\('sessionChairsBlock'\)\.innerHTML.*?;/g, '');
html = html.replace(/document\.querySelector\('\.mt-4 label'\)\.style\.display.*?;/g, '');
html = html.replace(/document\.getElementById\('meetingLinkInput'\)\.style\.display.*?;/g, '');
html = html.replace(/document\.getElementById\('editBtn'\)\.style\.display.*?;/g, '');
html = html.replace(/renderSessionChairs\(\);/g, '');
html = html.replace(/await fetchMeetingLink\(\);/g, '');

fs.writeFileSync('frontend/public/student.html', html);
console.log('student.html theme, header, and layout patched successfully!');
