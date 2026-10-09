import { useEffect, useState, useMemo } from "react";
import getData from "../utils/getData";
import { formatMoney } from "../utils/formatters";

export default function SellerChequesModal({
  seller,
  dateLabel,
  commissionRate,
  onClose,
  isDarkMode,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCheque, setSelectedCheque] = useState(null);
  const [chequeItems, setChequeItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Esc tugmasi bosilganda yopish
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (selectedCheque) {
          setSelectedCheque(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, selectedCheque]);

  // Chek tafsilotlari (tovarlar)ni yuklash
  useEffect(() => {
    if (!selectedCheque?.uuid) {
      setChequeItems([]);
      return;
    }

    let isMounted = true;
    async function fetchItems() {
      try {
        setItemsLoading(true);
        const res = await getData({
          url: "/docchequeoperation/get",
          reqData: { doc_sale_uuid: selectedCheque.uuid },
        }).catch(() => null);

        if (isMounted) {
          setChequeItems(res?.result || []);
        }
      } catch (err) {
        console.error("Chek tovarlarini yuklashda xatolik:", err);
      } finally {
        if (isMounted) setItemsLoading(false);
      }
    }

    fetchItems();
    return () => {
      isMounted = false;
    };
  }, [selectedCheque]);

  if (!seller) return null;

  const cheques = seller.cheques || [];

  // Cheklarni qidiruv bo'yicha saralash
  const filteredCheques = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return cheques;

    return cheques.filter((c) => {
      const code = String(c.code || "").toLowerCase();
      const cashier = (c.cashier?.full_name || c.cashier?.name || "").toLowerCase();
      const amount = String(c.amount || "");
      return code.includes(q) || cashier.includes(q) || amount.includes(q);
    });
  }, [cheques, searchTerm]);

  // Cheklar statistikasi
  const totalChequesCount = cheques.length;
  const grossSales = seller.totalSales || 0;
  const returnsSum = seller.returnsSum || 0;
  const netSales = seller.netSales || 0;
  const calculatedBonus = (netSales * Number(commissionRate || 0)) / 100;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 transition-all"
      style={{
        backgroundColor: isDarkMode
          ? "rgba(4, 31, 23, 0.6)"
          : "rgba(6, 78, 59, 0.25)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "92vh" }}
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl shadow-2xl relative border transition-colors overflow-hidden ${
          isDarkMode
            ? "bg-[#072f23] border-[#0e4b39] text-white"
            : "bg-white border-emerald-100 text-slate-800"
        }`}
      >
        {/* Modal Tepasi: Sarlavha va Yopish */}
        <div
          className={`p-5 sm:p-6 border-b shrink-0 flex items-start justify-between gap-4 ${
            isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-emerald-50/70 border-emerald-100"
          }`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#065f46] to-emerald-400 flex items-center justify-center text-white font-extrabold text-lg shadow-md shrink-0">
              {seller.name?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight truncate">
                  {seller.name}
                </h2>
                {seller.group && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isDarkMode
                        ? "bg-[#064e3b] text-emerald-300 border border-[#0e4b39]"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {seller.group}
                  </span>
                )}
                {seller.barcode && (
                  <span className="font-mono text-xs opacity-60">
                    ID: {seller.barcode}
                  </span>
                )}
              </div>
              <p
                className={`text-xs mt-0.5 ${
                  isDarkMode ? "text-emerald-200/70" : "text-slate-500"
                }`}
              >
                Tanlangan davr: <span className="font-semibold text-emerald-400">{dateLabel}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition shrink-0 ${
              isDarkMode
                ? "text-emerald-200/70 hover:text-white hover:bg-[#0c3d2e]"
                : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
            }`}
          >
            ✕
          </button>
        </div>

        {/* Tezkor Ko'rsatkichlar Paneli */}
        <div
          className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b text-center shrink-0 ${
            isDarkMode ? "bg-[#05281e] border-[#0e4b39]" : "bg-slate-50 border-slate-100"
          }`}
        >
          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? "bg-[#041f17] border-[#0e4b39]"
                : "bg-white border-emerald-50"
            }`}
          >
            <p className="text-[11px] opacity-65 font-medium">Jami cheklar</p>
            <p className="text-base sm:text-lg font-bold mt-0.5 text-emerald-400">
              {totalChequesCount} ta
            </p>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? "bg-[#041f17] border-[#0e4b39]"
                : "bg-white border-emerald-50"
            }`}
          >
            <p className="text-[11px] opacity-65 font-medium">Umumiy savdo</p>
            <p className="text-base sm:text-lg font-bold mt-0.5">
              {formatMoney(grossSales, "UZS")}
            </p>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? "bg-[#041f17] border-[#0e4b39]"
                : "bg-white border-emerald-50"
            }`}
          >
            <p className="text-[11px] opacity-65 font-medium">Qaytarishlar</p>
            <p
              className={`text-base sm:text-lg font-bold mt-0.5 ${
                returnsSum > 0 ? "text-rose-400" : "opacity-60"
              }`}
            >
              {returnsSum > 0 ? `-${formatMoney(returnsSum, "UZS")}` : "0 UZS"}
            </p>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              isDarkMode
                ? "bg-[#041f17] border-amber-500/40 text-amber-300"
                : "bg-amber-50/70 border-amber-200 text-amber-900"
            }`}
          >
            <p className="text-[11px] font-medium opacity-80">
              Foiz bonusi ({commissionRate}%)
            </p>
            <p className="text-base sm:text-lg font-extrabold mt-0.5">
              {formatMoney(calculatedBonus, "UZS")}
            </p>
          </div>
        </div>

        {/* Asosiy Kontent: Cheklar Ro'yxati yoki Tanlangan Chek Tafsiloti */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-4">
          {selectedCheque ? (
            /* Tanlangan chek ko'rinishi */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedCheque(null)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                    isDarkMode
                      ? "bg-[#041f17] border-[#0e4b39] text-emerald-300 hover:bg-[#0c3d2e]"
                      : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <span>←</span> Barcha cheklarga qaytish
                </button>

                <span className="font-mono text-sm font-bold text-emerald-400">
                  Chek №{selectedCheque.code}
                </span>
              </div>

              {/* Chek tovarlari */}
              <div
                className={`p-4 rounded-2xl border ${
                  isDarkMode
                    ? "bg-[#041f17] border-[#0e4b39]"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-bold tracking-tight">
                    Chekdagi tovarlar ({chequeItems.length} ta)
                  </h3>
                  <span className="text-xs font-extrabold text-emerald-400">
                    Jami: {formatMoney(selectedCheque.amount, "UZS")}
                  </span>
                </div>

                {itemsLoading ? (
                  <div className="py-8 text-center opacity-70 text-xs">
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent mb-2"></div>
                    <p>Mahsulotlar yuklanmoqda...</p>
                  </div>
                ) : chequeItems.length > 0 ? (
                  <div className="divide-y divide-inherit overflow-hidden rounded-xl border border-inherit">
                    {(() => {
                      const groups = {};
                      chequeItems.forEach(it => {
                        const name = it.item?.name || it.name || it.item_name || "Mahsulot";
                        const price = Number(it.price || it.cost || 0);
                        const key = `${name}_${price}`;
                        if (!groups[key]) groups[key] = { name, price, pos: 0, neg: 0, original: it };
                        const qty = Number(it.quantity || 1);
                        if (qty > 0) groups[key].pos += qty;
                        else groups[key].neg += Math.abs(qty);
                      });

                      const merged = [];
                      Object.values(groups).forEach(g => {
                        const canceled = Math.min(g.pos, g.neg);
                        const active = g.pos - canceled;
                        const pureReturn = g.neg - canceled;

                        if (active > 0) {
                          merged.push({ ...g.original, quantity: active, amount: active * g.price, _isCanceled: false });
                        }
                        if (canceled > 0) {
                          merged.push({ ...g.original, quantity: canceled, amount: canceled * g.price, _isCanceled: true });
                        }
                        if (pureReturn > 0) {
                          merged.push({ ...g.original, quantity: -pureReturn, amount: -pureReturn * g.price, _isCanceled: true });
                        }
                      });

                      return merged.map((it, idx) => {
                        const itemName = it.item?.name || it.name || it.item_name || "Mahsulot";
                        const qty = Number(it.quantity);
                        const price = Number(it.price || it.cost || 0);
                        const total = Number(it.amount);
                        const isCanceled = it._isCanceled;

                        return (
                          <div
                            key={it.uuid || idx}
                            className={`p-3 flex items-center justify-between gap-3 text-xs ${isCanceled ? "opacity-60 line-through" : ""}`}
                          >
                            <div>
                              <p className={`font-semibold ${isCanceled ? "text-rose-400" : ""}`}>{itemName}</p>
                              <p className="opacity-60 text-[11px] mt-0.5">
                                {qty} dona × {formatMoney(price, "UZS")}
                              </p>
                            </div>
                            <span className={`font-bold ${isCanceled ? "text-rose-400" : "text-emerald-400"}`}>
                              {formatMoney(total, "UZS")}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                ) : (
                  <div className="py-6 text-center opacity-60 text-xs">
                    Tovarlar ro'yxati topilmadi yoki chek to'liq tafsiloti cheklangan
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Cheklar ro'yxati */
            <>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <h3 className="text-sm font-bold tracking-tight opacity-90">
                  Seller orqali amalga oshirilgan barcha cheklar ({filteredCheques.length} ta)
                </h3>

                <div className="relative w-full sm:w-64">
                  <input
                    type="text"
                    placeholder="Chek № yoki kassir..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full pl-8 pr-7 py-1.5 rounded-xl text-xs transition focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                      isDarkMode
                        ? "bg-[#041f17] border border-[#0e4b39] text-white placeholder-emerald-200/40"
                        : "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white"
                    }`}
                  />
                  <span className="absolute left-2.5 top-2 text-xs opacity-50">
                    🔍
                  </span>
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2 top-1.5 text-xs opacity-60 hover:opacity-100"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {filteredCheques.length > 0 ? (
                <div
                  className={`rounded-2xl border overflow-hidden shadow-xs ${
                    isDarkMode
                      ? "bg-[#041f17] border-[#0e4b39]"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr
                          className={`border-b font-semibold uppercase tracking-wider ${
                            isDarkMode
                              ? "bg-[#031812] border-[#0e4b39] text-emerald-200/70"
                              : "bg-emerald-50/90 border-emerald-100 text-[#064e3b]"
                          }`}
                        >
                          <th className="py-2.5 px-3.5 text-center w-12">№</th>
                          <th className="py-2.5 px-3.5">Chek raqami</th>
                          <th className="py-2.5 px-3.5">Vaqt</th>
                          <th className="py-2.5 px-3.5">Kassir</th>
                          <th className="py-2.5 px-3.5">Holat</th>
                          <th className="py-2.5 px-3.5 text-right">Summa</th>
                          <th className="py-2.5 px-3.5 text-center w-20">Tafsilot</th>
                        </tr>
                      </thead>
                      <tbody
                        className={`divide-y ${
                          isDarkMode
                            ? "divide-[#0e4b39]/60 text-slate-200"
                            : "divide-slate-200 text-slate-800"
                        }`}
                      >
                        {filteredCheques.map((c, idx) => {
                          const isRet = Boolean(c.is_return);
                          const amt = Number(c.amount || 0);
                          let timeStr = "—";
                          if (c.date) {
                            const parsedNum = Number(c.date);
                            const dateObj = !isNaN(parsedNum) ? new Date(parsedNum * 1000) : new Date(c.date);
                            if (dateObj instanceof Date && !isNaN(dateObj.getTime())) {
                              timeStr = dateObj.toLocaleString("ru-RU", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              });
                            }
                          }

                          return (
                            <tr
                              key={c.uuid || idx}
                              onClick={() => setSelectedCheque(c)}
                              className={`cursor-pointer transition ${
                                isDarkMode
                                  ? "hover:bg-[#0c3d2e]/80"
                                  : "hover:bg-emerald-50/70"
                              }`}
                            >
                              <td className="py-2.5 px-3.5 text-center opacity-60">
                                {idx + 1}
                              </td>
                              <td className="py-2.5 px-3.5 font-mono font-bold text-emerald-400">
                                №{c.code}
                              </td>
                              <td className="py-2.5 px-3.5 opacity-75 whitespace-nowrap">
                                {timeStr}
                              </td>
                              <td className="py-2.5 px-3.5 truncate max-w-[140px]">
                                {c.cashier?.full_name || "—"}
                              </td>
                              <td className="py-2.5 px-3.5">
                                {isRet ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    Qaytarish
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Sotuv
                                  </span>
                                )}
                              </td>
                              <td
                                className={`py-2.5 px-3.5 text-right font-bold whitespace-nowrap ${
                                  isRet ? "text-rose-400" : "text-emerald-400"
                                }`}
                              >
                                {isRet ? "-" : "+"}
                                {formatMoney(amt, "UZS")}
                              </td>
                              <td className="py-2.5 px-3.5 text-center">
                                <span className="text-xs text-emerald-400 underline">
                                  Ko'rish
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div
                  className={`p-8 text-center rounded-2xl border text-xs opacity-60 ${
                    isDarkMode
                      ? "bg-[#041f17] border-[#0e4b39]"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  Cheklar topilmadi
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Pastki Qismi: Yopish tugmasi */}
        <div
          className={`p-3.5 sm:p-4 border-t shrink-0 flex items-center justify-between gap-3 ${
            isDarkMode ? "bg-[#041f17] border-[#0e4b39]" : "bg-slate-50 border-emerald-100"
          }`}
        >
          <div className="text-xs">
            <span className="opacity-70">Sof sotuv: </span>
            <strong className="text-emerald-400 font-mono">
              {formatMoney(netSales, "UZS")}
            </strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2 rounded-xl text-xs font-semibold transition border shadow-xs ${
              isDarkMode
                ? "bg-[#072f23] hover:bg-[#0c3d2e] border-[#0e4b39] text-white"
                : "bg-white hover:bg-slate-100 border-slate-200 text-slate-800"
            }`}
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  );
}
