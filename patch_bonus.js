const fs = require('fs');

let apiCode = fs.readFileSync('backend/api.js', 'utf-8');

const regex = /myCheques\.push\(\{\s*id: c\.id \|\| c\.uuid \|\| Math\.random\(\)\.toString\(\),\s*date: c\.date,\s*amount: amount,\s*number: c\.number \|\| c\.doc_number \|\| '-',\s*isReturn: isReturn\s*\}\);/;

apiCode = apiCode.replace(regex, `myCheques.push({
            id: c.id || c.uuid || Math.random().toString(),
            date: c.date,
            amount: amount,
            bonus: (amount * (category.bonusPercentage || 0)) / 100,
            number: c.number || c.doc_number || '-',
            isReturn: isReturn
          });`);

fs.writeFileSync('backend/api.js', apiCode);
console.log('Patched api.js');
