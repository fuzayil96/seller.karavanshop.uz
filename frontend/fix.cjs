const fs = require('fs');
let lines = fs.readFileSync('src/components/SellersStats.jsx', 'utf-8').split('\n');
let idx = lines.findIndex(l => l.includes('The above content does NOT show'));
if (idx !== -1) {
    lines = lines.slice(0, idx);
    lines.push(
        '            <span className="text-lg">🧾</span>',
        '          </div>',
        '          <p className="text-lg sm:text-xl font-extrabold mt-1">{totalChequesCount}</p>',
        '        </div>',
        '      </div>',
        '      <div className="space-y-4">',
        '        {filteredSellers.map((seller) => (',
        '          <div key={seller.id} className={`p-4 rounded-2xl border transition shadow-sm ${isDarkMode ? "bg-[#072f23] border-[#0e4b39]" : "bg-white border-emerald-100"}`}>',
        '            <div className="flex justify-between items-center mb-2">',
        '              <h3 className="font-bold text-lg">{seller.name}</h3>',
        '              <span className="text-sm opacity-70">#{seller.rank}</span>',
        '            </div>',
        '            <div className="grid grid-cols-2 gap-2 text-sm">',
        '              <div><p className="opacity-70">Sof Savdo:</p><p className="font-bold text-emerald-400">{seller.netSales?.toLocaleString()} UZS</p></div>',
        '              <div><p className="opacity-70">Cheklar:</p><p className="font-bold">{seller.chequeCount}</p></div>',
        '              <div><p className="opacity-70">Qaytarishlar:</p><p className="font-bold text-red-400">{seller.returnsSum?.toLocaleString()} UZS</p></div>',
        '              <div><p className="opacity-70">Filial:</p><p className="font-bold">{seller.branchName}</p></div>',
        '            </div>',
        '          </div>',
        '        ))}',
        '      </div>',
        '    </div>',
        '  );',
        '}',
        '',
        'export default SellersStats;'
    );
    fs.writeFileSync('src/components/SellersStats.jsx', lines.join('\n'));
}
