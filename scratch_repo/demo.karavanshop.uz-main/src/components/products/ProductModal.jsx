import { useEffect, useState, useMemo } from "react";
import Barcode from "react-barcode";
import { formatMoney } from "../../utils/formatters";
import getData from "../../utils/getData";

// KARAVAN SHOP omborlar va filiallar ro'yxati (REGOS /stock/get ma'lumotlari)
const KARAVAN_STOCKS = [
  { id: 1, name: "МАРХАБО" },
  { id: 2, name: "ВОКЗАЛ" },
  { id: 3, name: "ИСТИКЛОЛ" },
  { id: 4, name: "ПОБЕДА" },
  { id: 6, name: "ВОКЗАЛ МУЖСКОЙ" },
  { id: 7, name: "СКЛАД ПОДВАЛ" },
  { id: 8, name: "РАВОНАК" },
  { id: 9, name: "КОРАСУВ" },
];

export default function ProductModal({ product, onClose, isDarkMode }) {
  const [stockBreakdown, setStockBreakdown] = useState([]);
  const [loadingStocks, setLoadingStocks] = useState(true);

  const item = product?.item || product;
  const price = product?.price || item?.price || 0;
  const totalQuantity = product?.quantity?.common ?? item?.quantity ?? 0;
  const unit = item?.unit?.name || "dona";
  const itemCode = item?.code ?? item?.articul;

  // Faqat asosiy shtrix kod (base_barcode yoki barcode_list ichidagi birinchisi)
  const primaryBarcode = useMemo(() => {
    if (item?.base_barcode) return String(item.base_barcode).trim();
    if (item?.barcode) return String(item.barcode).trim();
    if (item?.barcode_list) {
      const first = String(item.barcode_list).split(/[\s,;]+/)[0];
      return first ? first.trim() : "";
    }
    return "";
  }, [item]);

  // Telegramda ulashish matni va havolasi
  const telegramShareUrl = useMemo(() => {
    if (!item) return "#";

    const lines = [];
    lines.push(`🛍 ${item?.name || "Tovar"}`);
    if (
      itemCode !== undefined &&
      itemCode !== null &&
      String(itemCode).trim() !== ""
    ) {
      lines.push(`🔢 Kodi: #${itemCode}`);
    }
    lines.push(`💰 Narxi: ${formatMoney(price, "UZS")}`);
    lines.push(`📊 Jami soni: ${totalQuantity} ${unit}`);

    if (stockBreakdown && stockBreakdown.length > 0) {
      lines.push("");
      lines.push("🏬 Omborlar bo'yicha soni:");
      stockBreakdown.forEach((stk) => {
        lines.push(`• ${stk.name}: ${stk.quantity} ${unit}`);
      });
    }

    if (item?.image_url) {
      lines.push("");
      lines.push(`🖼 Rasmi: ${item.image_url}`);
    }

    const text = lines.join("\n");
    const urlParam = item?.image_url ? item.image_url : "";
    return `https://t.me/share/url?url=${encodeURIComponent(text)}`;
  }, [item, itemCode, price, totalQuantity, unit, stockBreakdown]);

  // ESC tugmasi bosilganda modalni yopish
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Har bir ombor / filial bo'yicha qoldiqni REGOS API (/item/getcurrentquantity) orqali olish
  // https://docs.regos.uz/en/api/references/item/getcurrentquantity
  useEffect(() => {
    let isMounted = true;
    if (!item?.id) return;

    async function fetchStockBalances() {
      try {
        setLoadingStocks(true);
        const stockIds = KARAVAN_STOCKS.map((s) => s.id);

        let res;
        try {
          res = await getData({
            url: "/item/getcurrentquantity",
            reqData: {
              item_ids: [item.id],
              stock_ids: stockIds,
            },
          });
        } catch {
          res = await getData({
            url: "item/getcurrentquantity",
            reqData: {
              item_ids: [item.id],
              stock_ids: stockIds,
            },
          });
        }

        const quantities = res?.result || [];
        const balances = KARAVAN_STOCKS.map((stk) => {
          const match = Array.isArray(quantities)
            ? quantities.find((q) => q.stock_id === stk.id)
            : null;
          return {
            id: stk.id,
            name: stk.name,
            quantity: match ? Number(match.quantity || 0) : 0,
          };
        });

        if (isMounted) {
          setStockBreakdown(balances);
        }
      } catch (err) {
        console.error("/item/getcurrentquantity yuklashda xatolik:", err);
      } finally {
        if (isMounted) {
          setLoadingStocks(false);
        }
      }
    }

    fetchStockBalances();
    return () => {
      isMounted = false;
    };
  }, [item?.id]);

  if (!product) return null;

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
        {/* Scrollable ichki qism */}
        <div className="overflow-y-auto flex-1 min-h-0 p-5 sm:p-6 space-y-4">
          {/* Sarlavha va Yopish */}
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
              Tovar va Omborlar Qoldig'i
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-xl font-bold break-words flex-1">
                {item?.name}
              </h2>
              {itemCode !== undefined &&
                itemCode !== null &&
                String(itemCode).trim() !== "" && (
                  <span className="shrink-0 font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 dark:text-emerald-300 border border-emerald-500/20">
                    #{itemCode}
                  </span>
                )}
            </div>
          </div>

          {/* Rasm (agar mavjud bo'lsa) */}
          {item?.image_url && (
            <div className="rounded-2xl overflow-hidden aspect-16/9 bg-slate-100 dark:bg-[#041f17] flex items-center justify-center">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Narx va Jami Ombordagi holat */}
          <div className="grid grid-cols-2 gap-3">
            <div
              className={`p-3.5 rounded-xl border ${
                isDarkMode
                  ? "bg-[#041f17] border-[#0e4b39]"
                  : "bg-emerald-50/70 border-emerald-100"
              }`}
            >
              <span className="text-xs opacity-60 block">Sotuv narxi:</span>
              <span className="text-xl font-extrabold text-emerald-400 mt-1 block">
                {formatMoney(price, "UZS")}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border ${
                isDarkMode
                  ? "bg-[#041f17] border-[#0e4b39]"
                  : "bg-emerald-50/70 border-emerald-100"
              }`}
            >
              <span className="text-xs opacity-60 block">Jami qoldiq:</span>
              <span className="text-xl font-extrabold text-emerald-300 mt-1 block">
                {totalQuantity} {unit}
              </span>
            </div>
          </div>

          {/* 🏬 OMBORLAR VA FILIALLAR BO'YICHA QOLDIQLAR */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider opacity-80 flex items-center gap-1.5">
                <span>🏬 Omborlar bo'yicha qoldiq</span>
                {loadingStocks && (
                  <span className="inline-block animate-spin h-3 w-3 border-2 border-emerald-400 border-t-transparent rounded-full ml-1" />
                )}
              </h3>
              <span className="text-[11px] opacity-60">
                {KARAVAN_STOCKS.length} ta ombor/filial
              </span>
            </div>

            <div
              className={`rounded-xl border overflow-hidden text-xs divide-y ${
                isDarkMode
                  ? "bg-[#041f17] border-[#0e4b39] divide-[#0e4b39]/60"
                  : "bg-slate-50 border-slate-200 divide-slate-200"
              }`}
            >
              {loadingStocks && stockBreakdown.length === 0 ? (
                <div className="p-4 text-center opacity-60">
                  Omborlar bo'yicha hisoblanmoqda...
                </div>
              ) : (
                stockBreakdown.map((stk) => (
                  <div
                    key={stk.id}
                    className={`p-3 flex justify-between items-center transition-colors ${
                      stk.quantity > 0
                        ? isDarkMode
                          ? "bg-emerald-950/20"
                          : "bg-emerald-50/50"
                        : ""
                    }`}
                  >
                    <span className="font-semibold">{stk.name}</span>
                    <span
                      className={`font-mono px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        stk.quantity > 0
                          ? isDarkMode
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-emerald-100 text-emerald-800"
                          : "opacity-40"
                      }`}
                    >
                      {stk.quantity > 0
                        ? `+${stk.quantity} ${unit}`
                        : `0 ${unit}`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Texnik ma'lumotlar ro'yxati */}
          <div
            className={`p-3.5 rounded-xl border text-xs space-y-2 divide-y ${
              isDarkMode
                ? "bg-[#041f17] border-[#0e4b39] divide-[#0e4b39]/60"
                : "bg-slate-50 border-slate-200 divide-slate-200"
            }`}
          >
            <div className="flex justify-between items-center pt-1.5 first:pt-0">
              <span className="opacity-60">Tovar ID:</span>
              <span className="font-mono font-bold">{item?.id || "—"}</span>
            </div>

            {item?.group?.name && (
              <div className="flex justify-between items-center pt-1.5">
                <span className="opacity-60">Kategoriya / Guruh:</span>
                <span className="font-semibold">{item.group.name}</span>
              </div>
            )}

            {itemCode !== undefined &&
              itemCode !== null &&
              String(itemCode).trim() !== "" && (
                <div className="flex justify-between items-center pt-1.5">
                  <span className="opacity-60">Tovar kodi:</span>
                  <span className="font-mono font-bold text-emerald-500 dark:text-emerald-300">
                    #{itemCode}
                  </span>
                </div>
              )}

            {item?.articul &&
              item?.code &&
              String(item.articul) !== String(item.code) && (
                <div className="flex justify-between items-center pt-1.5">
                  <span className="opacity-60">Artikul:</span>
                  <span className="font-mono font-semibold">
                    {item.articul}
                  </span>
                </div>
              )}

            {primaryBarcode && (
              <div className="flex justify-between items-center pt-1.5">
                <span className="opacity-60">Asosiy shtrix-kod:</span>
                <span className="font-mono font-semibold">
                  {primaryBarcode}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center pt-1.5">
              <span className="opacity-60">O'lchov birligi:</span>
              <span className="font-semibold">{unit}</span>
            </div>
          </div>

          {/* Faqat asosiy shtrix-kod skaner ko'rinishi */}
          {primaryBarcode && (
            <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center space-y-1.5 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500">
                Skanerlash uchun asosiy shtrix-kod:
              </span>
              <Barcode
                value={String(primaryBarcode)}
                width={1.6}
                height={48}
                fontSize={13}
                displayValue={true}
                background="#ffffff"
                lineColor="#000000"
              />
            </div>
          )}
        </div>

        {/* Modal pastida qadalib turuvchi Harakatlar (Ulashish va Yopish) paneli */}
        <div
          className={`p-3.5 sm:p-4 border-t shrink-0 sticky bottom-0 z-20 flex items-center gap-2.5 ${
            isDarkMode
              ? "bg-[#041f17] border-[#0e4b39]"
              : "bg-slate-50 border-emerald-100 shadow-md"
          }`}
        >
          {/* Telegramda ulashish */}
          <a
            href={telegramShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-4 bg-[#229ED9] hover:bg-[#1ea1dd] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition shadow-xs"
            title="Telegram orqali tovar ma'lumotlarini ulashish"
          >
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
            </svg>
            <span>Telegramda ulashish</span>
          </a>

          {/* Yopish tugmasi */}
          <button
            type="button"
            onClick={onClose}
            className={`py-2.5 px-5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2 border shadow-xs ${
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
