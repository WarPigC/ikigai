const fs = require('fs');
const path = require('path');

function replaceFocus(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceFocus(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace focus green rings with minimal black/gray borders
      content = content.replace(/focus:ring-green-500/g, 'focus:ring-gray-800/20');
      content = content.replace(/focus:border-green-500/g, 'focus:border-gray-800');
      
      // Just in case any other green borders slipped through
      content = content.replace(/border-green-500/g, 'border-gray-800');
      
      fs.writeFileSync(fullPath, content);
    }
  }
}

replaceFocus('frontend/src/components/student');
console.log('Fixed focus colors');
