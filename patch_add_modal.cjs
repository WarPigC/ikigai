const fs = require('fs');

// 1. Update StudentDashboard.jsx
let sd = fs.readFileSync('frontend/src/pages/StudentDashboard.jsx', 'utf8');
sd = sd.replace(/<ParticipantList[\s\S]*?\/>/, `<ParticipantList 
          eventId={sessionData?.event?._id}
          trackId={sessionData?.track?.id}
          allEvents={sessionData?.allEvents}
        />`);
fs.writeFileSync('frontend/src/pages/StudentDashboard.jsx', sd);

// 2. Update ParticipantList.jsx
let pl = fs.readFileSync('frontend/src/components/student/ParticipantList.jsx', 'utf8');
pl = pl.replace(/export default function ParticipantList\({ eventId, trackId }\) {/, 'export default function ParticipantList({ eventId, trackId, allEvents }) {');
pl = pl.replace(/<AddParticipantModal\s+isOpen=\{isAddModalOpen\}/, '<AddParticipantModal\n        allEvents={allEvents}\n        isOpen={isAddModalOpen}');
fs.writeFileSync('frontend/src/components/student/ParticipantList.jsx', pl);

// 3. Update AddParticipantModal.jsx
let addModal = fs.readFileSync('frontend/src/components/student/AddParticipantModal.jsx', 'utf8');
addModal = addModal.replace(/export default function AddParticipantModal\({ isOpen, onClose, eventId, trackId, onSuccess }\) {/, `export default function AddParticipantModal({ isOpen, onClose, eventId, trackId, allEvents, onSuccess }) {
  const [selectedEventId, setSelectedEventId] = React.useState('');
  const [selectedTrackId, setSelectedTrackId] = React.useState('');
  const isGlobal = eventId === 'global';

  const finalEventId = isGlobal ? selectedEventId : eventId;
  const finalTrackId = isGlobal ? selectedTrackId : trackId;`);

addModal = addModal.replace(/useParticipantForm\(eventId, trackId,/, `useParticipantForm(finalEventId, finalTrackId,`);

const globalSelectorJSX = `
            {isGlobal && (
              <div className="border border-purple-100 rounded-lg p-4 bg-pink-50/30 mb-6">
                <h3 className="text-sm font-bold text-purple-700 uppercase tracking-wider mb-4 border-b border-purple-200 pb-2">
                  Global Assignment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Event *</label>
                    <select value={selectedEventId} onChange={e => { setSelectedEventId(e.target.value); setSelectedTrackId(''); }} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="">-- Select Event --</option>
                      {(allEvents || []).map(e => <option key={e._id} value={e._id}>{e.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Track *</label>
                    <select value={selectedTrackId} onChange={e => setSelectedTrackId(e.target.value)} className="w-full border rounded-md px-3 py-2 text-sm">
                      <option value="">-- Select Track --</option>
                      {selectedEventId && (allEvents || []).find(e => String(e._id) === String(selectedEventId))?.tracks?.map(t => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
            
            {/* Presenter Info */}`;

addModal = addModal.replace(/\{\/\* Presenter Info \*\/\}/, globalSelectorJSX);
fs.writeFileSync('frontend/src/components/student/AddParticipantModal.jsx', addModal);

console.log('Patched modal successfully');
