const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');
code = code.replace("const express = require('express');", "");
fs.writeFileSync('server.js', code);
console.log('Fixed express redeclaration');
