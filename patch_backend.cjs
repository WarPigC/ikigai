const fs = require('fs');
const path = require('path');

// 1. Update backend/server.js
let serverCode = fs.readFileSync('backend/server.js', 'utf8');

serverCode = serverCode.replace(
  /paperId: { type: String, required: true },[\s\S]*?coAuthors: \[\s*\{\s*name: String,\s*email: String,\s*\}\,\s*\],/,
  `// Hackathon details
    teamName: { type: String, required: true },
    problemStatement: { type: String, required: true },
    description: String,
    pptLink: String, // url uploaded somewhere

    members: [
      {
        name: String,
        gender: String,
        institute: String,
        branch: String,
        year: String,
        phone: String,
        email: String,
        isLeader: Boolean
      }
    ],`
);

serverCode = serverCode.replace(
  /\{ eventId: 1, trackId: 1, paperId: 1 \},/,
  `{ eventId: 1, trackId: 1, teamName: 1 },`
);

fs.writeFileSync('backend/server.js', serverCode);

console.log('Updated backend schema');
