import { formatMoney } from "../utils/formatters";

export default function BalanceSummary({
  balanceLoading,
  balanceData,
  isDarkMode,
}) {
  return (
    <div
      className={`p-4 rounded-xl border ${
        isDarkMode
          ? "bg-[#041f17] border-[#0e4b39]"
          : "bg-emerald-50/70 border-emerald-100"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span
          className={`text-xs uppercase tracking-wider font-semibold ${
            isDarkMode ? "text-emerald-200/70" : "text-emerald-800"
          }`}
        >
          Joriy Yakuniy Balans
        </span>
        {balanceLoading && (
          <span className="text-xs text-emerald-400 animate-pulse font-medium">
            Yuklanmoqda...
          </span>
        )}
      </div>

      <div className="text-2xl font-extrabold tracking-tight">
        {balanceLoading ? (
          <span className="text-lg font-medium opacity-60">
            Hisoblanmoqda...
          </span>
        ) : (
          <span className={isDarkMode ? "text-emerald-400" : "text-[#065f46]"}>
            {balanceData?.mainBalanceText || "0 so'm"}
          </span>
        )}
      </div>

      {/* Valyutalar bo'yicha batafsil qoldiqlar (start, debit, credit, end) */}
      {!balanceLoading && balanceData?.currencies?.length > 0 && (
        <div className="mt-3 space-y-2.5">
          {balanceData.currencies.map((curr) => (
            <div
              key={curr.id}
              className={`pt-2.5 border-t text-xs ${
                isDarkMode ? "border-emerald-900/40" : "border-emerald-200/60"
              }`}
            >
              {balanceData.currencies.length > 1 && (
                <div className="flex justify-between items-center mb-1 font-semibold text-[11px]">
                  <span
                    className={
                      isDarkMode ? "text-emerald-300" : "text-emerald-800"
                    }
                  >
                    {curr.currencyName}
                  </span>
                  <span
                    className={
                      curr.endAmount >= 0 ? "text-emerald-400" : "text-rose-400"
                    }
                  >
                    {formatMoney(curr.endAmount, curr.currencyName)}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="block opacity-60 text-[10px]">
                    Boshlang‘ich:
                  </span>
                  <span className="font-semibold">
                    {formatMoney(curr.startAmount)}
                  </span>
                </div>
                <div>
                  <span
                    className={`block font-medium text-[10px] ${
                      isDarkMode ? "text-emerald-400" : "text-emerald-700"
                    }`}
                  >
                    Kirim (+):
                  </span>
                  <span
                    className={`font-semibold ${
                      isDarkMode ? "text-emerald-400" : "text-emerald-700"
                    }`}
                  >
                    +{formatMoney(curr.debit)}
                  </span>
                </div>
                <div>
                  <span
                    className={`block font-medium text-[10px] ${
                      isDarkMode ? "text-rose-400" : "text-rose-600"
                    }`}
                  >
                    Chiqim (-):
                  </span>
                  <span
                    className={`font-semibold ${
                      isDarkMode ? "text-rose-400" : "text-rose-600"
                    }`}
                  >
                    -{formatMoney(curr.credit)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
