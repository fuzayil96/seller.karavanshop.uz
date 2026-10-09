import { useEffect, useState, useMemo } from "react";
import getData from "../../utils/getData";
import { formatMoney } from "../../utils/formatters";
import ChequeModal from "./ChequeModal";

export default function Sales({ isDarkMode }) {
  const [loading, setLoading] = useState(true);
  const [cheques, setCheques] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCheque, setSelectedCheque] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchSales() {
      try {
        setLoading(true);
        const unixSeconds = Math.floor(Date.now() / 1000);
        // Oxirgi 30 kunlik cheklar (REGOS cheklovi: ko'pi bilan 1 oy)
        let response = await getData({
          url: "/doccheque/get",
          reqData: {
            start_date: unixSeconds - 86400 * 30,
            end_date: unixSeconds,
            filters: [
              { Field: "status", Operator: "Equal", Value: "Closed" }
            ]
          },
        }).catch(() => null);

        if (!response?.ok) {
          response = await getData({
            url: "/cheque/get",
            reqData: {
              start_date: unixSeconds - 86400 * 30,
              end_date: unixSeconds,
            },
          }).catch(() => null);
        }

        if (isMounted) {
          setCheques(response?.result || []);
        }
      } catch (err) {
        console.error("Savdo cheklarini yuklashda xatolik:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchSales();
    return () => {
      isMounted = false;
    };
  }, []);

  // Jami hisob-kitoblar
  const totalSum = useMemo(() => {
    return cheques.reduce((acc, c) => acc + Number(c.amount || c.total_amount || c.sum || 0), 0);
  }, [cheques]);

  const filteredCheques = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return cheques;

    return cheques.filter((c) => {
      const code = String(c.code || c.id || "").toLowerCase();
      const cashier = (c.cashier?.full_name || c.cashier?.name || c.user?.name || "").toLowerCase();
      const seller = (c.seller?.full_name || c.seller?.name || "").toLowerCase();
      const payType = (c.payment_type?.name || "").toLowerCase();
      return (
        code.includes(q) ||
        cashier.includes(q) ||
        seller.includes(q) ||
        payType.includes(q)
      );
    });
  }, [cheques, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Qadalib turuvchi Qidiruv va Sarlavha */}
      <div
        style={{ position: "sticky", top: 0, zIndex: 20 }}
        className={`sticky top-0 z-20 pt-1 pb-2.5 -mt-1 transition-colors backdrop-blur-md ${
          isDarkMode ? "bg-[#02130e]/95" : "bg-[#f4f9f6]/95"
        }`}
      >
        <div
          className={`p-3.5 sm:p-5 rounded-2xl border transition-colors shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39]"
              : "bg-white border-emerald-100"
          }`}
        >
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              Savdo va Kassa Cheklari
            </h1>
            <p className={`text-xs mt-0.5 ${isDarkMode ? "text-emerald-200/70" : "text-slate-500"}`}>
              Jami savdo: {formatMoney(totalSum, "UZS")} • {cheques.length} ta chek
            </p>
          </div>

          <div className="relative flex-1 md:max-w-xs">
            <input
              type="text"
              placeholder="Chek № yoki xodim..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-sm transition focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDarkMode
                  ? "bg-[#041f17] border border-[#0e4b39] text-white placeholder-emerald-200/40"
                  : "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white"
              }`}
            />
            <svg
              className={`w-4 h-4 absolute left-3 top-2.5 pointer-events-none ${
                isDarkMode ? "text-emerald-300/50" : "text-slate-400"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cheklar jadvali */}
      {loading ? (
        <div
          className={`p-16 text-center rounded-2xl border ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-emerald-200/70"
              : "bg-white border-emerald-100 text-slate-500"
          }`}
        >
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-3"></div>
          <p className="text-sm">Cheklar tarixi yuklanmoqda...</p>
        </div>
      ) : (
        <div
          className={`rounded-2xl border overflow-hidden shadow-sm transition-colors ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39]"
              : "bg-white border-emerald-100"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className={`border-b text-xs uppercase tracking-wider font-semibold ${
                    isDarkMode
                      ? "bg-[#041f17] border-[#0e4b39] text-emerald-200/60"
                      : "bg-emerald-50/70 border-emerald-100 text-[#064e3b]"
                  }`}
                >
                  <th className="py-3.5 px-5 w-16 text-center">№</th>
                  <th className="py-3.5 px-5">Chek raqami</th>
                  <th className="py-3.5 px-5">Sana va vaqt</th>
                  <th className="py-3.5 px-5">To'lov turi</th>
                  <th className="py-3.5 px-5">Xodim</th>
                  <th className="py-3.5 px-5 text-right">Summa</th>
                  <th className="py-3.5 px-5 text-right"></th>
                </tr>
              </thead>
              <tbody
                className={`divide-y text-sm ${
                  isDarkMode ? "divide-[#0e4b39]/60" : "divide-slate-100"
                }`}
              >
                {filteredCheques.length > 0 ? (
                  filteredCheques.map((ch, idx) => {
                    const sum = Number(ch.amount || ch.total_amount || ch.sum || 0);
                    const dateStr = ch.date
                      ? new Date(ch.date * 1000).toLocaleString("ru-RU")
                      : "—";
                    const staffName =
                      ch.seller?.full_name ||
                      ch.cashier?.full_name ||
                      ch.cashier?.name ||
                      ch.user?.name ||
                      "Kassir";

                    return (
                      <tr
                        key={ch.uuid || ch.id || idx}
                        onClick={() => setSelectedCheque(ch)}
                        className={`cursor-pointer transition ${
                          isDarkMode
                            ? "hover:bg-[#0c3d2e] text-slate-200"
                            : "hover:bg-emerald-50/50 text-slate-800"
                        }`}
                      >
                        <td className="py-3.5 px-5 text-center text-xs opacity-60">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-5 font-bold font-mono text-emerald-400">
                          №{ch.code || ch.id}
                        </td>
                        <td className="py-3.5 px-5 text-xs opacity-75">
                          {dateStr}
                        </td>
                        <td className="py-3.5 px-5">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              ch.is_return
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : isDarkMode
                                ? "bg-[#041f17] text-emerald-300 border border-[#0e4b39]"
                                : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            }`}
                          >
                            {ch.is_return ? "Qaytarish" : ch.payment_type?.name || ch.pay_type || "Naqd pul"}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-xs">
                          <p className="font-semibold">{staffName}</p>
                          {ch.seller?.user_group?.name && (
                            <span className="text-[10px] opacity-60">
                              {ch.seller.user_group.name}
                            </span>
                          )}
                        </td>
                        <td className={`py-3.5 px-5 text-right font-extrabold ${
                          ch.is_return ? "text-rose-400" : ""
                        }`}>
                          {ch.is_return ? "-" : ""}{formatMoney(sum, "UZS")}
                        </td>
                        <td className="py-3.5 px-5 text-right text-xs text-emerald-400">
                          <span>→</span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-12 px-5 text-center text-sm opacity-50"
                    >
                      Cheklar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chek tafsilotlari modali */}
      {selectedCheque && (
        <ChequeModal
          cheque={selectedCheque}
          onClose={() => setSelectedCheque(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
