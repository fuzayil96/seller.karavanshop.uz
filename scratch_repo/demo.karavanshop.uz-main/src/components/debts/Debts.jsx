import { useEffect, useState, useMemo } from "react";
import getData from "../../utils/getData";
import { formatMoney } from "../../utils/formatters";

export default function Debts({ isDarkMode }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [topDebtors, setTopDebtors] = useState([]); // Widget 37
  const [debtAccount, setDebtAccount] = useState(null); // Account 01001
  const [partners, setPartners] = useState([]);

  async function loadDebtsData(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(true);

      const [widgetRes, accRes, partRes] = await Promise.all([
        // 1. Widget 37: Top 10 qarzdor kontragentlar
        getData({ url: "/widgetdata/get", reqData: { id: 37 } }).catch(() => null),
        // 2. Hisoblar balansi (01001 hisobi)
        getData({ url: "/accountbalance/get", reqData: {} }).catch(() => null),
        // 3. Hamkorlar ro'yxati
        getData({
          url: "/partner/get",
          reqData: { end_date: Math.floor(Date.now() / 1000), deleted_mark: false },
        }).catch(() => null),
      ]);

      setTopDebtors(Array.isArray(widgetRes?.result) ? widgetRes.result : []);
      if (Array.isArray(accRes?.result)) {
        const found = accRes.result.find((a) => a.code === "01001" || a.name?.includes("Долги"));
        setDebtAccount(found || null);
      }
      setPartners(Array.isArray(partRes?.result) ? partRes.result : []);
    } catch (err) {
      console.error("Qarzdorliklarni yuklashda xatolik:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDebtsData(true);
  }, []);

  // Filtrlangan qarzdorlar
  const filteredDebtors = useMemo(() => {
    if (!searchTerm.trim()) return topDebtors;
    const term = searchTerm.toLowerCase();
    return topDebtors.filter((d) => (d.name || "").toLowerCase().includes(term));
  }, [topDebtors, searchTerm]);

  // Jami Top qarzdorlik summasi
  const totalTopDebtSum = useMemo(() => {
    return topDebtors.reduce((sum, d) => sum + Number(d.debt_amount || 0), 0);
  }, [topDebtors]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Sarlavha Paneli */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDarkMode
            ? "bg-[#072f23] border-[#0e4b39] text-white"
            : "bg-white border-emerald-100 text-slate-800 shadow-sm"
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs uppercase font-extrabold tracking-wider ${
                isDarkMode ? "text-emerald-300" : "text-[#065f46]"
              }`}
            >
              Moliya & Kredit Nazorati
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            <span className="text-xs text-amber-400 font-semibold">Nasiya Tahlili</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Qarzdorliklar va Nasiya Monitoringi
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? "text-emerald-200/70" : "text-slate-500"}`}>
            Xaridorlar va kontragentlarning to'lanishi kutilayotgan qarzdorliklari va oxirgi to'lov sanalari.
          </p>
        </div>

        <button
          onClick={() => loadDebtsData(false)}
          disabled={refreshing}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all self-start md:self-auto ${
            refreshing ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"
          } ${
            isDarkMode
              ? "bg-[#064e3b] border-[#0e4b39] text-emerald-200 hover:bg-[#075e47]"
              : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
          }`}
        >
          <span className={refreshing ? "animate-spin" : ""}>🔄</span>
          <span>{refreshing ? "Yangilanmoqda..." : "Yangilash"}</span>
        </button>
      </div>

      {/* 3 Asosiy KPI Kartochkalari */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDarkMode
              ? "bg-gradient-to-br from-[#064e3b] to-[#04281e] border-[#0e4b39] text-white"
              : "bg-gradient-to-br from-[#065f46] to-[#047857] border-emerald-200 text-white shadow-md"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-extrabold tracking-wider opacity-85">
              Top 10 Nasiyalar Summasi
            </span>
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 text-amber-300">
            {loading ? "..." : formatMoney(totalTopDebtSum, "UZS")}
          </div>
          <p className="text-xs mt-2 opacity-85">
            Eng yirik 10 ta qarzdor ulushi
          </p>
        </div>

        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-extrabold tracking-wider opacity-70">
              Xaridorlar Qarzlari (01001 hisob)
            </span>
            <span className="text-2xl">🏛️</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 text-rose-400">
            {loading ? "..." : formatMoney(debtAccount?.balance || 0, "UZS")}
          </div>
          <p className="text-xs mt-2 opacity-70">
            Buxgalteriya balansi bo'yicha jami
          </p>
        </div>

        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-extrabold tracking-wider opacity-70">
              Ro'yxatdagi Hamkorlar
            </span>
            <span className="text-2xl">👥</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 text-sky-400">
            {loading ? "..." : `${partners.length} ta`}
          </div>
          <p className="text-xs mt-2 opacity-70">
            Barcha xaridor va yetkazib beruvchilar
          </p>
        </div>
      </div>

      {/* Qidiruv paneli */}
      <div className="flex justify-between items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Qarzdor kontragent nomini qidirish..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border transition ${
              isDarkMode
                ? "bg-[#072f23] border-[#0e4b39] text-white placeholder-emerald-300/40"
                : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
            }`}
          />
          <span className="absolute left-3 top-3 text-xs opacity-50">🔍</span>
        </div>
      </div>

      {/* Qarzdorlar Kartochkalari Ro'yxati */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDebtors.length > 0 ? (
          filteredDebtors.map((debtor, idx) => (
            <div
              key={debtor.id || idx}
              className={`p-5 rounded-3xl border transition-all hover:scale-[1.01] flex flex-col justify-between ${
                isDarkMode
                  ? "bg-[#072f23] border-[#0e4b39] text-white"
                  : "bg-white border-emerald-100 text-slate-800 shadow-sm"
              }`}
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center font-black text-xs">
                    #{idx + 1}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300">
                    Nasiya / Qarz
                  </span>
                </div>

                <h3 className="text-base font-bold mt-2.5 tracking-tight flex items-center gap-2">
                  <span>🏢</span>
                  <span>{debtor.name}</span>
                </h3>

                <div className="mt-3 space-y-1 text-xs opacity-75">
                  <p>
                    ID: <b>#{debtor.id}</b>
                  </p>
                  <p>
                    Oxirgi to'lov sanasi:{" "}
                    <b>
                      {debtor.last_payment
                        ? new Date(debtor.last_payment).toLocaleString("uz-UZ")
                        : "To'lov qayd etilmagan"}
                    </b>
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between">
                <div>
                  <span className="text-[10px] opacity-60 uppercase block">Qarz Miqdori</span>
                  <span className="text-lg font-black text-amber-400">
                    {formatMoney(debtor.debt_amount, "UZS")}
                  </span>
                </div>

                <a
                  href={`/partners`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    isDarkMode
                      ? "bg-[#041f17] border-[#0e4b39] text-emerald-300 hover:bg-[#064e3b]"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                  }`}
                >
                  Akt Sverka 📄
                </a>
              </div>
            </div>
          ))
        ) : (
          <div
            className={`col-span-full p-8 text-center rounded-2xl border ${
              isDarkMode
                ? "bg-[#072f23] border-[#0e4b39] text-emerald-200/50"
                : "bg-white border-emerald-100 text-slate-400"
            }`}
          >
            <span className="text-3xl block mb-2">🔍</span>
            <p className="text-xs font-semibold">Qarzdor kontragent topilmadi</p>
          </div>
        )}
      </div>
    </div>
  );
}
