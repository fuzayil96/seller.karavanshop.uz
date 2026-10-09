import { useEffect } from "react";
import { formatMoney } from "../../utils/formatters";

export default function ChequeModal({ cheque, onClose, isDarkMode }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!cheque) return null;

  const total = Number(cheque.total_amount || cheque.sum || 0);
  const paymentType = cheque.payment_type?.name || cheque.pay_type || "Naqd pul";
  const cashier = cheque.cashier?.name || cheque.user?.name || "Kassir";
  const dateStr = cheque.date
    ? new Date(cheque.date * 1000).toLocaleString("ru-RU")
    : cheque.created_at || "—";
  const items = cheque.items || cheque.cheque_items || [];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 transition-all"
      style={{
        backgroundColor: isDarkMode
          ? "rgba(4, 31, 23, 0.45)"
          : "rgba(6, 78, 59, 0.15)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "88vh" }}
        className={`w-full max-w-lg max-h-[88vh] flex flex-col rounded-2xl shadow-2xl relative border transition-colors overflow-hidden ${
          isDarkMode
            ? "bg-[#072f23] border-[#0e4b39] text-white"
            : "bg-white border-emerald-100 text-slate-800"
        }`}
      >
        <div className="overflow-y-auto flex-1 min-h-0 p-5 sm:p-6 space-y-4">
          {/* Sarlavha va ✕ */}
          <div className="relative pr-8">
            <button
              type="button"
              onClick={onClose}
              className={`absolute top-0 right-0 w-8 h-8 rounded-lg flex items-center justify-center transition ${
                isDarkMode
                  ? "text-emerald-200/70 hover:text-white hover:bg-[#0c3d2e]"
                  : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              ✕
            </button>
            <span
              className={`text-[11px] uppercase tracking-wider font-semibold ${
                isDarkMode ? "text-emerald-300/70" : "text-[#065f46]"
              }`}
            >
              Savdo Cheki Tafsiloti
            </span>
            <h2 className="text-xl font-bold mt-0.5">
              Chek №{cheque.code || cheque.id}
            </h2>
          </div>

          {/* Chek ma'lumotlari kartochkasi */}
          <div
            className={`p-4 rounded-xl border text-xs space-y-2 ${
              isDarkMode
                ? "bg-[#041f17] border-[#0e4b39]"
                : "bg-emerald-50/60 border-emerald-100"
            }`}
          >
            <div className="flex justify-between">
              <span className="opacity-60">Sana va vaqt:</span>
              <span className="font-semibold">{dateStr}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">To'lov usuli:</span>
              <span className="font-semibold text-emerald-400">{paymentType}</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-60">Mas'ul xodim:</span>
              <span className="font-semibold">{cashier}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-inherit text-sm font-bold">
              <span>Jami summa:</span>
              <span className="text-emerald-400">{formatMoney(total, "UZS")}</span>
            </div>
          </div>

          {/* Sotilgan tovarlar ro'yxati */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2 opacity-75">
              Chekdagi tovarlar ({items.length} ta)
            </h3>

            {items.length > 0 ? (
              <div
                className={`rounded-xl border overflow-hidden text-xs divide-y ${
                  isDarkMode
                    ? "bg-[#041f17] border-[#0e4b39] divide-[#0e4b39]/60"
                    : "bg-slate-50 border-slate-200 divide-slate-200"
                }`}
              >
                {items.map((it, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{it.item?.name || it.name || "Mahsulot"}</p>
                      <p className="text-[11px] opacity-60">
                        {it.quantity} x {formatMoney(it.price, "UZS")}
                      </p>
                    </div>
                    <span className="font-bold">
                      {formatMoney(it.total || it.quantity * it.price, "UZS")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed text-center text-xs opacity-60">
                Chekdagi tovarlar bo'yicha batafsil ma'lumot chekda jamlangan
              </div>
            )}
          </div>
        </div>

        {/* Modal pastida qadalib turuvchi Yopish tugmasi */}
        <div
          className={`p-3.5 sm:p-4 border-t shrink-0 sticky bottom-0 z-20 ${
            isDarkMode
              ? "bg-[#041f17] border-[#0e4b39]"
              : "bg-slate-50 border-emerald-100 shadow-md"
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 border shadow-xs ${
              isDarkMode
                ? "bg-[#072f23] hover:bg-[#0c3d2e] border-[#0e4b39] text-white"
                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-800"
            }`}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Yopish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
