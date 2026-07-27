const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

const startTag = '{/* ADMIN */}';
const endTag = '{/* SESSION CHAIR */}';

const startIndex = code.indexOf(startTag);
const endIndex = code.indexOf(endTag);

const newAdminRoutes = `
  {/* ADMIN */}
  <Route element={<ProtectedRoutes allowedRoles={["admin"]} />}>
    
    <Route element={<AdminLayout />}>
      <Route path="/dashboard" element={<EventsView events={events} refreshEvents={refreshEvents} />} />
      <Route path="/progress" element={<ProgressView events={events} />} />
      <Route path="/users" element={<UsersView />} />
      <Route path="/event/:id" element={<EventDetails events={events} setEvents={setEvents} />} />
    </Route>

    <Route path="/create" element={<CreateEvent onEventSaved={(ev) => setEvents((prev) => [ev, ...prev])} events={events} setEvents={setEvents} />} />
    <Route path="/edit/:id" element={<EditEventWrapper events={events} setEvents={setEvents} />} />
    <Route path="/admin/events/:eventId/participants" element={<AdminEventParticipants />} />

  </Route>

  `;

code = code.substring(0, startIndex) + newAdminRoutes + code.substring(endIndex);

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Routes fixed');
