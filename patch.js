const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/SellersStats.jsx', 'utf-8');

code = code.replace(
  /const \{ startUnix, endUnix, dateLabel \} = useMemo\(\(\) => \{/g,
  'const pendingDateRange = useMemo(() => {'
);

code = code.replace(
  /\}, \[dateMode, selectedDate, customStartDate, customEndDate, selectedMonth\]\);/g,
  `}, [dateMode, selectedDate, customStartDate, customEndDate, selectedMonth]);

  const [activeDateRange, setActiveDateRange] = useState(() => {
    const { start, end } = dateStringToUnixRange(getTodayDateStr(), getTodayDateStr());
    return { startUnix: start, endUnix: end, dateLabel: \`Bugun (\${getTodayDateStr()})\` };
  });
  const [dateError, setDateError] = useState('');

  const handleApplyDate = () => {
    if (dateMode === 'custom') {
      const startObj = new Date(customStartDate);
      const endObj = new Date(customEndDate);
      const diffDays = (endObj - startObj) / (1000 * 3600 * 24);
      
      if (diffDays > 31) {
        setDateError('Oraliq 31 kundan oshmasligi kerak!');
        return;
      } else if (diffDays < 0) {
        setDateError("Boshlang'ich sana yakuniy sanadan katta bo'lishi mumkin emas!");
        return;
      }
    }
    setDateError('');
    setActiveDateRange(pendingDateRange);
  };`
);

code = code.replace(
  /fetchChequesInChunks\(startUnix, endUnix\)/g,
  'fetchChequesInChunks(activeDateRange.startUnix, activeDateRange.endUnix)'
);

code = code.replace(
  /\}, \[startUnix, endUnix\]\);/g,
  '}, [activeDateRange]);'
);

code = code.replace(/dateLabel,/g, 'dateLabel: activeDateRange.dateLabel,');
code = code.replace(/dateLabel=\{dateLabel\}/g, 'dateLabel={activeDateRange.dateLabel}');

code = code.replace(
  /\{dateLabel\}/g,
  '{pendingDateRange.dateLabel}'
);

code = code.replace(
  /          \}\)\}\n        <\/div>\n\n        \{\/\* FOIZ STAVKASI/g,
  `          })}
          
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

        {/* FOIZ STAVKASI`
);

fs.writeFileSync('frontend/src/components/SellersStats.jsx', code);
console.log('Modified successfully.');
