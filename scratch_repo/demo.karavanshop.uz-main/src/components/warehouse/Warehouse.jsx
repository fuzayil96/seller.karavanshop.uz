import { useEffect, useState, useMemo } from "react";
import getData from "../../utils/getData";
import { formatMoney } from "../../utils/formatters";

export default function Warehouse({ isDarkMode }) {
  const [activeTab, setActiveTab] = useState("purchases"); // "purchases" | "movements" | "inventory"
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStockId, setSelectedStockId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const [purchases, setPurchases] = useState([]);
  const [movements, setMovements] = useState([]);
  const [inventories, setInventories] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Filiallar va Hujjatlarni yuklash
  async function loadWarehouseData(showLoading = true) {
    try {
      if (showLoading) setLoading(true);
      setRefreshing(true);

      const [stockRes, purchRes, moveRes, invRes] = await Promise.all([
        getData({ url: "/stock/get", reqData: {} }).catch(() => null),
        getData({ url: "/docpurchase/get", reqData: {} }).catch(() => null),
        getData({ url: "/docmovement/get", reqData: {} }).catch(() => null),
        getData({ url: "/docinventory/get", reqData: {} }).catch(() => null),
      ]);

      if (Array.isArray(stockRes?.result)) {
        setStocks(stockRes.result.filter((s) => s?.name && s.name !== "---"));
      }
      setPurchases(Array.isArray(purchRes?.result) ? purchRes.result : []);
      setMovements(Array.isArray(moveRes?.result) ? moveRes.result : []);
      setInventories(Array.isArray(invRes?.result) ? invRes.result : []);
    } catch (err) {
      console.error("Ombor ma'lumotlarini yuklashda xatolik:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadWarehouseData(true);
  }, []);

  // Filtrlangan Kirim hujjatlari
  const filteredPurchases = useMemo(() => {
    return purchases.filter((item) => {
      const matchStock =
        selectedStockId === "all" || String(item?.stock?.id) === String(selectedStockId);
      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "performed" && item.performed) ||
        (selectedStatus === "draft" && !item.performed);

      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        (item?.code || "").toLowerCase().includes(term) ||
        (item?.partner?.name || "").toLowerCase().includes(term) ||
        (item?.description || "").toLowerCase().includes(term);

      return matchStock && matchStatus && matchSearch;
    });
  }, [purchases, selectedStockId, selectedStatus, searchTerm]);

  // Filtrlangan Filiallararo ko'chirishlar
  const filteredMovements = useMemo(() => {
    return movements.filter((item) => {
      const matchStock =
        selectedStockId === "all" ||
        String(item?.stock_sender?.id) === String(selectedStockId) ||
        String(item?.stock_receiver?.id) === String(selectedStockId);
      const matchStatus =
        selectedStatus === "all" ||
        (selectedStatus === "performed" && item.performed) ||
        (selectedStatus === "draft" && !item.performed);

      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        (item?.code || "").toLowerCase().includes(term) ||
        (item?.stock_sender?.name || "").toLowerCase().includes(term) ||
        (item?.stock_receiver?.name || "").toLowerCase().includes(term) ||
        (item?.description || "").toLowerCase().includes(term);

      return matchStock && matchStatus && matchSearch;
    });
  }, [movements, selectedStockId, selectedStatus, searchTerm]);

  // Jami kirim summasi
  const totalPurchaseSum = useMemo(() => {
    return filteredPurchases.reduce((acc, p) => acc + Number(p.amount || 0), 0);
  }, [filteredPurchases]);

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
              Ombor & Logistika Moduli
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-xs text-emerald-400 font-semibold">REGOS Documents API</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Ombor Hujjatlari va Harakatlar
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? "text-emerald-200/70" : "text-slate-500"}`}>
            Tovarlar qabuli (Kirim), filiallararo ko'chirishlar (Peremeshcheniye) va inventarizatsiya registri.
          </p>
        </div>

        <button
          onClick={() => loadWarehouseData(false)}
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
          <span>{refreshing ? "Yangilanmoqda..." : "Hujjatlarni yangilash"}</span>
        </button>
      </div>

      {/* Top 3 KPI Kartochkalari */}
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
              Jami Kirim Hujjatlari
            </span>
            <span className="text-2xl">📥</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2">
            {loading ? "..." : `${purchases.length.toLocaleString()} ta`}
          </div>
          <div className="text-xs mt-2 opacity-85 truncate">
            Filtr bo'yicha summa: <b>{formatMoney(totalPurchaseSum, "UZS")}</b>
          </div>
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
              Filiallararo Ko'chirish
            </span>
            <span className="text-2xl">🔄</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 text-sky-400">
            {loading ? "..." : `${movements.length.toLocaleString()} ta`}
          </div>
          <div className="text-xs mt-2 opacity-70">
            Do'konlar o'rtasida tovar almashinuvi
          </div>
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
              Inventarizatsiyalar
            </span>
            <span className="text-2xl">📋</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black mt-2 text-amber-400">
            {loading ? "..." : `${inventories.length} ta`}
          </div>
          <div className="text-xs mt-2 opacity-70">
            Ombordagi tovarlar qayta hisobi
          </div>
        </div>
      </div>

      {/* Tablar va Filtrlash Paneli */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Tab tugmalari */}
        <div
          className={`p-1 rounded-2xl border flex flex-wrap gap-1 ${
            isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-100 border-slate-200"
          }`}
        >
          <button
            onClick={() => setActiveTab("purchases")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "purchases"
                ? isDarkMode
                  ? "bg-[#065f46] text-white shadow-sm"
                  : "bg-white text-emerald-800 shadow-sm"
                : isDarkMode
                ? "text-emerald-200/70 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📥</span>
            <span>Kirim Hujjatlari ({purchases.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("movements")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "movements"
                ? isDarkMode
                  ? "bg-[#065f46] text-white shadow-sm"
                  : "bg-white text-emerald-800 shadow-sm"
                : isDarkMode
                ? "text-emerald-200/70 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🔄</span>
            <span>Tovar Ko'chirish ({movements.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "inventory"
                ? isDarkMode
                  ? "bg-[#065f46] text-white shadow-sm"
                  : "bg-white text-emerald-800 shadow-sm"
                : isDarkMode
                ? "text-emerald-200/70 hover:text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📋</span>
            <span>Inventarizatsiya ({inventories.length})</span>
          </button>
        </div>

        {/* Filtrlar: Filial, Holat, Qidiruv */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filial */}
          <select
            value={selectedStockId}
            onChange={(e) => setSelectedStockId(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isDarkMode
                ? "bg-[#072f23] border-[#0e4b39] text-emerald-200"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            <option value="all">Barcha filiallar</option>
            {stocks.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Holat */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isDarkMode
                ? "bg-[#072f23] border-[#0e4b39] text-emerald-200"
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            <option value="all">Barcha holatlar</option>
            <option value="performed">Tasdiqlangan</option>
            <option value="draft">Qoralama</option>
          </select>

          {/* Qidiruv */}
          <div className="relative min-w-[200px]">
            <input
              type="text"
              placeholder="Kod, kontragent yoki tavsif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs border transition ${
                isDarkMode
                  ? "bg-[#072f23] border-[#0e4b39] text-white placeholder-emerald-300/40"
                  : "bg-white border-slate-200 text-slate-800 placeholder-slate-400"
              }`}
            />
            <span className="absolute left-2.5 top-2.5 text-xs opacity-50">🔍</span>
          </div>
        </div>
      </div>

      {/* TAB 1: KIRIM HUJJATLARI JADVALI */}
      {activeTab === "purchases" && (
        <div
          className={`rounded-3xl border overflow-hidden transition-colors ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`uppercase tracking-wider font-extrabold border-b ${
                  isDarkMode
                    ? "bg-[#041f17] border-[#0e4b39] text-emerald-300/70"
                    : "bg-emerald-50/70 border-emerald-100 text-emerald-900"
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4">Hujjat kodi</th>
                  <th className="py-3.5 px-4">Sana</th>
                  <th className="py-3.5 px-4">Yetkazib beruvchi (Hamkor)</th>
                  <th className="py-3.5 px-4">Ombor / Filial</th>
                  <th className="py-3.5 px-4 text-right">Summa</th>
                  <th className="py-3.5 px-4 text-center">Holati</th>
                  <th className="py-3.5 px-4 text-center">Batafsil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {filteredPurchases.slice(0, 50).map((p) => {
                  const dateStr = p.date
                    ? new Date(p.date * 1000).toLocaleString("uz-UZ", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  return (
                    <tr
                      key={p.id}
                      className={`transition ${
                        isDarkMode ? "hover:bg-[#041f17]/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {p.code || `#${p.id}`}
                      </td>
                      <td className="py-3 px-4 opacity-75 whitespace-nowrap">{dateStr}</td>
                      <td className="py-3 px-4 font-bold">{p.partner?.name || "Noma'lum"}</td>
                      <td className="py-3 px-4 opacity-75">{p.stock?.name || "Asosiy"}</td>
                      <td className="py-3 px-4 text-right font-black text-emerald-400 whitespace-nowrap">
                        {formatMoney(p.amount, p.currency?.code_chr || "UZS")}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.performed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {p.performed ? "Tasdiqlangan" : "Qoralama"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedDoc({ type: "purchase", data: p })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                            isDarkMode
                              ? "bg-[#041f17] border-[#0e4b39] text-emerald-300 hover:bg-[#064e3b]"
                              : "bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                          }`}
                        >
                          Ko'rish
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            className={`p-3 text-center border-t text-xs opacity-60 ${
              isDarkMode ? "border-[#0e4b39]" : "border-slate-100"
            }`}
          >
            Ko'rsatilmoqda: {Math.min(filteredPurchases.length, 50)} / {filteredPurchases.length} ta kirim hujjati
          </div>
        </div>
      )}

      {/* TAB 2: TOVAR KO'CHIRISH JADVALI */}
      {activeTab === "movements" && (
        <div
          className={`rounded-3xl border overflow-hidden transition-colors ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`uppercase tracking-wider font-extrabold border-b ${
                  isDarkMode
                    ? "bg-[#041f17] border-[#0e4b39] text-emerald-300/70"
                    : "bg-emerald-50/70 border-emerald-100 text-emerald-900"
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4">Hujjat kodi</th>
                  <th className="py-3.5 px-4">Sana</th>
                  <th className="py-3.5 px-4">Yuboruvchi filial</th>
                  <th className="py-3.5 px-4">Qabul qiluvchi filial</th>
                  <th className="py-3.5 px-4">Mas'ul xodim</th>
                  <th className="py-3.5 px-4 text-center">Holati</th>
                  <th className="py-3.5 px-4 text-center">Batafsil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {filteredMovements.slice(0, 50).map((m) => {
                  const dateStr = m.date
                    ? new Date(m.date * 1000).toLocaleString("uz-UZ", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "—";

                  return (
                    <tr
                      key={m.id}
                      className={`transition ${
                        isDarkMode ? "hover:bg-[#041f17]/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-sky-400">
                        {m.code || `#${m.id}`}
                      </td>
                      <td className="py-3 px-4 opacity-75 whitespace-nowrap">{dateStr}</td>
                      <td className="py-3 px-4 font-bold text-rose-300 flex items-center gap-1.5">
                        <span>📤</span>
                        <span>{m.stock_sender?.name || "—"}</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-300">
                        <span>📥</span>
                        <span className="ml-1">{m.stock_receiver?.name || "—"}</span>
                      </td>
                      <td className="py-3 px-4 opacity-75">
                        {m.attached_user?.first_name || m.attached_user?.login || "Admin"}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.performed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {m.performed ? "Ko'chirildi" : "Qoralama"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedDoc({ type: "movement", data: m })}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                            isDarkMode
                              ? "bg-[#041f17] border-[#0e4b39] text-sky-300 hover:bg-[#064e3b]"
                              : "bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100"
                          }`}
                        >
                          Ko'rish
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div
            className={`p-3 text-center border-t text-xs opacity-60 ${
              isDarkMode ? "border-[#0e4b39]" : "border-slate-100"
            }`}
          >
            Ko'rsatilmoqda: {Math.min(filteredMovements.length, 50)} / {filteredMovements.length} ta ko'chirish hujjati
          </div>
        </div>
      )}

      {/* TAB 3: INVENTARIZATSIYA JADVALI */}
      {activeTab === "inventory" && (
        <div
          className={`rounded-3xl border overflow-hidden transition-colors ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead
                className={`uppercase tracking-wider font-extrabold border-b ${
                  isDarkMode
                    ? "bg-[#041f17] border-[#0e4b39] text-emerald-300/70"
                    : "bg-emerald-50/70 border-emerald-100 text-emerald-900"
                }`}
              >
                <tr>
                  <th className="py-3.5 px-4">Inventarizatsiya kodi</th>
                  <th className="py-3.5 px-4">Ochilgan sana</th>
                  <th className="py-3.5 px-4">Yopilgan sana</th>
                  <th className="py-3.5 px-4">Filial / Ombor</th>
                  <th className="py-3.5 px-4">Tavsif</th>
                  <th className="py-3.5 px-4 text-center">Holati</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-inherit">
                {inventories.map((inv) => (
                  <tr
                    key={inv.id}
                    className={`transition ${
                      isDarkMode ? "hover:bg-[#041f17]/60" : "hover:bg-slate-50"
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {inv.code || `#${inv.id}`}
                    </td>
                    <td className="py-3 px-4 opacity-75">
                      {inv.open_date ? new Date(inv.open_date * 1000).toLocaleDateString("uz-UZ") : "—"}
                    </td>
                    <td className="py-3 px-4 opacity-75">
                      {inv.close_date ? new Date(inv.close_date * 1000).toLocaleDateString("uz-UZ") : "Ochiq"}
                    </td>
                    <td className="py-3 px-4 font-bold">{inv.stock?.name || "Asosiy"}</td>
                    <td className="py-3 px-4 opacity-60">{inv.description || "—"}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.closed
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {inv.closed ? "Yakunlangan" : "Jarayonda"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hujjat tafsiloti Modali */}
      {selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div
            className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isDarkMode
                ? "bg-[#072f23] border-[#0e4b39] text-white"
                : "bg-white border-slate-200 text-slate-800"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                  {selectedDoc.type === "purchase" ? "Kirim Hujjati" : "Filiallararo Ko'chirish"}
                </span>
                <h3 className="text-xl font-black mt-1">
                  Hujjat: {selectedDoc.data.code || `#${selectedDoc.data.id}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-lg opacity-70"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs divide-y divide-inherit">
              <div className="pt-2 flex justify-between">
                <span className="opacity-60">Sana:</span>
                <span className="font-bold">
                  {new Date((selectedDoc.data.date || 0) * 1000).toLocaleString("uz-UZ")}
                </span>
              </div>
              {selectedDoc.type === "purchase" ? (
                <>
                  <div className="pt-2 flex justify-between">
                    <span className="opacity-60">Yetkazib beruvchi:</span>
                    <span className="font-bold text-emerald-400">
                      {selectedDoc.data.partner?.name || "Noma'lum"}
                    </span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="opacity-60">Qabul qilgan ombor:</span>
                    <span className="font-bold">{selectedDoc.data.stock?.name}</span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="opacity-60">Hujjat summasi:</span>
                    <span className="font-black text-sm text-emerald-400">
                      {formatMoney(selectedDoc.data.amount, selectedDoc.data.currency?.code_chr || "UZS")}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="pt-2 flex justify-between">
                    <span className="opacity-60">Yuboruvchi filial:</span>
                    <span className="font-bold text-rose-300">
                      {selectedDoc.data.stock_sender?.name}
                    </span>
                  </div>
                  <div className="pt-2 flex justify-between">
                    <span className="opacity-60">Qabul qiluvchi filial:</span>
                    <span className="font-bold text-emerald-300">
                      {selectedDoc.data.stock_receiver?.name}
                    </span>
                  </div>
                </>
              )}
              <div className="pt-2 flex justify-between">
                <span className="opacity-60">Mas'ul xodim:</span>
                <span className="font-bold">
                  {selectedDoc.data.attached_user?.first_name || "Admin"} (
                  {selectedDoc.data.attached_user?.main_phone || "—"})
                </span>
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="opacity-60">REGOS holati:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    selectedDoc.data.performed
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/20 text-amber-300"
                  }`}
                >
                  {selectedDoc.data.performed ? "Tasdiqlangan" : "Qoralama"}
                </span>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                onClick={() => setSelectedDoc(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-inherit hover:bg-white/10"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
