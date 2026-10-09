import { useEffect } from "react";
import { getCleanPhone, getPrimaryPhone } from "../utils/formatters";
import BalanceSummary from "./BalanceSummary";
import OperationsHistory from "./OperationsHistory";
import ModalActions from "./ModalActions";

export default function PartnerModal({
  partner,
  onClose,
  balanceData,
  balanceLoading,
  periodDays,
  onChangePeriod,
  onCopyInfo,
  copied,
  onRetry,
  isDarkMode,
}) {
  // ESC tugmasi bosilganda modalni yopish
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!partner) return null;

  const hasPhone = !!getCleanPhone(partner.phones);

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
        className={`w-full max-w-xl max-h-[88vh] flex flex-col rounded-2xl shadow-2xl relative border transition-colors overflow-hidden ${
          isDarkMode
            ? "bg-[#072f23] border-[#0e4b39] text-white"
            : "bg-white border-emerald-100 text-slate-800"
        }`}
      >
        {/* Modal ichidagi aylanuvchi (scrollable) qism - min-h-0 muhim! */}
        <div className="overflow-y-auto flex-1 min-h-0 p-5 sm:p-6 space-y-4">
          {/* Hamkor sarlavhasi va ✕ yopish */}
          <div className="relative pr-8">
            <button
              type="button"
              onClick={onClose}
              className={`absolute top-0 right-0 w-8 h-8 rounded-lg flex items-center justify-center transition ${
                isDarkMode
                  ? "text-emerald-200/70 hover:text-white hover:bg-[#0c3d2e]"
                  : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              }`}
              title="Yopish (Esc)"
            >
              ✕
            </button>
            <span
              className={`text-[11px] uppercase tracking-wider font-semibold ${
                isDarkMode ? "text-emerald-300/70" : "text-[#065f46]"
              }`}
            >
              Hamkor balansi va hisoboti
            </span>
            <h2
              className={`text-xl font-bold mt-0.5 break-words ${
                isDarkMode ? "text-white" : "text-slate-900"
              }`}
            >
              {partner.name || "Noma'lum"}
            </h2>
          </div>

          {/* Telefon raqam */}
          {hasPhone && (
            <div>
              <a
                href={`tel:${getCleanPhone(partner.phones)}`}
                className={`text-sm font-semibold inline-flex items-center gap-1.5 transition ${
                  isDarkMode
                    ? "text-emerald-300 hover:text-white"
                    : "text-slate-700 hover:text-emerald-700"
                }`}
              >
                <span>📞</span>
                <span>{getPrimaryPhone(partner.phones)}</span>
              </a>
            </div>
          )}

          {/* Davrni tanlash (Period Tabs) */}
          <div className="flex items-center gap-1.5 text-xs font-semibold flex-wrap">
            <span
              className={`mr-1 ${
                isDarkMode ? "text-emerald-200/60" : "text-slate-500"
              }`}
            >
              Davr:
            </span>
            {[
              { label: "30 kun", days: 30 },
              { label: "90 kun", days: 90 },
              { label: "1 yil", days: 365 },
              // { label: "Barchasi", days: 0 },
            ].map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => onChangePeriod(p.days)}
                className={`px-3 py-1 rounded-lg border transition ${
                  periodDays === p.days
                    ? isDarkMode
                      ? "bg-[#065f46] text-white border-emerald-400"
                      : "bg-[#064e3b] text-white border-[#064e3b]"
                    : isDarkMode
                    ? "bg-[#041f17] text-emerald-200/70 border-[#0e4b39] hover:bg-[#0c3d2e]"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Xatolik holati */}
          {balanceData?.error && (
            <div className="p-3 rounded-xl text-xs bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-between">
              <span>Ma'lumotlarni yuklashda xatolik yuz berdi</span>
              {onRetry && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="underline hover:text-white font-semibold ml-2"
                >
                  Qayta urinish
                </button>
              )}
            </div>
          )}

          {/* Asosiy Joriy Balans bloki */}
          <BalanceSummary
            balanceLoading={balanceLoading}
            balanceData={balanceData}
            isDarkMode={isDarkMode}
          />

          {/* Operatsiyalar tarixi (Akt sverki) */}
          <OperationsHistory
            operations={balanceData?.operations}
            balanceLoading={balanceLoading}
            isDarkMode={isDarkMode}
          />

          {/* Tugmalar paneli (Nusxalash, PDF, Telegram, Ulashish) */}
          <ModalActions
            partner={partner}
            balanceData={balanceData}
            balanceLoading={balanceLoading}
            periodDays={periodDays}
            onCopyInfo={onCopyInfo}
            copied={copied}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Modal eng pastida qadalib turuvchi Yopish tugmasi paneli (Sticky Footer) */}
        <div
          className={`p-3.5 sm:p-4 border-t shrink-0 sticky bottom-0 z-20 transition-colors ${
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
                ? "bg-[#072f23] hover:bg-[#0c3d2e] border-[#0e4b39] text-white hover:border-emerald-500"
                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-800"
            }`}
          >
            <svg
              className="w-4 h-4 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            <span>Yopish</span>
          </button>
        </div>
      </div>
    </div>
  );
}
