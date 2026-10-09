import { useEffect, useState, useMemo } from "react";
import getData from "../../utils/getData";
import { formatMoney } from "../../utils/formatters";

export default function Finance({ isDarkMode }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("accounts"); // "accounts" | "cashboxes" | "payments" | "overview"
  const [searchTerm, setSearchTerm] = useState("");

  // Data states
  const [accounts, setAccounts] = useState([]);
  const [operatingCashboxes, setOperatingCashboxes] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [partners, setPartners] = useState([]);
  const [todayCheques, setTodayCheques] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  async function loadFinanceData(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(true);

      const now = new Date();
      const startOfDay = Math.floor(
        new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() / 1000
      );
      const nowSec = Math.floor(now.getTime() / 1000);

      // Parallel so'rovlar REGOS API orqali
      const [accRes, cashRes, payRes, partRes, chequesRes] = await Promise.all([
        // 1. Bank hisoblari va qoldiqlari
        getData({
          url: "/accountbalance/get",
          reqData: {},
        }).catch(() => null),

        // 2. Kassa apparatlari (Operating cash registers)
        getData({
          url: "/operatingcash/get",
          reqData: {},
        }).catch(() => null),

        // 3. To'lov turlari
        getData({
          url: "/paymenttype/get",
          reqData: {},
        }).catch(() => null),

        // 4. Hamkorlar
        getData({
          url: "/partner/get",
          reqData: { end_date: nowSec, deleted_mark: false },
        }).catch(() => null),

        // 5. Bugungi savdo cheklari (kassa tushumi uchun)
        getData({
          url: "/doccheque/get",
          reqData: { start_date: startOfDay, end_date: nowSec },
        }).catch(() => null),
      ]);

      // Xavfsiz tekshiruv: REGOS xato qaytarsa ham massiv bo'lishini kafolatlaymiz
      setAccounts(Array.isArray(accRes?.result) ? accRes.result : []);
      setOperatingCashboxes(Array.isArray(cashRes?.result) ? cashRes.result : []);
      setPaymentTypes(Array.isArray(payRes?.result) ? payRes.result : []);
      setPartners(Array.isArray(partRes?.result) ? partRes.result : []);
      setTodayCheques(Array.isArray(chequesRes?.result) ? chequesRes.result : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Moliya ma'lumotlarini yuklashda xatolik:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadFinanceData(true);
  }, []);

  // Moliyaviy hisob-kitoblar (UZS va USD hisoblari)
  const uzsTotal = useMemo(() => {
    if (!Array.isArray(accounts)) return 0;
    return accounts
      .filter((a) => (a?.currency?.code_chr || "").toUpperCase() === "UZS" || !a?.currency)
      .reduce((sum, a) => sum + Number(a?.balance || 0), 0);
  }, [accounts]);

  const usdTotal = useMemo(() => {
    if (!Array.isArray(accounts)) return 0;
    return accounts
      .filter((a) => (a?.currency?.code_chr || "").toUpperCase() === "USD")
      .reduce((sum, a) => sum + Number(a?.balance || 0), 0);
  }, [accounts]);

  // Bugungi savdo tushumlari
  const todaySalesTotal = useMemo(() => {
    if (!Array.isArray(todayCheques)) return 0;
    return todayCheques.reduce((sum, ch) => {
      return sum + Number(ch?.amount || ch?.total_amount || ch?.sum || 0);
    }, 0);
  }, [todayCheques]);

  // Qidiruv bo'yicha filtrlash
  const filteredAccounts = useMemo(() => {
    if (!Array.isArray(accounts)) return [];
    if (!searchTerm.trim()) return accounts;
    const term = searchTerm.toLowerCase();
    return accounts.filter(
      (a) =>
        (a?.name || "").toLowerCase().includes(term) ||
        (a?.code || "").toLowerCase().includes(term)
    );
  }, [accounts, searchTerm]);

  const filteredCashboxes = useMemo(() => {
    if (!Array.isArray(operatingCashboxes)) return [];
    if (!searchTerm.trim()) return operatingCashboxes;
    const term = searchTerm.toLowerCase();
    return operatingCashboxes.filter(
      (box) =>
        (box?.stock?.name || "").toLowerCase().includes(term) ||
        (box?.description || "").toLowerCase().includes(term) ||
        String(box?.id || "").includes(term)
    );
  }, [operatingCashboxes, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Sarlavha paneli */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isDarkMode
            ? "bg-[#072f23] border-[#0e4b39] text-white"
            : "bg-white border-emerald-100 text-slate-800 shadow-sm"
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs uppercase font-bold tracking-wider ${
                isDarkMode ? "text-emerald-300/70" : "text-[#065f46]"
              }`}
            >
              Kassa va Moliya
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs text-emerald-400 font-semibold">REGOS Boshqaruvi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            Moliya va Kassalar Markazi
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? "text-emerald-200/70" : "text-slate-500"}`}>
            Barcha bank hisoblari, filial kassa apparatlari, to'lov turlari va savdo tushumlari monitoringi.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          {lastUpdated && (
            <span className="text-[11px] opacity-60 hidden sm:inline">
              Yangilandi: {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => loadFinanceData(false)}
            disabled={refreshing}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              refreshing ? "opacity-60 cursor-not-allowed" : "hover:scale-[1.02] active:scale-95"
            } ${
              isDarkMode
                ? "bg-[#064e3b] border-[#0e4b39] text-emerald-200 hover:bg-[#075e47]"
                : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <span className={refreshing ? "animate-spin" : ""}>🔄</span>
            {refreshing ? "Yangilanmoqda..." : "Yangilash"}
          </button>
        </div>
      </div>

      {/* 4 Asosiy KPI Kartochkalari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Asosiy Hisoblar qoldig'i (UZS) */}
        <div
          className={`p-5 rounded-2xl border transition-all relative overflow-hidden ${
            isDarkMode
              ? "bg-gradient-to-br from-[#064e3b] to-[#04281e] border-[#0e4b39] text-white"
              : "bg-gradient-to-br from-[#065f46] to-[#047857] border-emerald-200 text-white shadow-md"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase font-bold tracking-wider opacity-85">
              Jami Hisoblar (UZS)
            </span>
            <span className="text-xl">💰</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            {loading ? "..." : formatMoney(uzsTotal, "UZS")}
          </div>
          <div className="text-[11px] mt-2 opacity-85 flex items-center justify-between">
            <span>Asosiy va naqd kassa</span>
            <span className="font-semibold">{accounts.length} ta hisob</span>
          </div>
        </div>

        {/* 2. Valyuta Hisobi (USD) */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase font-bold tracking-wider opacity-70">
              Valyuta Qoldig'i (USD)
            </span>
            <span className="text-xl">💵</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-emerald-400">
            {loading ? "..." : `$${formatMoney(usdTotal, "").trim()}`}
          </div>
          <div className="text-[11px] mt-2 opacity-70 flex items-center justify-between">
            <span>Valyutadagi mablag'</span>
            <span className="font-semibold">USD hisobi</span>
          </div>
        </div>

        {/* 3. Bugungi Savdo Tushumi */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase font-bold tracking-wider opacity-70">
              Bugungi Tushum
            </span>
            <span className="text-xl">🧾</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-sky-400">
            {loading ? "..." : formatMoney(todaySalesTotal, "UZS")}
          </div>
          <div className="text-[11px] mt-2 opacity-70 flex items-center justify-between">
            <span>Bugun urilgan cheklar</span>
            <span className="font-semibold text-sky-400">{todayCheques.length} ta chek</span>
          </div>
        </div>

        {/* 4. Faol Kassa Apparatlari */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-[11px] uppercase font-bold tracking-wider opacity-70">
              Kassa Apparatlari
            </span>
            <span className="text-xl">🏢</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-amber-400">
            {loading ? "..." : `${operatingCashboxes.length} ta`}
          </div>
          <div className="text-[11px] mt-2 opacity-70 flex items-center justify-between">
            <span>Filial va Web kassalar</span>
            <span className="font-semibold text-emerald-400">Ulangan</span>
          </div>
        </div>
      </div>

      {/* Bo'limlarni almashtirish tablari va qidiruv */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div
          className={`p-1 rounded-2xl border flex flex-wrap gap-1 ${
            isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-100 border-slate-200"
          }`}
        >
          <button
            onClick={() => {
              setActiveSubTab("accounts");
              setSearchTerm("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "accounts"
                ? isDarkMode
                  ? "bg-[#065f46] text-white shadow-sm"
                  : "bg-white text-emerald-800 shadow-sm"
                : isDarkMode
                ? "text-emerald-200/70 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>💳</span>
            <span>Hisoblar & Balanslar ({accounts.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab("cashboxes");
              setSearchTerm("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "cashboxes"
                ? isDarkMode
                  ? "bg-[#065f46] text-white shadow-sm"
                  : "bg-white text-emerald-800 shadow-sm"
                : isDarkMode
                ? "text-emerald-200/70 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🏦</span>
            <span>Kassa Apparatlari ({operatingCashboxes.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab("payments");
              setSearchTerm("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "payments"
                ? isDarkMode
                  ? "bg-[#065f46] text-white shadow-sm"
                  : "bg-white text-emerald-800 shadow-sm"
                : isDarkMode
                ? "text-emerald-200/70 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>⚡</span>
            <span>To'lov Turlari ({paymentTypes.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab("overview");
              setSearchTerm("");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === "overview"
                ? isDarkMode
                  ? "bg-[#065f46] text-white shadow-sm"
                  : "bg-white text-emerald-800 shadow-sm"
                : isDarkMode
                ? "text-emerald-200/70 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📊</span>
            <span>O'zaro Hisob-kitoblar</span>
          </button>
        </div>

        {/* Qidiruv kiritish */}
        {(activeSubTab === "accounts" || activeSubTab === "cashboxes") && (
          <div className="relative min-w-[220px]">
            <input
              type="text"
              placeholder={
                activeSubTab === "accounts"
                  ? "Hisob nomi yoki kodi..."
                  : "Filial yoki kassa nomi..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isDarkMode
                  ? "bg-[#072f23] border-[#0e4b39] text-white placeholder-emerald-300/40"
                  : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
              }`}
            />
            <span className="absolute left-3 top-2.5 text-xs opacity-50">🔍</span>
          </div>
        )}
      </div>

      {/* TAB 1: HISOBLAR VA BALANSLAR */}
      {activeSubTab === "accounts" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAccounts.length > 0 ? (
              filteredAccounts.map((acc) => {
                const currencyCode = acc?.currency?.code_chr || "UZS";
                const isUSD = currencyCode.toUpperCase() === "USD";
                return (
                  <div
                    key={acc.id || acc.code}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between hover:border-emerald-500/50 ${
                      isDarkMode
                        ? "bg-[#072f23] border-[#0e4b39] text-white"
                        : "bg-white border-emerald-100 text-slate-800 shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                          KOD: {acc.code || acc.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isUSD
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {currencyCode}
                        </span>
                      </div>
                      <h3 className="text-base font-bold mt-2.5 tracking-tight">
                        {acc.name || "Nomsiz hisob"}
                      </h3>
                      {acc.currency?.exchange_rate && acc.currency.exchange_rate > 1 && (
                        <p className="text-[11px] opacity-60 mt-0.5">
                          Valyuta kursi: 1 {currencyCode} = {formatMoney(acc.currency.exchange_rate, "UZS")}
                        </p>
                      )}
                    </div>

                    <div className="mt-5 pt-3 border-t border-inherit flex items-end justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-semibold opacity-60 block">
                          Joriy Balans
                        </span>
                        <span
                          className={`text-xl font-black ${
                            isUSD ? "text-amber-400" : "text-emerald-400"
                          }`}
                        >
                          {formatMoney(acc.balance || 0, currencyCode)}
                        </span>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 font-semibold">
                        Faol
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className={`col-span-full p-8 text-center rounded-2xl border ${
                  isDarkMode
                    ? "bg-[#072f23] border-[#0e4b39] text-emerald-200/50"
                    : "bg-white border-emerald-100 text-slate-400"
                }`}
              >
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-xs font-semibold">Mos hisob-raqam topilmadi</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KASSA APPARATLARI */}
      {activeSubTab === "cashboxes" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCashboxes.length > 0 ? (
              filteredCashboxes.map((box, idx) => {
                const stockName = box?.stock?.name || "Asosiy do'kon";
                const firmName = box?.stock?.firm?.name || "KARAVAN";
                const isVirtual = Boolean(box?.virtual);
                const currencyCode = box?.price_type?.currency?.code_chr || "UZS";

                return (
                  <div
                    key={box.id || idx}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between hover:border-emerald-500/50 ${
                      isDarkMode
                        ? "bg-[#072f23] border-[#0e4b39] text-white"
                        : "bg-white border-emerald-100 text-slate-800 shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                          KASSA ID: #{box.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isVirtual
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-emerald-500/20 text-emerald-400"
                          }`}
                        >
                          {isVirtual ? "Web Kassa" : "Stasionar"}
                        </span>
                      </div>

                      <h3 className="text-base font-bold mt-2.5 tracking-tight flex items-center gap-1.5">
                        <span>🏪</span>
                        <span>{stockName}</span>
                      </h3>

                      <div className="space-y-1 mt-2 text-xs">
                        <p className="opacity-70 flex justify-between">
                          <span>Kompaniya:</span>
                          <span className="font-semibold">{firmName}</span>
                        </p>
                        <p className="opacity-70 flex justify-between">
                          <span>Narx turi:</span>
                          <span className="font-semibold">{box?.price_type?.name || "Chakana narx"}</span>
                        </p>
                        {box?.description && (
                          <p className="opacity-70 flex justify-between">
                            <span>Tavsif:</span>
                            <span className="font-semibold">{box.description}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between">
                      <span className="text-[11px] opacity-60">Valyuta: {currencyCode}</span>
                      <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold">
                        ● Faol
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className={`col-span-full p-8 text-center rounded-2xl border ${
                  isDarkMode
                    ? "bg-[#072f23] border-[#0e4b39] text-emerald-200/50"
                    : "bg-white border-emerald-100 text-slate-400"
                }`}
              >
                <span className="text-3xl block mb-2">🔍</span>
                <p className="text-xs font-semibold">Qidiruv bo'yicha kassa topilmadi</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TO'LOV TURLARI */}
      {activeSubTab === "payments" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paymentTypes.length > 0 ? (
              paymentTypes.map((pay) => {
                const isCash = Boolean(pay?.is_cash);
                const accName = pay?.account?.name || "Asosiy hisob";
                const currency = pay?.account?.currency?.code_chr || "UZS";

                return (
                  <div
                    key={pay.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isDarkMode
                        ? "bg-[#072f23] border-[#0e4b39] text-white"
                        : "bg-white border-emerald-100 text-slate-800 shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                          KKM KOD: {pay.kkm_code ?? "—"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isCash
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-sky-500/20 text-sky-400"
                          }`}
                        >
                          {isCash ? "Naqd to'lov" : "Naqdsiz / Elektron"}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold mt-2.5 tracking-tight flex items-center gap-2">
                        <span>{isCash ? "💵" : "💳"}</span>
                        <span>{pay.name}</span>
                      </h3>

                      <div className="space-y-1.5 mt-3 text-xs">
                        <p className="opacity-70 flex justify-between">
                          <span>Biriktirilgan hisob:</span>
                          <span className="font-semibold text-emerald-400">{accName}</span>
                        </p>
                        <p className="opacity-70 flex justify-between">
                          <span>Valyuta:</span>
                          <span className="font-semibold">{currency}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-inherit flex items-center justify-between">
                      <span className="text-[11px] opacity-60">REGOS Integratsiyasi</span>
                      <span className="text-xs px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-bold">
                        Yoqilgan
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className={`col-span-full p-8 text-center rounded-2xl border ${
                  isDarkMode
                    ? "bg-[#072f23] border-[#0e4b39] text-emerald-200/50"
                    : "bg-white border-emerald-100 text-slate-400"
                }`}
              >
                <p className="text-xs font-semibold">To'lov turlari yuklanmoqda...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: O'ZARO HISOB-KITOBLAR VA HAMKORLAR */}
      {activeSubTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div
            className={`p-6 rounded-2xl border transition-colors ${
              isDarkMode
                ? "bg-[#072f23] border-[#0e4b39] text-white"
                : "bg-white border-emerald-100 text-slate-800 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">🤝</span>
              <h2 className="text-base font-bold tracking-tight">
                Kontragentlar va O'zaro Hisob-kitoblar
              </h2>
            </div>
            <p className={`text-xs mb-4 ${isDarkMode ? "text-emerald-200/60" : "text-slate-500"}`}>
              REGOS API orqali ro'yxatdan o'tgan jami {partners.length} ta hamkor bo'yicha to'liq hisob-kitoblar, akt sverka va nasiya qarzdorliklar monitoringi.
            </p>

            <div className="space-y-3 text-xs">
              <div
                className={`p-3.5 rounded-xl flex justify-between items-center ${
                  isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                }`}
              >
                <span className="font-medium">Jami ro'yxatdagi hamkorlar:</span>
                <span className="font-bold text-sm text-emerald-400">{partners.length} ta</span>
              </div>
              <div
                className={`p-3.5 rounded-xl flex justify-between items-center ${
                  isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                }`}
              >
                <span className="font-medium">Solishtiruv dalolatnomasi (Akt sverki):</span>
                <span className="font-bold text-emerald-400">A4 PDF & Chop etish</span>
              </div>
              <div
                className={`p-3.5 rounded-xl flex justify-between items-center ${
                  isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                }`}
              >
                <span className="font-medium">Telegram bot orqali xabarnoma:</span>
                <span className="font-bold text-sky-400">Faol</span>
              </div>
              <div
                className={`p-3.5 rounded-xl flex justify-between items-center ${
                  isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                }`}
              >
                <span className="font-medium">Xaridorlar qarzlari (01001 hisob):</span>
                <span className="font-bold text-amber-400">
                  {formatMoney(
                    accounts.find((a) => a.code === "01001")?.balance || 0,
                    "UZS"
                  )}
                </span>
              </div>
            </div>
          </div>

          <div
            className={`p-6 rounded-2xl border transition-colors ${
              isDarkMode
                ? "bg-[#072f23] border-[#0e4b39] text-white"
                : "bg-white border-emerald-100 text-slate-800 shadow-sm"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">📊</span>
              <h2 className="text-base font-bold tracking-tight">
                Bugungi Kassa Aylanmasi
              </h2>
            </div>
            <p className={`text-xs mb-4 ${isDarkMode ? "text-emerald-200/60" : "text-slate-500"}`}>
              Bugun barcha kassalardan o'tgan savdo cheklari va o'rtacha chek qiymati.
            </p>

            <div className="space-y-3 text-xs">
              <div
                className={`p-3.5 rounded-xl flex justify-between items-center ${
                  isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                }`}
              >
                <span className="font-medium">Bugungi jami savdo:</span>
                <span className="font-bold text-sm text-sky-400">
                  {formatMoney(todaySalesTotal, "UZS")}
                </span>
              </div>
              <div
                className={`p-3.5 rounded-xl flex justify-between items-center ${
                  isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                }`}
              >
                <span className="font-medium">Bugun urilgan cheklar soni:</span>
                <span className="font-bold text-sm text-emerald-400">
                  {todayCheques.length} ta chek
                </span>
              </div>
              <div
                className={`p-3.5 rounded-xl flex justify-between items-center ${
                  isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                }`}
              >
                <span className="font-medium">O'rtacha chek qiymati:</span>
                <span className="font-bold text-sm text-amber-400">
                  {todayCheques.length > 0
                    ? formatMoney(Math.round(todaySalesTotal / todayCheques.length), "UZS")
                    : "0 UZS"}
                </span>
              </div>
              <div
                className={`p-3.5 rounded-xl flex justify-between items-center ${
                  isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                }`}
              >
                <span className="font-medium">Faol kassa apparatlari:</span>
                <span className="font-bold text-sm text-emerald-400">
                  {operatingCashboxes.length} ta
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
