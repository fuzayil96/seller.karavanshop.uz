import { getCleanPhone } from "../utils/formatters";
import { handlePrintPdf } from "../utils/printPdf";

export default function ModalActions({
  partner,
  balanceData,
  balanceLoading,
  periodDays,
  onCopyInfo,
  copied,
  isDarkMode,
}) {
  const hasPhone = partner && !!getCleanPhone(partner.phones);

  return (
    <div className="space-y-2 pt-1">
      {/* 1-qator: Nom/Balans nusxalash va PDF / Chop etish */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Hamkor nomi va balansidan nusxa olish */}
        <button
          type="button"
          onClick={onCopyInfo}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 border ${
            copied
              ? isDarkMode
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300"
                : "bg-emerald-100 border-emerald-300 text-emerald-800"
              : isDarkMode
              ? "bg-[#0c3d2e] hover:bg-[#104e3b] border-[#166049] text-white"
              : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-[#064e3b]"
          }`}
        >
          {copied ? (
            <>
              <span>✓</span>
              <span>Nomi va balansi nusxalandi!</span>
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              <span>Nom va balans</span>
            </>
          )}
        </button>

        {/* PDF sifatida yuklash / Chop etish */}
        <button
          type="button"
          onClick={() => handlePrintPdf(partner, balanceData, periodDays)}
          disabled={balanceLoading}
          className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-2 border ${
            balanceLoading ? "opacity-50 cursor-not-allowed" : ""
          } ${
            isDarkMode
              ? "bg-[#064e3b]/90 hover:bg-[#065f46] border-emerald-500/40 text-emerald-100"
              : "bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-xs"
          }`}
          title="Akt Sverki hisobotini PDF sifatida saqlash yoki chop etish"
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
              strokeWidth="2"
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>PDF / Chop etish</span>
        </button>
      </div>

      {/* 2-qator: Telegramda yozish va Ulashish (Faqat nom va balans bilan) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {/* Telefon bo'lsa - Telegramda yozish (Telegram ikonkasi bilan) */}
        {hasPhone && (
          <a
            href={`https://t.me/${getCleanPhone(partner.phones)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 px-4 bg-[#229ED9] hover:bg-[#1ea1dd] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-xs"
          >
            <svg
              className="w-4 h-4 fill-current shrink-0"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            <span>Telegramda yozish</span>
          </a>
        )}

        {/* Ulashish: Avvalgiday faqat hamkor nomi va balansi, Ulashish ikonkasi bilan */}
        <a
          href={`https://t.me/share/url?url=${encodeURIComponent(
            " "
          )}&text=${encodeURIComponent(
            `Hamkor: ${partner.name}\nBalans: ${
              balanceData?.mainBalanceText ||
              (balanceLoading ? "Yuklanmoqda..." : "0 so'm")
            }`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`py-2.5 px-4 bg-[#065f46] hover:bg-[#044c38] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-xs ${
            !hasPhone ? "w-full sm:col-span-2" : ""
          }`}
          title="Telegram orqali nom va balansni ulashish"
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
              strokeWidth="2"
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          <span>Ulashish</span>
        </a>
      </div>
    </div>
  );
}
