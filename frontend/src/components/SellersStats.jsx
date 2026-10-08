import { useEffect, useState, useMemo, useCallback } from "react";
import getData from "../utils/getData";
import { formatMoney } from "../utils/formatters";
import { printSellerReport } from "../utils/printSellerReport";
import { exportSellerExcel } from "../utils/exportSellerExcel";
import SellerChequesModal from "./SellerChequesModal";

// Bugungi sanani YYYY-MM-DD ko'rinishida olish (Mahalliy vaqt)
function getTodayDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Berilgan kunga nisbatan oldingi sanani olish
function getPastDateStr(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Oy boshidagi sana
function getMonthStartDateStr() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

// YYYY-MM-DD sanasini kun boshidagi va oxiridagi Unix soniyasiga aylantirish
function dateStringToUnixRange(startDateStr, endDateStr) {
  const startObj = new Date(`${startDateStr}T00:00:00`);
  const endObj = new Date(`${endDateStr}T23:59:59`);
  
  let start = Math.floor(startObj.getTime() / 1000);
  let end = Math.floor(endObj.getTime() / 1000);

  if (isNaN(start)) start = Math.floor(new Date().setHours(0,0,0,0) / 1000);
  if (isNaN(end)) end = Math.floor(new Date().setHours(23,59,59,999) / 1000);

  return { start, end };
}

export default function Sellers({ isDarkMode }) {
  const [loading, setLoading] = useState(true);
  const [cheques, setCheques] = useState([]);
  const [usersList, setUsersList] = useState([]);

  // Sana filtrlari
  const [dateMode, setDateMode] = useState("today"); // 'today' | 'yesterday' | 'last3' | 'last7' | 'thisMonth' | 'month' | 'custom'
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr());
  const [customStartDate, setCustomStartDate] = useState(getTodayDateStr());
  const [customEndDate, setCustomEndDate] = useState(getTodayDateStr());
  const [selectedMonth, setSelectedMonth] = useState(getTodayDateStr().substring(0, 7));

  // Foiz stavkasi (Commission Rate %)
  // Foydalanuvchi inputga son yozsa darhol sotuvi bo'yicha foizini hisoblaydi
  const [commissionRate, setCommissionRate] = useState(2); // Birlamchi 2%
  // Har bir seller uchun individual foiz (ixtiyoriy o'zgartirish)
  const [customRates, setCustomRates] = useState({});

  // Qidiruv va saralash
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [sortBy, setSortBy] = useState("net_sales_desc"); // 'net_sales_desc' | 'net_sales_asc' | 'bonus_desc' | 'cheques_desc' | 'name_asc'
  const [onlyActive, setOnlyActive] = useState(true); // Faqat sotuv qilgan sellerlar

  // Tafsilot modali uchun tanlangan seller
  const [selectedSeller, setSelectedSeller] = useState(null);

  // Faol sana oralig'ini hisoblash
  const { startUnix, endUnix, dateLabel } = useMemo(() => {
    let sDate = selectedDate;
    let eDate = selectedDate;
    let label = selectedDate;

    if (dateMode === "today") {
      sDate = getTodayDateStr();
      eDate = getTodayDateStr();
      label = `Bugun (${sDate})`;
    } else if (dateMode === "yesterday") {
      sDate = getPastDateStr(1);
      eDate = getPastDateStr(1);
      label = `Kecha (${sDate})`;
    } else if (dateMode === "last3") {
      sDate = getPastDateStr(2);
      eDate = getTodayDateStr();
      label = `Oxirgi 3 kun (${sDate} — ${eDate})`;
    } else if (dateMode === "last7") {
      sDate = getPastDateStr(6);
      eDate = getTodayDateStr();
      label = `Oxirgi 7 kun (${sDate} — ${eDate})`;
    } else if (dateMode === "thisMonth") {
      sDate = getMonthStartDateStr();
      eDate = getTodayDateStr();
      label = `Shu oy (${sDate} — ${eDate})`;
    } else if (dateMode === "month") {
      const [y, m] = selectedMonth.split("-");
      sDate = `${y}-${m}-01`;
      const lastDay = new Date(Number(y), Number(m), 0).getDate();
      eDate = `${y}-${m}-${String(lastDay).padStart(2, "0")}`;
      label = `${y}-${m} oyi`;
    } else if (dateMode === "custom") {
      sDate = customStartDate;
      eDate = customEndDate;
      label = `${sDate} — ${eDate}`;
    } else {
      // Aniq bitta sana
      sDate = selectedDate;
      eDate = selectedDate;
      label = selectedDate;
    }

    const { start, end } = dateStringToUnixRange(sDate, eDate);
    return { startUnix: start, endUnix: end, dateLabel: label };
  }, [dateMode, selectedDate, customStartDate, customEndDate, selectedMonth]);

  // REGOS API dan sellerlar va cheklarni yuklash
  const fetchData = useCallback(async () => {
    let isMounted = true;
    try {
      setLoading(true);

      // 1. Foydalanuvchilar (Sellerlar) ma'lumotnomasi (/user/get)
      const usersPromise = getData({
        url: "/user/get",
        reqData: {},
      }).catch(() => null);

      const fetchChequesInChunks = async (start, end) => {
        const CHUNK_SIZE = 3 * 86400; // 3 kunlik qismlar
        let allCheques = [];
        
        // Ketma-ket (sequential) so'rovlar yuborish, API bloklab qo'ymasligi uchun
        for (let currentStart = start; currentStart <= end; currentStart += CHUNK_SIZE + 1) {
          let currentEnd = currentStart + CHUNK_SIZE;
          if (currentEnd > end) currentEnd = end;

          try {
            const res = await getData({
              url: "/doccheque/get",
              reqData: {
                start_date: currentStart,
                end_date: currentEnd,
                limit: 100000,
                filters: [{ Field: "status", Operator: "Equal", Value: "Closed" }],
              },
            });
            if (res && Array.isArray(res.result)) {
              allCheques = allCheques.concat(res.result);
            }
          } catch (err) {
            console.error("Chunk yuklashda xato:", err);
          }
        }

        // Takrorlanishlarning oldini olish
        const uniqueMap = new Map();
        allCheques.forEach((ch) => {
          if (ch.uuid) uniqueMap.set(ch.uuid, ch);
        });

        // Barcha cheklarni sanasi bo'yicha kamayish tartibida (yangi birinchi) saralash
        const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
          return (Number(b.date) || 0) - (Number(a.date) || 0);
        });
        
        return sorted;
      };

      const [usersRes, allCheques] = await Promise.all([
        usersPromise,
        fetchChequesInChunks(startUnix, endUnix),
      ]);

      if (isMounted) {
        setUsersList(Array.isArray(usersRes?.result) ? usersRes.result : []);
        setCheques(allCheques);
      }
    } catch (err) {
      console.error("Sellerlar va cheklarni yuklashda xatolik:", err);
    } finally {
      if (isMounted) setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  }, [startUnix, endUnix]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cheklarni sellerlar bo'yicha guruhlash va hisoblash
  const { sellersStats, totalNetSales, totalGrossSales, totalReturnsSum, totalChequesCount, branchesList } =
    useMemo(() => {
      // 1. Sellerlar xaritasi
      const statsMap = new Map();

      // REGOS dagi barcha foydalanuvchilarni boshlang'ich kiritish (agar sotuv qilgan bo'lmasa 0 bo'lib turadi)
      usersList.forEach((u) => {
        // Faqat sotuvchi bo'lishi mumkin bo'lgan foydalanuvchilar yoki faol xodimlar
        statsMap.set(String(u.id), {
          id: u.id,
          name: u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.login,
          group: u.user_group?.name || "",
          barcode: u.seller_barcode || "",
          login: u.login || "",
          phone: u.main_phone || u.phones || "",
          active: u.active !== false,
          totalSales: 0,
          returnsSum: 0,
          netSales: 0,
          chequesCount: 0,
          returnsCount: 0,
          cheques: [],
        });
      });

      let grandTotalGross = 0;
      let grandTotalReturns = 0;
      let grandTotalCheques = 0;

      // 2. Belgilangan sanadagi cheklarni tahlil qilish
      cheques.forEach((ch) => {
        grandTotalCheques++;
        const amt = Number(ch.amount || 0);
        const isRet = Boolean(ch.is_return);

        if (isRet) {
          grandTotalReturns += amt;
        } else {
          grandTotalGross += amt;
        }

        // Seller ma'lumotini aniqlash
        const sellerObj = ch.seller || null;
        let sellerKey = sellerObj?.id ? String(sellerObj.id) : null;

        if (!sellerKey) {
          // Seller ko'rsatilmagan cheklar
          sellerKey = "unassigned";
          if (!statsMap.has(sellerKey)) {
            statsMap.set(sellerKey, {
              id: "unassigned",
              name: "Seller belgilanmagan",
              group: "Umumiy",
              barcode: "—",
              login: "—",
              phone: "—",
              active: true,
              totalSales: 0,
              returnsSum: 0,
              netSales: 0,
              chequesCount: 0,
              returnsCount: 0,
              cheques: [],
            });
          }
        } else if (!statsMap.has(sellerKey)) {
          // Chekdagi seller user/get da bo'lmasa
          statsMap.set(sellerKey, {
            id: sellerObj.id,
            name: sellerObj.full_name || sellerObj.first_name || `Seller #${sellerObj.id}`,
            group: sellerObj.user_group?.name || "",
            barcode: sellerObj.seller_barcode || "",
            login: sellerObj.login || "",
            phone: sellerObj.main_phone || "",
            active: true,
            totalSales: 0,
            returnsSum: 0,
            netSales: 0,
            chequesCount: 0,
            returnsCount: 0,
            cheques: [],
          });
        }

        const sData = statsMap.get(sellerKey);
        sData.cheques.push(ch);

        if (isRet) {
          sData.returnsSum += amt;
          sData.returnsCount++;
        } else {
          sData.totalSales += amt;
          sData.chequesCount++;
        }

        sData.netSales = sData.totalSales - sData.returnsSum;
      });

      const grandTotalNet = grandTotalGross - grandTotalReturns;

      // Filiallar (user_group) ro'yxati
      const branches = new Set();
      const allList = Array.from(statsMap.values()).map((s) => {
        if (s.group) branches.add(s.group);

        // Har bir sellerning foiz stavkasi (agar alohida belgilangan bo'lsa shuni, aks holda umumiy stavka)
        const rate =
          customRates[s.id] !== undefined
            ? Number(customRates[s.id])
            : Number(commissionRate || 0);

        // Inputga son yozilganda sotuvi bo'yicha foizni hisoblash:
        // Bonus = (Sof sotuv * Foiz) / 100
        const bonusSum = Math.max(0, Math.round((s.netSales * rate) / 100));

        // Ulush foizi (Umumiy sotuvdagi ulushi)
        const sharePercent =
          grandTotalNet > 0 ? (s.netSales / grandTotalNet) * 100 : 0;

        // O'rtacha chek
        const avgCheque =
          s.chequesCount > 0 ? Math.round(s.netSales / s.chequesCount) : 0;

        return {
          ...s,
          rate,
          bonusSum,
          sharePercent: Math.max(0, sharePercent),
          avgCheque,
        };
      });

      return {
        sellersStats: allList,
        totalNetSales: grandTotalNet,
        totalGrossSales: grandTotalGross,
        totalReturnsSum: grandTotalReturns,
        totalChequesCount: grandTotalCheques,
        branchesList: Array.from(branches).sort(),
      };
    }, [cheques, usersList, commissionRate, customRates]);

  // Filtrlash va saralash
  const filteredSellers = useMemo(() => {
    let list = [...sellersStats];

    // Faqat sotuv qilganlar filtri
    if (onlyActive) {
      list = list.filter((s) => s.chequesCount > 0 || s.netSales > 0);
    }

    // Filial filtri
    if (selectedBranch !== "all") {
      list = list.filter((s) => s.group === selectedBranch);
    }

    // Qidiruv
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => {
        return (
          s.name.toLowerCase().includes(q) ||
          s.group.toLowerCase().includes(q) ||
          s.barcode.toLowerCase().includes(q) ||
          s.login.toLowerCase().includes(q)
        );
      });
    }

    // Saralash
    list.sort((a, b) => {
      if (sortBy === "net_sales_desc") return b.netSales - a.netSales;
      if (sortBy === "net_sales_asc") return a.netSales - b.netSales;
      if (sortBy === "bonus_desc") return b.bonusSum - a.bonusSum;
      if (sortBy === "cheques_desc") return b.chequesCount - a.chequesCount;
      if (sortBy === "name_asc") return a.name.localeCompare(b.name);
      return b.netSales - a.netSales;
    });

    return list;
  }, [sellersStats, onlyActive, selectedBranch, searchTerm, sortBy]);

  // Jami hisoblangan foiz (Bonus) summasi
  const totalCommissionSum = useMemo(() => {
    return filteredSellers.reduce((acc, s) => acc + s.bonusSum, 0);
  }, [filteredSellers]);

  // Eng yuqori sotuv qilgan seller (Yetakchi)
  const topSeller = useMemo(() => {
    const sorted = [...sellersStats].filter((s) => s.id !== "unassigned");
    sorted.sort((a, b) => b.netSales - a.netSales);
    return sorted[0]?.netSales > 0 ? sorted[0] : null;
  }, [sellersStats]);

  // Individual stavkani yangilash
  const handleCustomRateChange = (sellerId, value) => {
    const num = Math.max(0, Math.min(100, Number(value) || 0));
    setCustomRates((prev) => ({
      ...prev,
      [sellerId]: num,
    }));
  };

  // Chop etish funksiyasi
  const handlePrint = () => {
    printSellerReport({
      sellers: filteredSellers,
      dateLabel,
      globalCommissionRate: commissionRate,
      totalNetSales,
      totalCommissionSum,
      totalChequesCount,
      selectedBranch,
    });
  };

  // Excel (.xlsx) formatida yuklab olish funksiyasi
  const handleExportExcel = () => {
    exportSellerExcel({
      sellers: filteredSellers,
      dateLabel,
      globalCommissionRate: commissionRate,
      totalNetSales,
      totalCommissionSum,
      totalChequesCount,
      selectedBranch,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-12">
      {/* 1. Yuqori qadalib turuvchi Sarlavha va Asosiy Boshqaruv */}
      <div
        style={{ position: "sticky", top: 0, zIndex: 20 }}
        className={`sticky top-0 z-20 pt-1 pb-2.5 -mt-1 transition-colors backdrop-blur-md ${
          isDarkMode ? "bg-[#02130e]/95" : "bg-[#f4f9f6]/95"
        }`}
      >
        <div
          className={`p-4 sm:p-5 rounded-2xl border transition-colors shadow-md flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39]"
              : "bg-white border-emerald-100"
          }`}
        >
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#065f46] to-emerald-400 flex items-center justify-center text-white text-sm shadow-sm font-bold">
                👥
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                Sellerlar va Sotuv Tahlili
              </h1>
            </div>
            <p
              className={`text-xs mt-1 ${
                isDarkMode ? "text-emerald-200/75" : "text-slate-500"
              }`}
            >
              Belgilangan sanadagi har bir sotuvchining savdosi va kiritilgan foiz bo'yicha bonusi
            </p>
          </div>

          {/* Chop etish, Excel yuklab olish va Yangilash tugmalari */}
          <div className="flex items-center gap-2 self-end lg:self-auto flex-wrap">
            <button
              type="button"
              onClick={handlePrint}
              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border shadow-xs ${
                isDarkMode
                  ? "bg-[#041f17] hover:bg-[#0c3d2e] border-[#0e4b39] text-emerald-200"
                  : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-[#064e3b]"
              }`}
              title="Hisobotni chop etish yoki PDF sifatida saqlash"
            >
              <span>🖨️</span>
              <span className="hidden sm:inline">Chop etish</span>
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition border shadow-xs ${
                isDarkMode
                  ? "bg-[#064e3b] hover:bg-[#08634a] border-emerald-500/50 text-emerald-100"
                  : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700"
              }`}
              title="Sellerlar sotuvi va hisoblangan foizlarini Excel (.xlsx) faylida yuklab olish"
            >
              <span>📊</span>
              <span>Excel yuklab olish</span>
            </button>

            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition border shadow-xs ${
                isDarkMode
                  ? "bg-[#064e3b] hover:bg-[#08634a] border-[#0e4b39] text-white"
                  : "bg-[#064e3b] hover:bg-[#053d2e] text-white border-emerald-900"
              }`}
            >
              <span className={loading ? "animate-spin" : ""}>🔄</span>
              <span>{loading ? "Yuklanmoqda..." : "Yangilash"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SANA VA FOIZ STAVKASI BOSHQARUV BLOKI (Asosiy talab) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sana tanlash paneli (7 ustun) */}
        <div
          className={`lg:col-span-7 p-4 sm:p-5 rounded-2xl border transition-colors shadow-sm space-y-3.5 ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39]"
              : "bg-white border-emerald-100"
          }`}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-xs uppercase tracking-wider font-bold opacity-80 flex items-center gap-1.5">
              <span>📅</span>
              <span>Sotuv sanasini belgilash</span>
            </label>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                isDarkMode
                  ? "bg-[#041f17] text-emerald-300 border border-[#0e4b39]"
                  : "bg-emerald-50 text-[#064e3b] border border-emerald-200"
              }`}
            >
              {dateLabel}
            </span>
          </div>

          {/* Tezkor sana tugmalari */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "today", label: "Bugun" },
              { id: "yesterday", label: "Kecha" },
              { id: "last3", label: "3 kun" },
              { id: "last7", label: "7 kun" },
              { id: "thisMonth", label: "Shu oy" },
              { id: "month", label: "Oylar" },
              { id: "custom", label: "Oraliq sana" },
            ].map((m) => {
              const active = dateMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setDateMode(m.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    active
                      ? isDarkMode
                        ? "bg-[#065f46] text-white shadow-xs"
                        : "bg-[#064e3b] text-white shadow-xs"
                      : isDarkMode
                      ? "bg-[#041f17] text-emerald-200/70 hover:text-white hover:bg-[#0c3d2e]"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {m.label}
                </button>
              );
            })}
          </div>

          {/* Aniq sana yoki oraliq kiritish */}
          {dateMode === "custom" ? (
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <span className="text-[11px] opacity-60 block mb-1">
                  Boshlang'ich sana:
                </span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs transition border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? "bg-[#041f17] border-[#0e4b39] text-white"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>
              <div>
                <span className="text-[11px] opacity-60 block mb-1">
                  Yakuniy sana:
                </span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-xs transition border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                    isDarkMode
                      ? "bg-[#041f17] border-[#0e4b39] text-white"
                      : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>
            </div>
          ) : dateMode === "month" ? (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs opacity-70 whitespace-nowrap">
                Oy tanlash:
              </span>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className={`px-3 py-1.5 rounded-xl text-xs transition border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDarkMode
                    ? "bg-[#041f17] border-[#0e4b39] text-white"
                    : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs opacity-70 whitespace-nowrap">
                Aniq sana tanlash:
              </span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setDateMode("specific");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs transition border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                  isDarkMode
                    ? "bg-[#041f17] border-[#0e4b39] text-white"
                    : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              />
            </div>
          )}
        </div>

        {/* FOIZ STAVKASI HISOB-KITOBI (Foydalanuvchi son yozsa foiz hisoblash) */}
        <div
          className={`lg:col-span-5 p-4 sm:p-5 rounded-2xl border transition-colors shadow-sm space-y-3.5 ${
            isDarkMode
              ? "bg-gradient-to-br from-[#072f23] to-[#041f17] border-amber-500/30"
              : "bg-gradient-to-br from-amber-50/60 to-white border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wider font-extrabold flex items-center gap-1.5 text-amber-500">
              <span>⚡</span>
              <span>Sotuvdan foiz (Bonus stavkasi)</span>
            </label>
            <span
              className={`text-xs px-2 py-0.5 rounded-md font-bold ${
                isDarkMode
                  ? "bg-amber-400/20 text-amber-300"
                  : "bg-amber-100 text-amber-900"
              }`}
            >
              Formula: (Sof sotuv × {commissionRate}%)
            </span>
          </div>

          {/* Asosiy Foiz Kiritish Inputi */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={commissionRate}
                onChange={(e) => setCommissionRate(Math.max(0, Number(e.target.value)))}
                placeholder="Masalan: 2 yoki 3"
                className={`w-full pl-4 pr-10 py-2.5 rounded-xl text-base font-extrabold transition border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                  isDarkMode
                    ? "bg-[#031812] border-amber-500/40 text-amber-300 placeholder-amber-400/30"
                    : "bg-white border-amber-300 text-amber-900 placeholder-amber-200"
                }`}
              />
              <span className="absolute right-3.5 top-2.5 font-extrabold text-amber-400">
                %
              </span>
            </div>

            {/* Tezkor foiz tugmalari */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 5, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCommissionRate(num)}
                  className={`px-2 py-2 rounded-lg text-xs font-bold transition border ${
                    commissionRate === num
                      ? "bg-amber-500 text-white border-amber-600 shadow-xs"
                      : isDarkMode
                      ? "bg-[#041f17] border-[#0e4b39] text-amber-200 hover:bg-amber-950/40"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-amber-50"
                  }`}
                >
                  {num}%
                </button>
              ))}
            </div>
          </div>

          {/* Jami to'lanadigan bonus xulosasi */}
          <div
            className={`p-3 rounded-xl border flex items-center justify-between ${
              isDarkMode
                ? "bg-[#041f17]/90 border-amber-500/20"
                : "bg-amber-100/50 border-amber-200"
            }`}
          >
            <div>
              <p className="text-[11px] opacity-75 font-medium">
                Jami to'lanishi kerak bo'lgan foiz:
              </p>
              <p className="text-base sm:text-lg font-extrabold text-amber-400 mt-0.5">
                {formatMoney(totalCommissionSum, "UZS")}
              </p>
            </div>
            <span className="text-xl">💰</span>
          </div>
        </div>
      </div>

      {/* 3. ASOSIY STATISTIKA KARTALARI */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Jami sof sotuv */}
        <div
          className={`p-4 rounded-2xl border transition shadow-sm ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39]"
              : "bg-white border-emerald-100"
          }`}
        >
          <div className="flex items-center justify-between opacity-75 text-xs font-medium">
            <span>Jami sof sotuv</span>
            <span>💵</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold mt-1 text-emerald-400">
            {formatMoney(totalNetSales, "UZS")}
          </p>
          <p className="text-[10px] opacity-60 mt-1">
            Qaytarishlar ayrilgan holda
          </p>
        </div>

        {/* Jami foiz / bonus */}
        <div
          className={`p-4 rounded-2xl border transition shadow-sm ${
            isDarkMode
              ? "bg-[#072f23] border-amber-500/40"
              : "bg-amber-50/60 border-amber-200"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-amber-400">
            <span>Jami bonus ({commissionRate}%)</span>
            <span>🎁</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold mt-1 text-amber-400">
            {formatMoney(totalCommissionSum, "UZS")}
          </p>
          <p className="text-[10px] opacity-65 mt-1">
            Sellerlarga ajratiladigan ulush
          </p>
        </div>

        {/* Faol sellerlar */}
        <div
          className={`p-4 rounded-2xl border transition shadow-sm ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39]"
              : "bg-white border-emerald-100"
          }`}
        >
          <div className="flex items-center justify-between opacity-75 text-xs font-medium">
            <span>Sotuv qilgan sellerlar</span>
            <span>👤</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold mt-1">
            {filteredSellers.filter((s) => s.netSales > 0).length} nafar
          </p>
          <p className="text-[10px] opacity-60 mt-1">
            Jami {usersList.length} ta xodimdan
          </p>
        </div>

        {/* Cheklar soni */}
        <div
          className={`p-4 rounded-2xl border transition shadow-sm ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39]"
              : "bg-white border-emerald-100"
          }`}
        >
          <div className="flex items-center justify-between opacity-75 text-xs font-medium">
            <span>Jami cheklar soni</span>
            <span>🧾</span>
          </div>
          <p className="text-lg sm:text-xl font-extrabold mt-1">
            {totalChequesCount} ta
          </p>
          <p className="text-[10px] opacity-60 mt-1">
            Qaytarish: {sellersStats.reduce((acc, s) => acc + s.returnsCount, 0)} ta
          </p>
        </div>

        {/* Top seller */}
        <div
          className={`col-span-2 sm:col-span-2 lg:col-span-1 p-4 rounded-2xl border transition shadow-sm ${
            isDarkMode
              ? "bg-gradient-to-tr from-[#065f46] to-[#072f23] border-emerald-500/40 text-white"
              : "bg-emerald-50/80 border-emerald-200 text-[#064e3b]"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold">
            <span>🏆 Yetakchi seller</span>
            <span>🥇</span>
          </div>
          <p className="text-sm font-extrabold mt-1 truncate">
            {topSeller ? topSeller.name : "Aniqlanmadi"}
          </p>
          <p className="text-xs font-bold text-emerald-300 mt-0.5">
            {topSeller ? formatMoney(topSeller.netSales, "UZS") : "0 UZS"}
          </p>
        </div>
      </div>

      {/* 4. FILTR VA QIDIRUV PANELI */}
      <div
        className={`p-3.5 sm:p-4 rounded-2xl border transition shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
          isDarkMode
            ? "bg-[#072f23] border-[#0e4b39]"
            : "bg-white border-emerald-100"
        }`}
      >
        {/* Qidiruv input */}
        <div className="relative flex-1 md:max-w-xs">
          <input
            type="text"
            placeholder="Seller ismi, kodi yoki login..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm transition focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isDarkMode
                ? "bg-[#041f17] border border-[#0e4b39] text-white placeholder-emerald-200/40"
                : "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white"
            }`}
          />
          <span className="absolute left-3 top-2.5 text-xs opacity-50">🔍</span>
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filial va saralash dropdownlari */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filial filter */}
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isDarkMode
                ? "bg-[#041f17] border-[#0e4b39] text-white"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <option value="all">Barcha filiallar ({branchesList.length})</option>
            {branchesList.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Saralash */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition border focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
              isDarkMode
                ? "bg-[#041f17] border-[#0e4b39] text-white"
                : "bg-slate-50 border-slate-200 text-slate-800"
            }`}
          >
            <option value="net_sales_desc">Sof sotuv (kamayish)</option>
            <option value="net_sales_asc">Sof sotuv (o'sish)</option>
            <option value="bonus_desc">Bonus summasi (kamayish)</option>
            <option value="cheques_desc">Cheklar soni (kamayish)</option>
            <option value="name_asc">Ism bo'yicha (A-Z)</option>
          </select>

          {/* Faqat sotuv qilganlar tugmasi */}
          <button
            type="button"
            onClick={() => setOnlyActive(!onlyActive)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${
              onlyActive
                ? isDarkMode
                  ? "bg-[#064e3b] border-[#0e4b39] text-white"
                  : "bg-emerald-100 border-emerald-300 text-emerald-900"
                : isDarkMode
                ? "bg-[#041f17] border-[#0e4b39] text-emerald-200/50"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {onlyActive ? "✓ Faqat sotuv qilganlar" : "Barcha sellerlar"}
          </button>
        </div>
      </div>

      {/* 5. SELLERLAR JADVALI */}
      {loading ? (
        <div
          className={`p-16 text-center rounded-2xl border ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-emerald-200/70"
              : "bg-white border-emerald-100 text-slate-500"
          }`}
        >
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mb-3"></div>
          <p className="text-sm font-medium">
            REGOS API dan sellerlar va cheklar yuklanmoqda...
          </p>
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
                  <th className="py-3.5 px-4 w-12 text-center">№</th>
                  <th className="py-3.5 px-4">Sotuvchi (Seller)</th>
                  <th className="py-3.5 px-4">Filial / Guruh</th>
                  <th className="py-3.5 px-4 text-center">Cheklar</th>
                  <th className="py-3.5 px-4 text-right">Jami sotuv</th>
                  <th className="py-3.5 px-4 text-right">Qaytarish</th>
                  <th className="py-3.5 px-4 text-right">Sof sotuv</th>
                  <th className="py-3.5 px-4 text-center w-36">Ulush</th>
                  <th className="py-3.5 px-4 text-center w-24">Foiz (%)</th>
                  <th className="py-3.5 px-4 text-right">Hisoblangan bonus</th>
                  <th className="py-3.5 px-4 text-center w-24"></th>
                </tr>
              </thead>
              <tbody
                className={`divide-y text-xs sm:text-sm ${
                  isDarkMode ? "divide-[#0e4b39]/60" : "divide-slate-100"
                }`}
              >
                {filteredSellers.length > 0 ? (
                  filteredSellers.map((seller, idx) => {
                    const isTop1 = idx === 0 && seller.netSales > 0;
                    const isTop2 = idx === 1 && seller.netSales > 0;
                    const isTop3 = idx === 2 && seller.netSales > 0;

                    return (
                      <tr
                        key={seller.id || idx}
                        className={`transition ${
                          isDarkMode
                            ? "hover:bg-[#0c3d2e]/80 text-slate-200"
                            : "hover:bg-emerald-50/60 text-slate-800"
                        }`}
                      >
                        {/* O'rin / Rank */}
                        <td className="py-3 px-4 text-center">
                          {isTop1 ? (
                            <span className="text-base" title="1-o'rin">
                              🥇
                            </span>
                          ) : isTop2 ? (
                            <span className="text-base" title="2-o'rin">
                              🥈
                            </span>
                          ) : isTop3 ? (
                            <span className="text-base" title="3-o'rin">
                              🥉
                            </span>
                          ) : (
                            <span className="opacity-60 text-xs">
                              {idx + 1}
                            </span>
                          )}
                        </td>

                        {/* Seller ismi va ID */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                isDarkMode
                                  ? "bg-[#041f17] text-emerald-300 border border-[#0e4b39]"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {seller.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold truncate max-w-[180px] sm:max-w-none">
                                {seller.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] opacity-60">
                                {seller.barcode && (
                                  <span className="font-mono">
                                    ID: {seller.barcode}
                                  </span>
                                )}
                                {seller.login && seller.login !== "—" && (
                                  <span>• {seller.login}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Filial */}
                        <td className="py-3 px-4">
                          {seller.group ? (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                                isDarkMode
                                  ? "bg-[#041f17] text-emerald-300 border border-[#0e4b39]"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {seller.group}
                            </span>
                          ) : (
                            <span className="opacity-40">—</span>
                          )}
                        </td>

                        {/* Cheklar soni */}
                        <td className="py-3 px-4 text-center font-medium">
                          <span>{seller.chequesCount} ta</span>
                          {seller.returnsCount > 0 && (
                            <span className="text-[10px] text-rose-400 block">
                              ({seller.returnsCount} qayt.)
                            </span>
                          )}
                        </td>

                        {/* Jami sotuv */}
                        <td className="py-3 px-4 text-right opacity-80 whitespace-nowrap">
                          {formatMoney(seller.totalSales, "UZS")}
                        </td>

                        {/* Qaytarish */}
                        <td
                          className={`py-3 px-4 text-right whitespace-nowrap font-medium ${
                            seller.returnsSum > 0 ? "text-rose-400" : "opacity-40"
                          }`}
                        >
                          {seller.returnsSum > 0
                            ? `-${formatMoney(seller.returnsSum, "UZS")}`
                            : "0"}
                        </td>

                        {/* Sof sotuv */}
                        <td className="py-3 px-4 text-right font-extrabold text-emerald-400 whitespace-nowrap">
                          {formatMoney(seller.netSales, "UZS")}
                        </td>

                        {/* Sotuv ulushi progress bari */}
                        <td className="py-3 px-4">
                          <div className="w-full space-y-1">
                            <div className="flex justify-between text-[11px] font-semibold opacity-75">
                              <span>{seller.sharePercent.toFixed(1)}%</span>
                              <span>{formatMoney(seller.avgCheque)} o'rt.</span>
                            </div>
                            <div
                              className={`w-full h-1.5 rounded-full overflow-hidden ${
                                isDarkMode ? "bg-[#041f17]" : "bg-slate-100"
                              }`}
                            >
                              <div
                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                style={{
                                  width: `${Math.min(100, seller.sharePercent)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Foiz stavkasi (%) - Har bir qator uchun tahrirlash imkoniyati */}
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center justify-center">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={seller.rate}
                              onChange={(e) =>
                                handleCustomRateChange(seller.id, e.target.value)
                              }
                              className={`w-16 px-1.5 py-1 rounded-lg text-center font-bold text-xs transition border focus:outline-none focus:ring-1 focus:ring-amber-500 ${
                                isDarkMode
                                  ? "bg-[#041f17] border-amber-500/30 text-amber-300"
                                  : "bg-amber-50/70 border-amber-300 text-amber-900"
                              }`}
                            />
                            <span className="text-xs ml-1 font-bold opacity-60">
                              %
                            </span>
                          </div>
                        </td>

                        {/* Hisoblangan bonus summasi */}
                        <td className="py-3 px-4 text-right font-extrabold text-amber-400 whitespace-nowrap">
                          {formatMoney(seller.bonusSum, "UZS")}
                        </td>

                        {/* Cheklarni ko'rish */}
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedSeller(seller)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition border ${
                              isDarkMode
                                ? "bg-[#041f17] hover:bg-[#0c3d2e] border-[#0e4b39] text-emerald-300"
                                : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-[#064e3b]"
                            }`}
                          >
                            Cheklar ({seller.cheques.length})
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="11"
                      className="py-12 px-4 text-center text-xs sm:text-sm opacity-60"
                    >
                      Belgilangan mezonlar bo'yicha sellerlar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6. TANLANGAN SELLERNING CHEKLAR MODALI */}
      {selectedSeller && (
        <SellerChequesModal
          seller={selectedSeller}
          dateLabel={dateLabel}
          commissionRate={selectedSeller.rate}
          onClose={() => setSelectedSeller(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
}
