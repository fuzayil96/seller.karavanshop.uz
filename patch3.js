const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/SellersStats.jsx', 'utf-8');

// Change button label and logic
code = code.replace(
  /\{ id: "today", label: "Bugun" \},/,
  '{ id: "today", label: "Bugun / Aniq sana" },'
);

code = code.replace(
  /const active = dateMode === m\.id;/,
  'const active = dateMode === m.id || (m.id === "today" && dateMode === "specific");'
);

fs.writeFileSync('frontend/src/components/SellersStats.jsx', code);
console.log('Modified SellersStats.jsx buttons active state');
