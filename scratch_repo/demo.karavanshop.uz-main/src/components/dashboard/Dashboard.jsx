import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import getData from "../../utils/getData";
import { formatMoney, getCleanPhone } from "../../utils/formatters";

// Period parametrlari
const PERIODS = [
  { id: "Today", label: "Bugun", emoji: "☀️" },
  { id: "Yesterday", label: "Kecha", emoji: "🌙" },
  { id: "Week", label: "7 kun", emoji: "📅" },
  { id: "Month", label: "Shu oy", emoji: "🗓️" },
];

export default function Dashboard({ isDarkMode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("Today");
  const [selectedStockId, setSelectedStockId] = useState(0);
  const [stocks, setStocks] = useState([]);
  const [activeSubView, setActiveSubView] = useState("sales"); // "sales" | "top_products" | "inventory" | "debts" | "activity"
  const [lastUpdated, setLastUpdated] = useState(null);

  // Widget ma'lumotlari holatlari
  const [salesStats, setSalesStats] = useState(null); // Widget 30
  const [paymentsData, setPaymentsData] = useState([]); // Widget 31
  const [salesDynamics, setSalesDynamics] = useState([]); // Widget 32
  const [topByQuantity, setTopByQuantity] = useState([]); // Widget 33
  const [topByAmount, setTopByAmount] = useState([]); // Widget 34
  const [inventoryValuation, setInventoryValuation] = useState(null); // Widget 39
  const [accountsData, setAccountsData] = useState([]); // Widget 27
  const [debtorsData, setDebtorsData] = useState([]); // Widget 37
  const [salesActivity, setSalesActivity] = useState([]); // Widget 44
  const [birthdaysData, setBirthdaysData] = useState([]); // Widget 35
  const [demographicsAge, setDemographicsAge] = useState([]); // Widget 38
  const [demographicsSex, setDemographicsSex] = useState([]); // Widget 41
  const [tariffData, setTariffData] = useState(null); // Widget 42

  // 1. Filiallarni (stock) yuklash (faqat 1 marta)
  useEffect(() => {
    async function loadStocks() {
      try {
        const res = await getData({ url: "/stock/get", reqData: {} });
        if (Array.isArray(res?.result)) {
          const validStocks = res.result.filter(
            (s) => s?.name && s.name !== "---" && !s.deleted_mark
          );
          setStocks(validStocks);
        }
      } catch (err) {
        console.error("Filiallarni yuklashda xatolik:", err);
      }
    }
    loadStocks();
  }, []);

  // 2. REGOS Dashboard & Widgets ma'lumotlarini yuklash
  const loadDashboardData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setRefreshing(true);

        // A) REGOS Dashboard 1 filtrlarni yangilash
        await getData({
          url: "/dashboard/setfilters",
          reqData: {
            id: 1,
            period: selectedPeriod,
            stock_id: Number(selectedStockId) || 0,
            firm_id: 0,
          },
        }).catch((err) => console.warn("Dashboard setfilters ogohlantirish:", err));

        // B) Barcha kerakli 12 ta widget ma'lumotlarini parallel ravishda olish
        const widgetRequests = [
          // [0] Widget 30: Savdo statistikasi
          getData({ url: "/widgetdata/get", reqData: { id: 30 } }).catch(() => null),
          // [1] Widget 31: To'lovlar statistikasi
          getData({ url: "/widgetdata/get", reqData: { id: 31 } }).catch(() => null),
          // [2] Widget 32: Savdo dinamikasi
          getData({ url: "/widgetdata/get", reqData: { id: 32 } }).catch(() => null),
          // [3] Widget 33: Top 10 tovarlar (miqdor bo'yicha)
          getData({ url: "/widgetdata/get", reqData: { id: 33 } }).catch(() => null),
          // [4] Widget 34: Top 10 tovarlar (summa bo'yicha)
          getData({ url: "/widgetdata/get", reqData: { id: 34 } }).catch(() => null),
          // [5] Widget 39: Ombor qoldiqlari qiymati (zapas baholash)
          getData({ url: "/widgetdata/get", reqData: { id: 39 } }).catch(() => null),
          // [6] Widget 27: Moliya hisoblari va kassa qoldiqlari
          getData({ url: "/widgetdata/get", reqData: { id: 27 } }).catch(() => null),
          // [7] Widget 37: Kontragentlar qarzdorligi (Top 10)
          getData({ url: "/widgetdata/get", reqData: { id: 37 } }).catch(() => null),
          // [8] Widget 44: Savdo faolligi (kun va soat bo'yicha)
          getData({ url: "/widgetdata/get", reqData: { id: 44 } }).catch(() => null),
          // [9] Widget 35: Yaqinlashib kelayotgan tug'ilgan kunlar
          getData({ url: "/widgetdata/get", reqData: { id: 35 } }).catch(() => null),
          // [10] Widget 38: Xaridorlar yoshi bo'yicha taqsimot
          getData({ url: "/widgetdata/get", reqData: { id: 38 } }).catch(() => null),
          // [11] Widget 41: Xaridorlar jinsi bo'yicha taqsimot
          getData({ url: "/widgetdata/get", reqData: { id: 41 } }).catch(() => null),
          // [12] Widget 42: Joriy REGOS tarif rejasi
          getData({ url: "/widgetdata/get", reqData: { id: 42 } }).catch(() => null),
        ];

        const [
          resW30,
          resW31,
          resW32,
          resW33,
          resW34,
          resW39,
          resW27,
          resW37,
          resW44,
          resW35,
          resW38,
          resW41,
          resW42,
        ] = await Promise.all(widgetRequests);

        // Safe setters
        setSalesStats(resW30?.ok ? resW30.result : null);
        setPaymentsData(Array.isArray(resW31?.result) ? resW31.result : []);
        setSalesDynamics(Array.isArray(resW32?.result) ? resW32.result : []);
        setTopByQuantity(Array.isArray(resW33?.result) ? resW33.result : []);
        setTopByAmount(Array.isArray(resW34?.result) ? resW34.result : []);
        setInventoryValuation(resW39?.ok ? resW39.result : null);
        setAccountsData(Array.isArray(resW27?.result) ? resW27.result : []);
        setDebtorsData(Array.isArray(resW37?.result) ? resW37.result : []);
        setSalesActivity(Array.isArray(resW44?.result) ? resW44.result : []);
        setBirthdaysData(Array.isArray(resW35?.result) ? resW35.result : []);
        setDemographicsAge(Array.isArray(resW38?.result) ? resW38.result : []);
        setDemographicsSex(Array.isArray(resW41?.result) ? resW41.result : []);
        setTariffData(resW42?.ok ? resW42.result : null);
        setLastUpdated(new Date());
      } catch (err) {
        console.error("Dashboard yuklashda xatolik:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedPeriod, selectedStockId]
  );

  useEffect(() => {
    loadDashboardData(true);
  }, [loadDashboardData]);

  // Hisoblangan ko'rsatkichlar
  const totalSalesAmount = salesStats?.total_amount || 0;
  const grossProfit = salesStats?.gross_profit || 0;
  const profitMarginPercent =
    totalSalesAmount > 0 ? ((grossProfit / totalSalesAmount) * 100).toFixed(1) : 0;
  const receiptsCount = salesStats?.receipt_count || 0;
  const averageReceipt = salesStats?.average_receipt_amount || 0;
  const unitsSold = salesStats?.sales_unit_count || 0;
  const refundAmount = salesStats?.refund_amount || 0;
  const refundCount = salesStats?.refund_count || 0;

  // Jami bank va kassa hisoblar qoldig'i
  const totalCashAccounts = useMemo(() => {
    if (!Array.isArray(accountsData)) return 0;
    return accountsData.reduce((sum, a) => sum + Number(a?.value || 0), 0);
  }, [accountsData]);

  // Jami to'lovlar summasi (ulush foizini hisoblash uchun)
  const totalPaymentsAmount = useMemo(() => {
    if (!Array.isArray(paymentsData)) return 0;
    return paymentsData.reduce((sum, p) => sum + Number(p?.amount || 0), 0);
  }, [paymentsData]);

  // Jami qarzdorliklar (Top 10 kontragentlar bo'yicha)
  const totalTopDebts = useMemo(() => {
    if (!Array.isArray(debtorsData)) return 0;
    return debtorsData.reduce((sum, d) => sum + Number(d?.debt_amount || 0), 0);
  }, [debtorsData]);

  const selectedStockName =
    selectedStockId === 0
      ? "Barcha filiallar"
      : stocks.find((s) => s.id === Number(selectedStockId))?.name || "Filial";

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. Yuqori boshqaruv va filtrlar paneli */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border transition-all ${
          isDarkMode
            ? "bg-[#072f23] border-[#0e4b39] text-white"
            : "bg-white border-emerald-100 text-slate-800 shadow-sm"
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Sarlavha & Live status */}
          <div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span
                className={`text-xs uppercase font-extrabold tracking-wider ${
                  isDarkMode ? "text-emerald-300" : "text-[#065f46]"
                }`}
              >
                REGOS BI Dashboards & Widgets API
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                Jonli Tahlil
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1.5 flex items-center gap-2">
              <span>Boshqaruv Paneli</span>
              <span className="text-lg opacity-60 font-medium hidden sm:inline">
                / {selectedStockName}
              </span>
            </h1>

            <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? "text-emerald-200/70" : "text-slate-500"}`}>
              Do'konlar tarmog'i, savdo aylanmasi, yalpi daromad, to'lovlar va tovar qoldiqlari tahlili.
            </p>
          </div>

          {/* Davr tanlash va Filial filtri */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Davr tugmalari */}
            <div
              className={`p-1 rounded-2xl border flex items-center gap-1 ${
                isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-100 border-slate-200"
              }`}
            >
              {PERIODS.map((p) => {
                const isActive = selectedPeriod === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPeriod(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isActive
                        ? isDarkMode
                          ? "bg-[#065f46] text-white shadow-sm scale-100"
                          : "bg-white text-emerald-800 shadow-sm scale-100"
                        : isDarkMode
                        ? "text-emerald-200/70 hover:text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>{p.emoji}</span>
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filial / Ombor dropdown */}
            <div className="relative">
              <select
                value={selectedStockId}
                onChange={(e) => setSelectedStockId(Number(e.target.value))}
                className={`pl-3 pr-8 py-2 rounded-xl text-xs font-bold border transition-all appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                  isDarkMode
                    ? "bg-[#041f17] border-[#0e4b39] text-emerald-200"
                    : "bg-white border-slate-200 text-slate-800 shadow-sm"
                }`}
              >
                <option value={0}>🏢 Barcha Filiallar</option>
                {stocks.map((stock) => (
                  <option key={stock.id} value={stock.id}>
                    🏪 {stock.name}
                  </option>
                ))}
              </select>
              <span className="absolute right-2.5 top-2.5 pointer-events-none text-xs opacity-60">
                ▼
              </span>
            </div>

            {/* Yangilash tugmasi */}
            <button
              onClick={() => loadDashboardData(false)}
              disabled={refreshing}
              title="Ma'lumotlarni qayta yangilash"
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                refreshing ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
              } ${
                isDarkMode
                  ? "bg-[#064e3b] border-[#0e4b39] text-emerald-200 hover:bg-[#075e47]"
                  : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
              }`}
            >
              <span className={refreshing ? "animate-spin inline-block" : ""}>🔄</span>
            </button>
          </div>
        </div>

        {/* Tezkor modullar menyusi */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-inherit">
          <span className="text-[11px] uppercase tracking-wider font-bold opacity-60 mr-1">
            Asosiy Bo'limlar:
          </span>
          <button
            onClick={() => navigate("/sellers")}
            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-900 text-xs font-black hover:bg-amber-300 transition shadow-sm flex items-center gap-1.5"
          >
            <span>⭐</span>
            <span>Sellerlar & Foiz</span>
          </button>
          <button
            onClick={() => navigate("/partners")}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
              isDarkMode
                ? "bg-[#041f17] border-[#0e4b39] text-emerald-200 hover:bg-[#064e3b]"
                : "bg-white border-slate-200 text-slate-700 hover:bg-emerald-50"
            }`}
          >
            <span>👥</span>
            <span>Hamkorlar & Kontragentlar</span>
          </button>

          {lastUpdated && (
            <span className="text-[11px] opacity-60 ml-auto hidden md:inline">
              Yangilandi:{" "}
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* 2. Top Executive KPI Cards (Row 1) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI 1: Jami Savdo Tushumi */}
        <div
          className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${
            isDarkMode
              ? "bg-gradient-to-br from-[#064e3b] to-[#04281e] border-[#0e4b39] text-white"
              : "bg-gradient-to-br from-[#065f46] to-[#047857] border-emerald-200 text-white shadow-md"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-extrabold tracking-wider opacity-85">
              Jami Savdo Tushumi
            </span>
            <span className="text-2xl p-2 rounded-2xl bg-white/10 group-hover:scale-110 transition-transform">
              📈
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            {loading ? "..." : formatMoney(totalSalesAmount, "UZS")}
          </div>
          <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <span className="opacity-90">
              Cheklar: <b className="font-extrabold">{receiptsCount} ta</b>
            </span>
            <span className="opacity-90">
              O'rtacha: <b className="font-extrabold">{formatMoney(Math.round(averageReceipt), "")}</b>
            </span>
          </div>
        </div>

        {/* KPI 2: Yalpi Foyda (Marja) */}
        <div
          className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider opacity-70 block">
                Yalpi Foyda (Marja)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 mt-1 inline-block">
                Marja: {profitMarginPercent}%
              </span>
            </div>
            <span className="text-2xl p-2 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              💎
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-emerald-400">
            {loading ? "..." : formatMoney(grossProfit, "UZS")}
          </div>
          <div className="mt-3 pt-3 border-t border-inherit flex items-center justify-between text-xs opacity-70">
            <span>Sotilgan tovar:</span>
            <span className="font-bold text-emerald-400">{unitsSold.toLocaleString()} dona</span>
          </div>
        </div>

        {/* KPI 3: Ombor Qoldig'i Qiymati */}
        <div
          className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-extrabold tracking-wider opacity-70">
              Ombor Zapas Bahosi
            </span>
            <span className="text-2xl p-2 rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              📦
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-amber-400 truncate">
            {loading
              ? "..."
              : formatMoney(
                  inventoryValuation?.prices?.[0]?.amount ||
                    inventoryValuation?.cost?.amount ||
                    0,
                  "UZS"
                )}
          </div>
          <div className="mt-3 pt-3 border-t border-inherit flex items-center justify-between text-xs opacity-70">
            <span>Tannarxi:</span>
            <span className="font-bold truncate max-w-[140px]">
              {formatMoney(inventoryValuation?.cost?.amount || 0, "UZS")}
            </span>
          </div>
        </div>

        {/* KPI 4: Kassalar va Hisob-raqamlar */}
        <div
          className={`p-6 rounded-3xl border transition-all relative overflow-hidden group ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-start">
            <span className="text-xs uppercase font-extrabold tracking-wider opacity-70">
              Hisoblar & Kassa
            </span>
            <span className="text-2xl p-2 rounded-2xl bg-sky-500/10 text-sky-400 group-hover:scale-110 transition-transform">
              🏦
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 tracking-tight text-sky-400">
            {loading ? "..." : formatMoney(totalCashAccounts, "UZS")}
          </div>
          <div className="mt-3 pt-3 border-t border-inherit flex items-center justify-between text-xs opacity-70">
            <span>Faol hisoblar:</span>
            <span className="font-bold text-sky-400">{accountsData.length} ta hisob</span>
          </div>
        </div>
      </div>

      {/* 3. Sub-view Bo'lim Tablari */}
      <div
        className={`p-1.5 rounded-2xl border flex flex-wrap gap-1.5 ${
          isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-100 border-slate-200"
        }`}
      >
        <button
          onClick={() => setActiveSubView("sales")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubView === "sales"
              ? isDarkMode
                ? "bg-[#065f46] text-white shadow-sm"
                : "bg-white text-emerald-900 shadow-sm"
              : isDarkMode
              ? "text-emerald-200/70 hover:text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>💳</span>
          <span>Savdo & To'lov Tahlili</span>
        </button>

        <button
          onClick={() => setActiveSubView("top_products")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubView === "top_products"
              ? isDarkMode
                ? "bg-[#065f46] text-white shadow-sm"
                : "bg-white text-emerald-900 shadow-sm"
              : isDarkMode
              ? "text-emerald-200/70 hover:text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>🏆</span>
          <span>Top 10 Tovarlar (Summa & Soni)</span>
        </button>

        <button
          onClick={() => setActiveSubView("inventory")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubView === "inventory"
              ? isDarkMode
                ? "bg-[#065f46] text-white shadow-sm"
                : "bg-white text-emerald-900 shadow-sm"
              : isDarkMode
              ? "text-emerald-200/70 hover:text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>📦</span>
          <span>Ombor Qoldig'i & Baholash</span>
        </button>

        <button
          onClick={() => setActiveSubView("debts")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubView === "debts"
              ? isDarkMode
                ? "bg-[#065f46] text-white shadow-sm"
                : "bg-white text-emerald-900 shadow-sm"
              : isDarkMode
              ? "text-emerald-200/70 hover:text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>⚠️</span>
          <span>Kontragent Nasiyalari ({debtorsData.length})</span>
        </button>

        <button
          onClick={() => setActiveSubView("activity")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubView === "activity"
              ? isDarkMode
                ? "bg-[#065f46] text-white shadow-sm"
                : "bg-white text-emerald-900 shadow-sm"
              : isDarkMode
              ? "text-emerald-200/70 hover:text-white"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>👥</span>
          <span>Mijozlar & Soatlik Faollik</span>
        </button>
      </div>

      {/* 4. SUB-VIEW: SAVDO VA TO'LOVLAR (Widget 30 & 31) */}
      {activeSubView === "sales" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* To'lov turlari taqsimoti (Widget 31) */}
            <div
              className={`p-6 rounded-3xl border transition-colors flex flex-col justify-between ${
                isDarkMode
                  ? "bg-[#072f23] border-[#0e4b39] text-white"
                  : "bg-white border-emerald-100 text-slate-800 shadow-sm"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs uppercase font-extrabold tracking-wider opacity-60">
                      REGOS Widget #31
                    </span>
                    <h2 className="text-lg font-bold tracking-tight mt-0.5">
                      To'lov Kanallari Taqsimoti
                    </h2>
                  </div>
                  <span className="text-2xl">⚡</span>
                </div>

                <div className="space-y-4">
                  {paymentsData.length > 0 ? (
                    paymentsData.map((pay) => {
                      const amount = Number(pay?.amount || 0);
                      const percent =
                        totalPaymentsAmount > 0
                          ? ((amount / totalPaymentsAmount) * 100).toFixed(1)
                          : 0;

                      const isCash = pay.name?.toLowerCase().includes("налич");
                      const isCard = pay.name?.toLowerCase().includes("карта");

                      return (
                        <div key={pay.id} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold flex items-center gap-1.5">
                              <span>{isCash ? "💵" : isCard ? "💳" : "📱"}</span>
                              <span>{pay.name}</span>
                            </span>
                            <div className="text-right">
                              <span className="font-extrabold">{formatMoney(amount, "UZS")}</span>
                              <span className="opacity-60 ml-1.5 text-[11px]">({percent}%)</span>
                            </div>
                          </div>

                          <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCash
                                  ? "bg-emerald-400"
                                  : isCard
                                  ? "bg-sky-400"
                                  : "bg-amber-400"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-6 text-center opacity-60 text-xs">
                      Tanlangan davrda to'lov ma'lumoti mavjud emas
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-inherit flex justify-between items-center text-xs">
                <span className="opacity-70">Jami to'lovlar summasi:</span>
                <span className="text-sm font-extrabold text-emerald-400">
                  {formatMoney(totalPaymentsAmount, "UZS")}
                </span>
              </div>
            </div>

            {/* Savdo tafsilotlari (Widget 30 to'liq ko'rsatkichlari) */}
            <div
              className={`p-6 rounded-3xl border transition-colors lg:col-span-2 ${
                isDarkMode
                  ? "bg-[#072f23] border-[#0e4b39] text-white"
                  : "bg-white border-emerald-100 text-slate-800 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider opacity-60">
                    REGOS Widget #30
                  </span>
                  <h2 className="text-lg font-bold tracking-tight mt-0.5">
                    Savdo Operatsiyalari va Samaradorlik
                  </h2>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
                  {selectedPeriod} davri
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 text-xs">
                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="opacity-60 block">Sotuv Operatsiyalari:</span>
                  <div className="text-xl font-black mt-1 text-emerald-400">
                    {salesStats?.sales_count || 0} ta
                  </div>
                  <span className="text-[11px] opacity-60 mt-0.5 block">
                    {salesStats?.sales_pos_count || 0} ta pozitsiya
                  </span>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="opacity-60 block">Qaytarishlar (Vozvrat):</span>
                  <div className="text-xl font-black mt-1 text-rose-400">
                    {formatMoney(refundAmount, "UZS")}
                  </div>
                  <span className="text-[11px] opacity-60 mt-0.5 block">
                    {refundCount} ta chek ({salesStats?.refund_unit_count || 0} dona)
                  </span>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="opacity-60 block">O'rtacha Chek:</span>
                  <div className="text-xl font-black mt-1 text-amber-400">
                    {formatMoney(Math.round(averageReceipt), "UZS")}
                  </div>
                  <span className="text-[11px] opacity-60 mt-0.5 block">1 xaridor hisobiga</span>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="opacity-60 block">Sotilgan Tovar Soni:</span>
                  <div className="text-xl font-black mt-1 text-sky-400">
                    {unitsSold.toLocaleString()} dona
                  </div>
                  <span className="text-[11px] opacity-60 mt-0.5 block">Ombordan chiqdi</span>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="opacity-60 block">1 kv.m ga Savdo:</span>
                  <div className="text-xl font-black mt-1 text-purple-400 truncate">
                    {formatMoney(Math.round(salesStats?.sales_amount_per_square_meter || 0), "UZS")}
                  </div>
                  <span className="text-[11px] opacity-60 mt-0.5 block">Maydon unumdorligi</span>
                </div>

                <div
                  className={`p-4 rounded-2xl border ${
                    isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <span className="opacity-60 block">Yalpi Marja:</span>
                  <div className="text-xl font-black mt-1 text-emerald-400">
                    {profitMarginPercent}%
                  </div>
                  <span className="text-[11px] opacity-60 mt-0.5 block">Foydalilik ko'rsatkichi</span>
                </div>
              </div>

              {/* Savdo Dinamikasi (Widget 32) */}
              {salesDynamics.length > 0 && (
                <div className="mt-5 pt-4 border-t border-inherit">
                  <h3 className="font-bold text-xs uppercase opacity-70 mb-3">
                    Davriy Savdo Dinamikasi (Widget #32)
                  </h3>
                  <div className="space-y-2">
                    {salesDynamics.slice(0, 5).map((dyn, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl flex justify-between items-center text-xs ${
                          isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                        }`}
                      >
                        <span className="font-semibold">
                          📅 {new Date(dyn.date).toLocaleDateString("uz-UZ")}
                        </span>
                        <span className="font-black text-emerald-400">
                          {formatMoney(dyn.amount, "UZS")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-VIEW: TOP TOVARLAR (Widget 33 & 34) */}
      {activeSubView === "top_products" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Top 10 tovarlar (Summa bo'yicha - Widget 34) */}
          <div
            className={`p-6 rounded-3xl border transition-colors ${
              isDarkMode
                ? "bg-[#072f23] border-[#0e4b39] text-white"
                : "bg-white border-emerald-100 text-slate-800 shadow-sm"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-60">
                  REGOS Widget #34
                </span>
                <h2 className="text-lg font-bold tracking-tight mt-0.5">
                  Top 10 Tovar — Savdo Summasi Bo'yicha
                </h2>
              </div>
              <span className="text-2xl">💰</span>
            </div>

            <div className="space-y-2.5">
              {topByAmount.length > 0 ? (
                topByAmount.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition hover:scale-[1.01] ${
                      isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0
                          ? "bg-amber-400 text-slate-900"
                          : idx === 1
                          ? "bg-slate-300 text-slate-900"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : isDarkMode
                          ? "bg-[#072f23] text-emerald-300"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      #{idx + 1}
                    </span>

                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-11 h-11 rounded-xl object-cover border border-inherit shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-lg shrink-0">
                        📦
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold truncate leading-tight">{item.name}</h4>
                      <p className="text-[11px] opacity-60 mt-0.5">Kodi: {item.code || item.id}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-emerald-400 block">
                        {formatMoney(item.amount, "UZS")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center opacity-60 text-xs">Top tovarlar yuklanmoqda...</div>
              )}
            </div>
          </div>

          {/* Top 10 tovarlar (Soni / Miqdori bo'yicha - Widget 33) */}
          <div
            className={`p-6 rounded-3xl border transition-colors ${
              isDarkMode
                ? "bg-[#072f23] border-[#0e4b39] text-white"
                : "bg-white border-emerald-100 text-slate-800 shadow-sm"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-60">
                  REGOS Widget #33
                </span>
                <h2 className="text-lg font-bold tracking-tight mt-0.5">
                  Top 10 Tovar — Sotilgan Soni Bo'yicha
                </h2>
              </div>
              <span className="text-2xl">📦</span>
            </div>

            <div className="space-y-2.5">
              {topByQuantity.length > 0 ? (
                topByQuantity.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`p-3 rounded-2xl border flex items-center gap-3 transition hover:scale-[1.01] ${
                      isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                        idx === 0
                          ? "bg-amber-400 text-slate-900"
                          : idx === 1
                          ? "bg-slate-300 text-slate-900"
                          : idx === 2
                          ? "bg-amber-700 text-white"
                          : isDarkMode
                          ? "bg-[#072f23] text-emerald-300"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      #{idx + 1}
                    </span>

                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-11 h-11 rounded-xl object-cover border border-inherit shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-sky-500/10 flex items-center justify-center text-lg shrink-0">
                        👕
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold truncate leading-tight">{item.name}</h4>
                      <p className="text-[11px] opacity-60 mt-0.5">Kodi: {item.code || item.id}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-sm font-black text-sky-400 block">
                        {item.quantity?.toLocaleString()} dona
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center opacity-60 text-xs">Top tovarlar yuklanmoqda...</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-VIEW: OMBOR QOLDIG'I VA BAHOLASH (Widget 39) */}
      {activeSubView === "inventory" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Asosiy baholash ko'rsatkichlari */}
            <div
              className={`p-6 rounded-3xl border transition-colors lg:col-span-2 ${
                isDarkMode
                  ? "bg-[#072f23] border-[#0e4b39] text-white"
                  : "bg-white border-emerald-100 text-slate-800 shadow-sm"
              }`}
            >
              <div className="flex justify-between items-start mb-5">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider opacity-60">
                    REGOS Widget #39: Zapaslar Baholanishi
                  </span>
                  <h2 className="text-xl font-bold tracking-tight mt-0.5">
                    Ombordagi Tovar Qoldiqlari Qiymati
                  </h2>
                </div>
                <span className="text-3xl">🏬</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tannarx bo'yicha */}
                <div
                  className={`p-5 rounded-2xl border ${
                    isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-emerald-50/50 border-emerald-100"
                  }`}
                >
                  <span className="text-xs opacity-70 block font-semibold">
                    Tan Narxi Bo'yicha Jami Qiymat (Cost)
                  </span>
                  <div className="text-2xl sm:text-3xl font-black mt-2 text-amber-400">
                    {formatMoney(inventoryValuation?.cost?.amount || 0, "UZS")}
                  </div>
                  <p className="text-[11px] opacity-60 mt-1">
                    Kompaniyaning tovarga sarflagan sof investitsiyasi
                  </p>
                </div>

                {/* Chakana narx bo'yicha */}
                <div
                  className={`p-5 rounded-2xl border ${
                    isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-emerald-50/50 border-emerald-100"
                  }`}
                >
                  <span className="text-xs opacity-70 block font-semibold">
                    Chakana Narxda Sotish Qiymati (Retail)
                  </span>
                  <div className="text-2xl sm:text-3xl font-black mt-2 text-emerald-400">
                    {formatMoney(inventoryValuation?.prices?.[0]?.amount || 0, "UZS")}
                  </div>
                  <p className="text-[11px] opacity-60 mt-1">
                    Barcha tovarlar to'liq sotilgandagi kutilayotgan tushum
                  </p>
                </div>
              </div>

              {/* Potensial Marja va Farq */}
              <div
                className={`mt-4 p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                }`}
              >
                <div>
                  <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">
                    Kutilayotgan Yalpi Foyda Potensiali
                  </span>
                  <div className="text-xl font-black mt-0.5">
                    {formatMoney(
                      (inventoryValuation?.prices?.[0]?.amount || 0) -
                        (inventoryValuation?.cost?.amount || 0),
                      "UZS"
                    )}
                  </div>
                </div>

                <div className="text-xs opacity-75">
                  <p>
                    Jami qoldiq soni:{" "}
                    <b>{inventoryValuation?.quantity?.common?.toLocaleString() || 0} dona</b>
                  </p>
                  <p>
                    Nomenklatura turlari:{" "}
                    <b>{inventoryValuation?.item_count?.toLocaleString() || 0} xil tovar</b>
                  </p>
                </div>
              </div>
            </div>

            {/* Qoldiq statistikasi va filiallarga taqsimot */}
            <div
              className={`p-6 rounded-3xl border transition-colors flex flex-col justify-between ${
                isDarkMode
                  ? "bg-[#072f23] border-[#0e4b39] text-white"
                  : "bg-white border-emerald-100 text-slate-800 shadow-sm"
              }`}
            >
              <div>
                <h3 className="text-base font-bold tracking-tight mb-3">Ombor Holati</h3>
                <div className="space-y-3 text-xs">
                  <div
                    className={`p-3.5 rounded-xl flex justify-between items-center ${
                      isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                    }`}
                  >
                    <span>Faol Tovar Turlari:</span>
                    <span className="font-extrabold text-sm">
                      {inventoryValuation?.item_count?.toLocaleString() || 0} xil
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl flex justify-between items-center ${
                      isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                    }`}
                  >
                    <span>Ombordagi Mavjud Qoldiq:</span>
                    <span className="font-extrabold text-sm text-emerald-400">
                      {inventoryValuation?.quantity?.allowed?.toLocaleString() || 0} dona
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-xl flex justify-between items-center ${
                      isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                    }`}
                  >
                    <span>Bron Qilingan (Booked):</span>
                    <span className="font-extrabold text-sm text-amber-400">
                      {inventoryValuation?.quantity?.booked || 0} dona
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-inherit">
                <button
                  onClick={() => navigate("/partners")}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition shadow-sm"
                >
                  👥 Hamkorlar & Kontragentlar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-VIEW: KONTRAGENT NASIYALARI (Widget 37) */}
      {activeSubView === "debts" && (
        <div
          className={`p-6 rounded-3xl border transition-colors ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider opacity-60">
                REGOS Widget #37
              </span>
              <h2 className="text-lg font-bold tracking-tight mt-0.5">
                Top 10 Qarzdor Kontragentlar (Nasiyalar)
              </h2>
              <p className="text-xs opacity-60 mt-0.5">
                Mijozlar va hamkorlar tomonidan to'lanishi kutilayotgan qarzdorliklar
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs opacity-60 block">Top 10 Jami Qarzdorlik:</span>
              <span className="text-xl font-black text-amber-400">
                {formatMoney(totalTopDebts, "UZS")}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {debtorsData.length > 0 ? (
              debtorsData.map((debtor, idx) => (
                <div
                  key={debtor.id || idx}
                  className={`p-4 rounded-2xl border transition hover:scale-[1.01] flex items-center justify-between ${
                    isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold opacity-60">#{idx + 1}</span>
                      <h4 className="text-sm font-bold truncate">{debtor.name}</h4>
                    </div>
                    {debtor.last_payment && (
                      <p className="text-[11px] opacity-60 mt-1">
                        Oxirgi to'lov:{" "}
                        {new Date(debtor.last_payment).toLocaleDateString("uz-UZ")}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-amber-400 block">
                      {formatMoney(debtor.debt_amount, "UZS")}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                      Nasiya
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-8 text-center opacity-60 text-xs">
                Qarzdor kontragentlar ma'lumoti yo'q
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. SUB-VIEW: MIJOZLAR VA SOATLIK FAOLLIK (Widget 44, 38, 41, 35) */}
      {activeSubView === "activity" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Haftalik va soatlik savdo faolligi (Widget 44) */}
          <div
            className={`p-6 rounded-3xl border transition-colors lg:col-span-2 ${
              isDarkMode
                ? "bg-[#072f23] border-[#0e4b39] text-white"
                : "bg-white border-emerald-100 text-slate-800 shadow-sm"
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-xs uppercase font-extrabold tracking-wider opacity-60">
                  REGOS Widget #44
                </span>
                <h2 className="text-lg font-bold tracking-tight mt-0.5">
                  Kunlik va Soatlik Savdo Faolligi (Heatmap)
                </h2>
              </div>
              <span className="text-2xl">⏰</span>
            </div>

            <p className="text-xs opacity-60 mb-4">
              Hafta kunlari va soatlar kesimida eng faol savdo davrlari intensivligi.
            </p>

            <div className="space-y-2 text-xs">
              {salesActivity.length > 0 ? (
                salesActivity.map((dayItem, dIdx) => {
                  const dayData = dayItem.data || [];
                  const dayTotal = dayData.reduce((sum, h) => sum + Number(h?.value || 0), 0);
                  const maxHourValue = Math.max(...dayData.map((h) => Number(h?.value || 0)), 1);

                  return (
                    <div
                      key={dIdx}
                      className={`p-3 rounded-2xl border ${
                        isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-extrabold text-sm">{dayItem.day}</span>
                        <span className="font-bold text-emerald-400">
                          {formatMoney(dayTotal, "UZS")}
                        </span>
                      </div>

                      {/* 24 soatlik miniatyura bar grafiki */}
                      <div className="grid grid-cols-24 gap-0.5 h-6 items-end">
                        {dayData.map((h, hIdx) => {
                          const val = Number(h?.value || 0);
                          const heightPct = Math.round((val / maxHourValue) * 100);
                          return (
                            <div
                              key={hIdx}
                              title={`${h.hour}:00 - ${formatMoney(val, "UZS")}`}
                              className="group relative flex flex-col items-center h-full justify-end"
                            >
                              <div
                                style={{ height: `${Math.max(heightPct, 6)}%` }}
                                className={`w-full rounded-sm transition-all ${
                                  val > 0
                                    ? heightPct > 70
                                      ? "bg-amber-400"
                                      : "bg-emerald-400"
                                    : "bg-emerald-500/10"
                                }`}
                              />
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[9px] opacity-40 mt-1">
                        <span>00:00</span>
                        <span>06:00</span>
                        <span>12:00</span>
                        <span>18:00</span>
                        <span>23:00</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center opacity-60">Faollik ma'lumoti yuklanmoqda...</div>
              )}
            </div>
          </div>

          {/* Mijozlar demografiyasi & Tug'ilgan kunlar */}
          <div className="space-y-5">
            {/* Tug'ilgan kunlar (Widget 35) */}
            <div
              className={`p-5 rounded-3xl border transition-colors ${
                isDarkMode
                  ? "bg-[#072f23] border-[#0e4b39] text-white"
                  : "bg-white border-emerald-100 text-slate-800 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm flex items-center gap-1.5">
                  <span>🎂</span>
                  <span>Yaqinlashgan Tug'ilgan Kunlar</span>
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                  {birthdaysData.length} ta
                </span>
              </div>

              <div className="space-y-2">
                {birthdaysData.length > 0 ? (
                  birthdaysData.map((b) => (
                    <div
                      key={b.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs ${
                        isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="font-bold block truncate">{b.name}</span>
                        <span className="text-[10px] opacity-60">
                          {b.phone ? getCleanPhone(b.phone) : "Tel yo'q"}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-400 shrink-0">
                        {new Date(b.date).toLocaleDateString("uz-UZ", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center opacity-60 text-xs">Yaqin kunlarda yo'q</div>
                )}
              </div>
            </div>

            {/* Demografiya: Jins & Yosh (Widget 41 & 38) */}
            <div
              className={`p-5 rounded-3xl border transition-colors ${
                isDarkMode
                  ? "bg-[#072f23] border-[#0e4b39] text-white"
                  : "bg-white border-emerald-100 text-slate-800 shadow-sm"
              }`}
            >
              <h3 className="font-bold text-sm mb-3 flex items-center gap-1.5">
                <span>📊</span>
                <span>Xaridorlar Jinsi (Widget #41)</span>
              </h3>

              <div className="space-y-2 text-xs">
                {demographicsSex.map((s, idx) => {
                  const label =
                    s.sex === "male"
                      ? "Erkaklar 👨"
                      : s.sex === "female"
                      ? "Ayollar 👩"
                      : "Noma'lum 👤";
                  return (
                    <div key={idx} className="flex justify-between items-center p-2 rounded-xl">
                      <span className="opacity-80">{label}</span>
                      <span className="font-extrabold text-sm">{s.count} nafar</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Pastki panel: REGOS Tizim & Tarif Rejasi (Widget 42) */}
      {tariffData && (
        <div
          className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
            isDarkMode
              ? "bg-[#041f17] border-[#0e4b39] text-white"
              : "bg-emerald-50/60 border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 shrink-0">
              ⚡
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm">
                  REGOS ERP: {tariffData.name || "Standart Tarif"}
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  Faol
                </span>
              </div>
              <p className="text-xs opacity-60 mt-0.5">
                Amal qilish muddati:{" "}
                {tariffData.paid_until
                  ? new Date(tariffData.paid_until).toLocaleDateString("uz-UZ")
                  : "Muddatsiz"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="opacity-60 block">Do'konlar & Filiallar:</span>
              <span className="font-extrabold text-emerald-400">
                {stocks.length} ta faol filial
              </span>
            </div>
            <a
              href="https://docs.regos.uz/en/api/widgets"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold transition flex items-center gap-1"
            >
              <span>docs.regos.uz</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
