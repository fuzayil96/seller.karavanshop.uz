const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/SellersStats.jsx', 'utf-8');

const targetStr = `          )}
        </div>

        {/* FOIZ STAVKASI HISOB-KITOBI (Foydalanuvchi son yozsa foiz hisoblash) */}`;

const replacementStr = `          )}
          
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
              className={\`w-full py-2.5 rounded-xl text-xs font-bold transition shadow-sm \${
                isDarkMode 
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                  : "bg-[#064e3b] hover:bg-[#043226] text-white"
              }\`}
            >
              Sana oralig'ini qo'llash
            </button>
          </div>
        </div>

        {/* FOIZ STAVKASI HISOB-KITOBI (Foydalanuvchi son yozsa foiz hisoblash) */}`;

code = code.replace(targetStr, replacementStr);
fs.writeFileSync('frontend/src/components/SellersStats.jsx', code);
console.log('Button added successfully.');
