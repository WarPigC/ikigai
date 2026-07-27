const fs = require('fs');

let code = fs.readFileSync('frontend/src/services/studentApi.js', 'utf8');

if (!code.includes('bulkUploadParticipants')) {
  code = code.replace(
    /addParticipant:\s*async\s*\(/,
    `bulkUploadParticipants: async (eventId, participants) => {
    const res = await fetch(\`\${API_BASE}/api/student/participants/bulk\`, {
      method: "POST",
      headers: { ...getHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, participants }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to bulk upload participants");
    }
    return res.json();
  },
  
  addParticipant: async (`
  );
  fs.writeFileSync('frontend/src/services/studentApi.js', code);
  console.log('API patched');
}
