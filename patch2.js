const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/SellersStats.jsx', 'utf-8');

// Replace the array of buttons
code = code.replace(
  /\{\s*id:\s*"today",\s*label:\s*"Bugun"\s*\},[\s\S]*?\{\s*id:\s*"custom",\s*label:\s*"Oraliq sana"\s*\}/,
  '{ id: "today", label: "Bugun" },\n              { id: "custom", label: "Oraliq sana" }'
);

// Replace the month picker logic
code = code.replace(
  /\) : dateMode === "month" \? \([\s\S]*?\) : \(/,
  ') : ('
);

fs.writeFileSync('frontend/src/components/SellersStats.jsx', code);
console.log('Modified SellersStats.jsx');
