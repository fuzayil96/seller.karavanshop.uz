import { formatMoney } from "../utils/formatters";

export default function OperationsHistory({
  operations,
  balanceLoading,
  isDarkMode,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3
          className={`text-xs font-bold uppercase tracking-wider ${
            isDarkMode ? "text-emerald-200/70" : "text-slate-600"
          }`}
        >
          Harakatlar tarixi ({operations?.length || 0} ta)
        </h3>
        <span
          className={`text-[11px] ${
            isDarkMode ? "text-emerald-300/50" : "text-slate-400"
          }`}
        >
          Akt sverki
        </span>
      </div>

      <div
        className={`max-h-56 overflow-y-auto rounded-xl border text-xs divide-y ${
          isDarkMode
            ? "bg-[#041f17] border-[#0e4b39] divide-[#0e4b39]/60"
            : "bg-slate-50/90 border-slate-200 divide-slate-200"
        }`}
      >
        {balanceLoading ? (
          <div className="p-6 text-center opacity-60">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent mb-2"></div>
            <div>Harakatlar tarixi yuklanmoqda...</div>
          </div>
        ) : operations?.length > 0 ? (
          operations.map((op) => (
            <div
              key={op.id}
              className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                isDarkMode ? "hover:bg-[#072f23]/60" : "hover:bg-white"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div
                  className={`font-semibold truncate ${
                    isDarkMode ? "text-slate-200" : "text-slate-900"
                  }`}
                >
                  {op.documentType}{" "}
                  <span className="opacity-75">({op.documentCode})</span>
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    isDarkMode ? "text-emerald-300/60" : "text-slate-500"
                  }`}
                >
                  {op.date}
                </div>
              </div>

              <div className="text-right shrink-0">
                {op.debit > 0 && (
                  <span
                    className={`font-semibold block ${
                      isDarkMode ? "text-emerald-400" : "text-emerald-700"
                    }`}
                  >
                    +{formatMoney(op.debit, op.currencyName)}
                  </span>
                )}
                {op.credit > 0 && (
                  <span
                    className={`font-semibold block ${
                      isDarkMode ? "text-rose-400" : "text-rose-600"
                    }`}
                  >
                    -{formatMoney(op.credit, op.currencyName)}
                  </span>
                )}
                <span
                  className={`text-[10px] block mt-0.5 ${
                    isDarkMode ? "text-emerald-200/50" : "text-slate-400"
                  }`}
                >
                  Qoldiq: {formatMoney(op.endAmount, op.currencyName)}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div
            className={`p-6 text-center ${
              isDarkMode ? "text-emerald-200/50" : "text-slate-400"
            }`}
          >
            Tanlangan davrda operatsiyalar mavjud emas
          </div>
        )}
      </div>
    </div>
  );
}
