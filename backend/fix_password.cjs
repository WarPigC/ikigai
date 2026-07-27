const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// Replace random password generation for evaluators
code = code.replace(/const tempPassword = Math\.random\(\)\.toString\(36\)\.slice\(-8\);/, 'const tempPassword = (req.body.firstName || "evaluator").toLowerCase().replace(/[^a-z0-9]/g, "") + "123";');

fs.writeFileSync('server.js', code);
console.log('Updated evaluator password logic');
