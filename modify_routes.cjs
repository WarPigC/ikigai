const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.jsx', 'utf8');

// Fix imports
code = code.replace(/import AdminConsole from '\.\/AdminConsole';/, "import { EventsView, ProgressView, UsersView } from './AdminConsole';\nimport AdminLayout from './AdminLayout';");

// Replace routes
const oldRoute = '<Route path="/dashboard" element={<AdminConsole events={events} refreshEvents={refreshEvents} />} />';
const newRoutes = `
    <Route element={<AdminLayout />}>
      <Route path="/dashboard" element={<EventsView events={events} refreshEvents={refreshEvents} />} />
      <Route path="/progress" element={<ProgressView events={events} />} />
      <Route path="/users" element={<UsersView />} />
      <Route path="/event/:id" element={<EventDetails events={events} setEvents={setEvents} />} />
    </Route>
`;

code = code.replace(oldRoute, newRoutes);
code = code.replace(/<Route path="\/event\/:id".*?\/>/, ""); // Remove the duplicate old event/:id route

fs.writeFileSync('frontend/src/App.jsx', code);
console.log('Modified App.jsx to use AdminLayout');
