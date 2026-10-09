const fs = require('fs');
let lines = fs.readFileSync('frontend/src/components/SellersStats.jsx', 'utf-8').split(/\r?\n/);

const index = lines.findIndex(l => l.includes('          )}'));
if (index !== -1 && lines[index+1].includes('        </div>')) {
  lines.splice(index + 1, 0, 
`          
          {/* Xatolik va Qo'llash tugmasi */}
          <div className="flex flex-col gap-2 pt-2 pb-1">
            {dateError && (
              <div className="text-red-400 text-[11px] font-bold bg-red-400/10 p-2 rounded-xl border border-red-500/20">
                ⚠️ {dateError}
              </div>
            )}
            <button
              type="button"
              onClick={handleApplyDate}
              className={\`w-full py-2.5 rounded-xl text-sm font-bold transition shadow-sm \${
                isDarkMode 
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                  : "bg-[#064e3b] hover:bg-[#043226] text-white"
              }\`}
            >
              Sana oralig'ini qo'llash
            </button>
          </div>`);
  fs.writeFileSync('frontend/src/components/SellersStats.jsx', lines.join('\n'));
  console.log('Button inserted exactly!');
} else {
  console.log('Could not find exact location.');
}
