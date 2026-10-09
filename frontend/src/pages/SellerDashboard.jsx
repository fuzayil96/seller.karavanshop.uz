import React, { useEffect, useState } from "react";
import WebApp from "@twa-dev/sdk";
import axios from "axios";
import {
  Trophy,
  Receipt,
  Gift,
  Banknote,
  User as UserIcon,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// Use relative path in production, full URL in development
const API_URL = import.meta.env.DEV ? "http://localhost:3000/api" : "/api";

const CustomDateInput = ({ value, onChange }) => {
  const formattedValue = value
    ? value.split("-").reverse().join(".")
    : "dd.mm.yyyy";
  return (
    <div className="relative flex-1 h-[34px]">
      <input
        type="date"
        value={value}
        onChange={onChange}
        onClick={(e) => {
          try {
            e.target.showPicker();
          } catch (_err) {}
        }}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
      />
      <div className="absolute inset-0 w-full h-full bg-[#041f17] border border-emerald-500/30 rounded-lg p-2 text-xs text-emerald-50 flex justify-between items-center pointer-events-none">
        <span>{formattedValue}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-emerald-500/70"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>
    </div>
  );
};
const pad = (n) => String(n).padStart(2, "0");
const getTodayInfo = () => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
  const thisMonthStr = todayStr.substring(0, 7); // YYYY-MM
  return { todayStr, thisMonthStr };
};

const SellerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fetchError, setFetchError] = useState(null);
  const [dateMode, setDateMode] = useState("day"); // day, month, custom
  const [leaderboardTab, setLeaderboardTab] = useState("group"); // group, overall
  const [notifEnabled, setNotifEnabled] = useState(true);

  // Telegram user ID
  const tgUser =
    WebApp.initDataUnsafe?.user ||
    window.Telegram?.WebApp?.initDataUnsafe?.user;
  const [telegramId, setTelegramId] = useState(tgUser?.id || null);
  const [manualIdInput, _setManualIdInput] = useState("");

  const { todayStr, thisMonthStr } = React.useMemo(() => getTodayInfo(), []);

  const [customStart, setCustomStart] = useState(todayStr);
  const [customEnd, setCustomEnd] = useState(todayStr);
  const [customMonth, _setCustomMonth] = useState(thisMonthStr);
  const [showCashservers, setShowCashservers] = useState(false);

  // Modals
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [chequeItems, setChequeItems] = useState([]);
  const [chequeLoading, setChequeLoading] = useState(false);

  const fetchStats = async (mode) => {
    setLoading(true);
    let startDate, endDate;

    if (mode === "day") {
      startDate = customStart;
      endDate = startDate;
    } else if (mode === "month") {
      const parts = customMonth.split("-"); // e.g. '2026-10'
      const year = parseInt(parts[0]);
      const monthIndex = parseInt(parts[1]) - 1;
      const endOfMonth = new Date(year, monthIndex + 1, 0); // Last day of month

      startDate = `${year}-${pad(monthIndex + 1)}-01`;
      endDate = `${year}-${pad(monthIndex + 1)}-${pad(endOfMonth.getDate())}`;
    } else if (mode === "custom") {
      startDate = customStart;
      endDate = customEnd;
    } else {
      // fallback 'today'
      startDate = todayStr;
      endDate = todayStr;
    }

    try {
      setFetchError(null);
      const res = await axios.get(`${API_URL}/webapp/stats/${telegramId}`, {
        params: { startDate, endDate },
      });
      setData(res.data);
      setNotifEnabled(res.data.user.notificationsEnabled);
    } catch (err) {
      if (err.response?.status === 403) {
        setError(err.response?.data?.error || "Xatolik yuz berdi");
      } else {
        setFetchError(err.response?.data?.error || "Xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Notify Telegram that the Web App is ready
    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    } catch (e) {
      console.log("WebApp init error:", e);
    }
  }, []);

  useEffect(() => {
    if (telegramId) {
      fetchStats(dateMode);
    } else {
      setLoading(false); // allow manual input
    }
  }, [dateMode, telegramId]);

  const handleDateModeChange = (mode) => {
    setDateMode(mode);
    fetchStats(mode);
  };

  const handleNotifToggle = async (e) => {
    const enabled = e.target.checked;
    setNotifEnabled(enabled);
    try {
      await axios.post(`${API_URL}/webapp/notifications/${telegramId}`, {
        enabled,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const _handleManualLogin = () => {
    if (manualIdInput) {
      setTelegramId(parseInt(manualIdInput));
    }
  };

  const fetchChequeDetails = async (uuid) => {
    if (!data.settings?.showChequeDetails) return;
    setChequeLoading(true);
    setChequeItems([]);
    try {
      const res = await axios.get(`${API_URL}/webapp/cheque-items/${uuid}`);
      setChequeItems(res.data?.result || []);
    } catch (err) {
      console.error(err);
    } finally {
      setChequeLoading(false);
    }
  };

  const openCheque = (c) => {
    if (!data.settings?.showChequeDetails) return;
    setSelectedCheque(c);
    fetchChequeDetails(c.id); // 'id' contains uuid in api.js
  };

  if (!telegramId && !error) {
    return (
      <div className="flex items-center justify-center h-screen p-4 text-center">
        <div className="bg-[#072f23] border border-[#0e4b39] p-6 rounded-2xl w-full max-w-sm shadow-xl">
          <h2 className="text-emerald-400 font-bold text-xl mb-2">
            Ruxsat yo'q
          </h2>
          <p className="text-emerald-100/70 text-sm mb-4">
            Iltimos, ushbu ilovaga faqat Telegram bot orqali kiring.
          </p>

          {/* <div className="mt-4 flex flex-col gap-2">
            <input 
              type="text" 
              placeholder="Test uchun Telegram ID..." 
              value={manualIdInput}
              onChange={(e) => _setManualIdInput(e.target.value)}
              className="bg-[#041f17] border border-emerald-500/30 rounded-lg p-2 text-emerald-50 text-sm focus:outline-none focus:border-emerald-500"
            />
            <button 
              onClick={_handleManualLogin}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg transition-colors text-sm"
            >
              Test qilish (Kirish)
            </button>
          </div> */}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen p-4 text-center">
        <div className="bg-[#072f23] border border-[#0e4b39] p-6 rounded-2xl w-full max-w-sm">
          <h2 className="text-red-400 font-bold text-xl mb-2">
            Kirish taqiqlangan
          </h2>
          <p className="text-emerald-100/70">{error}</p>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        <p className="text-emerald-400 font-semibold animate-pulse">
          Ma'lumotlar yuklanmoqda...
        </p>
      </div>
    );
  }

  if (!data) return null;

  const isTodayView =
    (dateMode === "day" && customStart === todayStr) ||
    (dateMode === "custom" &&
      customStart === todayStr &&
      customEnd === todayStr);

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 pb-8">
      {/* Header Profile Card */}
      <div className="bg-gradient-to-br from-[#065f46]/20 to-[#10b981]/10 border border-emerald-500/20 p-5 rounded-2xl flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center border border-[#8b5cf6]/30">
          <UserIcon className="w-6 h-6 text-[#8b5cf6]" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-emerald-50">
            {data.user.sellerName || `Sotuvchi #${data.user.sellerId}`}
          </h1>
          
        </div>
      </div>

      {fetchError && (
        <div className="bg-red-900/40 border border-red-500/50 text-red-300 text-xs p-3 rounded-xl font-medium animate-pulse">
          ⚠️ {fetchError}
        </div>
      )}

      {/* Date Filters */}
      <div className="bg-[#041f17]/50 p-2 rounded-xl flex flex-wrap gap-2">
        {[
          { id: "day", label: "Bugun" },
          { id: "custom", label: "Oraliq" },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleDateModeChange(mode.id)}
            className={`flex-1 min-w-[70px] py-2 text-xs font-semibold rounded-lg transition-all ${
              dateMode === mode.id
                ? "bg-[#3b82f6] text-white shadow-md"
                : "text-emerald-100/60 hover:text-emerald-50 hover:bg-emerald-900/30"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Custom Date Inputs */}
      {dateMode === "day" && (
        <div className="flex gap-2 items-center bg-[#072f23] p-3 rounded-xl border border-[#0e4b39]">
          <span className="text-xs text-emerald-100/60 font-semibold whitespace-nowrap">
            Aniq sana tanlash:
          </span>
          <CustomDateInput
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
          />
          <button
            onClick={() => fetchStats("day")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold"
          >
            OK
          </button>
        </div>
      )}

      {dateMode === "custom" && (
        <div className="bg-[#072f23] p-3 rounded-xl border border-[#0e4b39] flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs text-emerald-100/60 font-semibold mb-1">
            <span>Boshlang'ich sana:</span>
            <span>Yakuniy sana:</span>
          </div>
          <div className="flex gap-2">
            <CustomDateInput
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
            />
            <CustomDateInput
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
            />
          </div>
          <button
            onClick={() => fetchStats("custom")}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-xs font-bold w-full"
          >
            Qo'llash
          </button>
        </div>
      )}

      {loading && data && (
        <div className="text-center py-2 text-emerald-400 text-xs font-bold animate-pulse">
          Yangilanmoqda...
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Jami Savdo */}
        <div className="bg-[#072f23] border border-[#0e4b39] p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl -mr-4 -mt-4"></div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-emerald-100/60 tracking-wider">
              JAMI SAVDO
            </span>
            <Banknote className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-extrabold text-2xl text-emerald-400">
            {!isTodayView && data.settings?.allowPastDates === false
              ? "***"
              : data.totalSales.toLocaleString("uz-UZ")}
          </div>
          <div className="text-[10px] text-emerald-100/40 mt-1">UZS</div>
        </div>

        {/* Bonus */}
        <div className="bg-[#1f2937]/50 border border-gray-700 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl -mr-4 -mt-4"></div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-amber-500/80 tracking-wider">
              SIZNING BONUS
            </span>
            <Gift className="w-4 h-4 text-amber-500" />
          </div>
          <div className="font-extrabold text-2xl text-amber-500">
            {data.bonus.toLocaleString("uz-UZ")}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">UZS</div>
        </div>

        {/* Cheklar */}
        <div className="bg-[#1e1e2f]/50 border border-gray-700/50 p-4 rounded-2xl">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">
              CHEKLAR
            </span>
            <Receipt className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-extrabold text-2xl text-gray-100">
            {data.salesCount}
          </div>
        </div>

        {/* Reyting */}
        <div className="bg-[#1e1e2f]/50 border border-gray-700/50 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl -mr-4 -mt-4"></div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-gray-400 tracking-wider">
              REYTING
            </span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-1">
              <span className="font-extrabold text-xl text-gray-100">
                #{data.groupRank}
              </span>
              <span className="text-[10px] text-gray-500 font-bold mb-0.5">
                / filial
              </span>
            </div>
            <div className="flex items-end gap-1">
              <span className="font-extrabold text-lg text-gray-300">
                #{data.overallRank}
              </span>
              <span className="text-[9px] text-gray-600 font-bold mb-0.5">
                / umumiy
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cashservers Sync Status */}
      <div className="bg-[#1e1e2f]/30 border border-gray-800 p-4 rounded-3xl mt-2">
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowCashservers(!showCashservers)}
        >
          <h3 className="font-bold text-gray-200 flex items-center gap-2 text-sm">
            <span className={`w-2 h-2 rounded-full ${data.cashservers?.length ? 'bg-emerald-500 animate-pulse' : 'bg-gray-500'}`}></span> 
            Kassa holati ({data.user?.groupName || 'Barchasi'})
          </h3>
          <button className="text-gray-400 hover:text-white transition">
            {showCashservers ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
        
        {showCashservers && (
          <div className="space-y-2 mt-4 pt-4 border-t border-gray-800">
            {(!data.cashservers || data.cashservers.length === 0) ? (
              <p className="text-xs text-gray-400 text-center">Kassalar ma'lumoti topilmadi...</p>
            ) : (() => {
              const gnWords = (data.user?.groupName || "").toLowerCase()
                .replace(/ҳ/g, 'х').replace(/қ/g, 'к').replace(/ғ/g, 'г').replace(/ислик/g, 'истик')
                .split(' ')
                .filter(w => w.length > 2);
              
              let matched = data.cashservers.filter(cs => {
                const cn = (cs.name || "").toLowerCase().replace(/ҳ/g, 'х').replace(/қ/g, 'к').replace(/ғ/g, 'г');
                if (gnWords.length === 0) return true;
                return gnWords.every(w => cn.includes(w));
              });
              
              if (matched.length === 0) matched = data.cashservers; // fallback

              return matched.map(cs => {
                const date = new Date(cs.last_sync * 1000);
                const isOnline = (Date.now() - date.getTime()) < 3600000 * 2; // < 2 hours green
                return (
                  <div key={cs.id} className="flex justify-between items-center bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-xs font-semibold text-gray-300">{cs.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {date.toLocaleString('uz-UZ', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* History List */}
      <div className="bg-[#1e1e2f]/30 border border-gray-800 p-5 rounded-3xl mt-2">
        <h3 className="font-bold text-gray-200 mb-4 flex items-center gap-2">
          📜 Savdolar Tarixi
        </h3>
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
          {!data.cheques || data.cheques.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-4">
              Hozircha savdolar yo'q
            </p>
          ) : (
            data.cheques.map((c) => (
              <div
                key={c.id}
                onClick={() => openCheque(c)}
                className={`flex justify-between items-center bg-white/5 p-3 rounded-xl transition ${data.settings?.showChequeDetails ? "cursor-pointer hover:bg-white/10" : ""}`}
              >
                <div>
                  <div className="font-semibold text-sm text-gray-200 flex items-center gap-2">
                    Chek #{c.code || c.number}
                    {c.isReturn && (
                      <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                        QAYTARISH
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {new Date(c.date * 1000).toLocaleString("uz-UZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div
                    className={`font-bold text-sm ${c.isReturn ? "text-red-400" : "text-emerald-400"}`}
                  >
                    {c.isReturn ? "-" : "+"}
                    {Math.abs(Number(c.amount)).toLocaleString("uz-UZ")} UZS
                  </div>
                  {c.bonus > 0 && !c.isReturn && (
                    <div className="text-[10px] text-amber-400 font-medium">
                      +{Number(c.bonus).toLocaleString("uz-UZ")} UZS bonus
                    </div>
                  )}
                  {c.bonus < 0 && c.isReturn && (
                    <div className="text-[10px] text-red-400/80 font-medium">
                      {Number(c.bonus).toLocaleString("uz-UZ")} UZS bonus
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Leaderboard */}
      {data.settings?.showLeaderboard &&
        (data.groupLeaderboard || data.overallLeaderboard) && (
          <div className="bg-[#1e1e2f]/30 border border-gray-800 p-5 rounded-3xl mt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-200 flex items-center gap-2">
                🏆 Reyting
              </h3>
              <div className="flex bg-black/40 p-1 rounded-lg gap-1">
                <button
                  onClick={() => setLeaderboardTab("group")}
                  className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${leaderboardTab === "group" ? "bg-amber-500/20 text-amber-400" : "text-gray-500 hover:text-gray-300"}`}
                >
                  FILIAL
                </button>
                <button
                  onClick={() => setLeaderboardTab("overall")}
                  className={`text-[10px] px-2 py-1 rounded-md font-bold transition-all ${leaderboardTab === "overall" ? "bg-amber-500/20 text-amber-400" : "text-gray-500 hover:text-gray-300"}`}
                >
                  UMUMIY
                </button>
              </div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
              {(leaderboardTab === "group"
                ? data.groupLeaderboard
                : data.overallLeaderboard
              )?.map((seller, index) => {
                const isMe = seller.sellerId == data.user.sellerId;
                return (
                  <div
                    key={seller.sellerId}
                    className={`flex items-center justify-between p-3 rounded-xl border ${isMe ? "bg-amber-500/20 border-amber-500/50 shadow-inner" : "bg-black/20 border-gray-800/50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-black text-sm w-5 text-center ${index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-300" : index === 2 ? "text-orange-400" : "text-gray-600"}`}
                      >
                        {index + 1}
                      </span>
                      <div className="flex flex-col">
                        <span
                          className={`font-semibold text-sm ${isMe ? "text-amber-100" : "text-gray-300"}`}
                        >
                          {seller.name} {isMe && "(Siz)"}
                        </span>
                        {data.settings?.showLeaderboardGroups !== false &&
                          leaderboardTab === "overall" &&
                          seller.groupName && (
                            <span className="text-[10px] text-emerald-500/60 font-medium tracking-wide mt-0.5">
                              {seller.groupName}
                            </span>
                          )}
                      </div>
                    </div>
                    <span
                      className={`font-bold text-xs ${isMe ? "text-amber-400" : "text-emerald-400/80"}`}
                    >
                      {data.settings?.showLeaderboardSales !== false
                        ? Number(seller.sales).toLocaleString("uz-UZ")
                        : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Notifications Toggle */}
      <div className="bg-[#1e1e2f]/30 border border-gray-800 p-4 rounded-2xl flex justify-between items-center mt-2">
        <div>
          <h3 className="font-bold text-sm text-gray-200">Xabarnomalar</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Yangi savdo haqida xabar qabul qilish
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={notifEnabled}
            onChange={handleNotifToggle}
          />
          <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
        </label>
      </div>

      {/* Cheque Modal */}
      {selectedCheque && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#072f23] border border-[#0e4b39] w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-[#0e4b39] flex justify-between items-center bg-[#041f17]">
              <div>
                <h3 className="font-bold text-emerald-50">
                  Chek #{selectedCheque.code || selectedCheque.number}
                </h3>
                <p className="text-xs text-emerald-100/50 mt-1">
                  {new Date(selectedCheque.date * 1000).toLocaleString(
                    "uz-UZ",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "2-digit",
                      month: "short",
                    },
                  )}
                </p>
              </div>
              <button
                onClick={() => setSelectedCheque(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              >
                ✕
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto">
              {chequeLoading ? (
                <div className="py-10 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-3"></div>
                  <p className="text-emerald-400 text-sm">
                    Tovarlar yuklanmoqda...
                  </p>
                </div>
              ) : chequeItems.length > 0 ? (
                <div className="space-y-3">
                  {(() => {
                    const canceledIndices = new Set();
                    const positiveMap = new Map();
                    chequeItems.forEach((it, i) => {
                      const qty = Number(it.quantity || 1);
                      if (qty > 0) {
                        const name = it.item?.name || it.name || it.item_name || "Mahsulot";
                        const price = Math.abs(Number(it.price || it.cost || 0));
                        const key = `${name}_${price}`;
                        if (!positiveMap.has(key)) positiveMap.set(key, []);
                        positiveMap.get(key).push(i);
                      }
                    });
                    chequeItems.forEach((it, i) => {
                      const qty = Number(it.quantity || 1);
                      if (qty < 0) {
                        canceledIndices.add(i);
                        const name = it.item?.name || it.name || it.item_name || "Mahsulot";
                        const price = Math.abs(Number(it.price || it.cost || 0));
                        const key = `${name}_${price}`;
                        const posList = positiveMap.get(key);
                        if (posList && posList.length > 0) {
                          canceledIndices.add(posList.pop());
                        }
                      }
                    });

                    return chequeItems.map((it, idx) => {
                      const isCanceled = canceledIndices.has(idx);
                      return (
                        <div
                          key={idx}
                          className={`flex justify-between items-center border-b border-emerald-500/10 pb-3 last:border-0 last:pb-0 ${isCanceled ? "opacity-60 line-through" : ""}`}
                        >
                          <div>
                            <p className={`text-sm font-medium ${isCanceled ? "text-red-300" : "text-emerald-50"}`}>
                              {it.item?.name ||
                                it.name ||
                                it.item_name ||
                                "Mahsulot"}
                            </p>
                            <p className="text-[11px] text-emerald-100/50 mt-0.5">
                              {Number(it.quantity || 1)} dona ×{" "}
                              {Number(it.price || it.cost || 0).toLocaleString(
                                "uz-UZ",
                              )}{" "}
                              UZS
                            </p>
                          </div>
                          <div className={`text-sm font-bold ${isCanceled ? "text-red-400" : "text-emerald-400"}`}>
                            {Number(
                              it.amount ||
                                it.total ||
                                Number(it.quantity || 1) * Number(it.price || 0),
                            ).toLocaleString("uz-UZ")}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              ) : (
                <div className="text-center text-emerald-100/50 text-sm py-6">
                  Tovarlar topilmadi.
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#0e4b39] bg-[#041f17] flex justify-between items-center">
              <span className="text-xs text-emerald-100/60 font-semibold">
                Jami summa:
              </span>
              <span
                className={`font-black text-lg ${selectedCheque.isReturn ? "text-red-400" : "text-emerald-400"}`}
              >
                {Math.abs(Number(selectedCheque.amount)).toLocaleString(
                  "uz-UZ",
                )}{" "}
                UZS
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;
