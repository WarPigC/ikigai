const fs = require('fs');
let html = fs.readFileSync('frontend/public/student.html', 'utf8');

// Inject dropdowns into the modal
const newFields = `
            <div id="globalSelectors" class="md:col-span-2 hidden bg-green-50 p-3 rounded-lg border border-green-200 mb-4">
              <label class="text-sm font-medium text-green-800">Select Event *</label>
              <select id="scEventId" class="w-full border rounded-md px-3 py-2 mb-2 bg-white" onchange="populateTracks()">
                <option value="">-- Select Event --</option>
              </select>
              <label class="text-sm font-medium text-green-800">Select Track *</label>
              <select id="scTrackId" class="w-full border rounded-md px-3 py-2 bg-white">
                <option value="">-- Select Track --</option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium">Presenter Name *</label>
`;

if(!html.includes('id="globalSelectors"')) {
  html = html.replace('<div>\n              <label class="text-sm font-medium">Presenter Name *</label>', newFields);
}

// Inject logic into loadStudentSession
const logicPatch = `
sessionChairs = chairs || [];
window.allEvents = dataRes.allEvents || []; // Global SC

if (window.allEvents.length > 0) {
  document.getElementById('globalSelectors').classList.remove('hidden');
  const evSelect = document.getElementById('scEventId');
  evSelect.innerHTML = '<option value="">-- Select Event --</option>' + window.allEvents.map(e => \`<option value="\${e._id}">\${e.title}</option>\`).join('');
  document.getElementById('trackTitle').innerText = "Global Participant Entry";
  document.getElementById('eventTitle').innerText = "Select an event and track in the Add Participant form.";
  document.getElementById('sessionChairsBlock').innerHTML = "";
  document.querySelector('.mt-4 label').style.display = 'none'; // hide meeting link
  document.getElementById('meetingLinkInput').style.display = 'none';
  document.getElementById('editBtn').style.display = 'none';
}
`;

html = html.replace('sessionChairs = chairs || [];', logicPatch);

// Add populateTracks function
const populateTracksLogic = `
window.populateTracks = function() {
  const evId = document.getElementById('scEventId').value;
  const ev = window.allEvents.find(e => String(e._id) === String(evId));
  const trSelect = document.getElementById('scTrackId');
  if(!ev) {
    trSelect.innerHTML = '<option value="">-- Select Track --</option>';
    return;
  }
  trSelect.innerHTML = '<option value="">-- Select Track --</option>' + (ev.tracks || []).map(t => \`<option value="\${t.id}">\${t.title}</option>\`).join('');
};
`;

if (!html.includes('window.populateTracks')) {
  html = html.replace('</script>', populateTracksLogic + '\n</script>');
}

// Update saveParticipant to use selected event/track
const saveLogicSearch = `const body = {
        presenterName: pName.value,`;

const saveLogicReplace = `
const finalEventId = window.allEvents && window.allEvents.length > 0 ? document.getElementById('scEventId').value : eventId;
const finalTrackId = window.allEvents && window.allEvents.length > 0 ? document.getElementById('scTrackId').value : trackId;

if(!finalEventId || !finalTrackId) {
  alert("Please select Event and Track");
  return;
}

const body = {
        eventId: finalEventId,
        trackId: finalTrackId,
        presenterName: pName.value,`;

if (!html.includes('eventId: finalEventId')) {
  html = html.replace(saveLogicSearch, saveLogicReplace);
}

// Update loadParticipants to use final track
const fetchParticipantsSearch = `\${API_BASE}/api/student/participants/\${eventId}/\${trackId}`;
const fetchParticipantsReplace = `\${API_BASE}/api/student/participants/\${eventId}/\${trackId}/*GLOBAL_OVERRIDE*/\`;\n    if (window.allEvents && window.allEvents.length > 0) {\n      res = await fetch(\`\${API_BASE}/api/student/participants/global/global\`);\n    }`;

// Wait, the backend doesn't have /participants/global/global
// I should just change the backend API or patch student.html to fetch all participants for this global SC.
// Actually, earlier in `server.js` I modified the session to return all participants!
// So dataRes.participants is already ALL participants.
// In student.html, \`data = dataRes.participants || []\` is set in loadStudentSession, but \`loadParticipants()\` triggers a fetch.

fs.writeFileSync('frontend/public/student.html', html);
console.log('student.html patched');
