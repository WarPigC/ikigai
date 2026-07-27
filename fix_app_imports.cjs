const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Find the first occurrence of import StudentDashboard
const searchStr = 'import StudentDashboard from "./pages/StudentDashboard";';
const firstIndex = code.indexOf(searchStr);
if (firstIndex !== -1) {
  // Find the second occurrence after the first
  const secondIndex = code.indexOf(searchStr, firstIndex + 1);
  if (secondIndex !== -1) {
    // Remove the second occurrence
    code = code.substring(0, secondIndex) + code.substring(secondIndex + searchStr.length);
    fs.writeFileSync('frontend/src/App.jsx', code);
    console.log('Removed duplicate import from App.jsx');
  } else {
    console.log('Second occurrence not found');
  }
} else {
  console.log('First occurrence not found');
}
