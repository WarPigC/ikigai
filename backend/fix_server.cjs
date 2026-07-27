const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
let newRoutes = fs.readFileSync('new_routes.js', 'utf8');

// Strip module.exports wrapper
newRoutes = newRoutes.replace(/module\.exports = function.*?\{/, '').replace(/\};\s*$/, '');

// Replace the require call with the actual code
code = code.replace("require('./new_routes')(app, Event, SessionChair, Participant, hashPassword, sendMail);", newRoutes);

fs.writeFileSync('server.js', code);
console.log('Fixed server.js');
