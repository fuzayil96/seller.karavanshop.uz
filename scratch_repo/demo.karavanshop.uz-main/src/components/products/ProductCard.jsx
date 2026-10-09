import { formatMoney } from "../../utils/formatters";

export default function ProductCard({ product, onSelect, isDarkMode }) {
  const item = product?.item || product;
  const price = product?.price || item?.price || 0;
  const quantity = product?.quantity?.common ?? item?.quantity ?? 0;
  const unit = item?.unit?.name || "dona";
  const itemCode = item?.code ?? item?.articul;
  const hasImage = Boolean(item?.image_url);

  return (
    <div
      onClick={() => onSelect(product)}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 flex flex-col group ${
        isDarkMode
          ? "bg-[#072f23] border-[#0e4b39] text-white"
          : "bg-white border-emerald-100 text-slate-800 shadow-sm"
      }`}
    >
      {/* Rasm qismi */}
      <div className="relative aspect-4/3 overflow-hidden bg-slate-100 dark:bg-[#041f17] flex items-center justify-center">
        {hasImage ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.style.display = "none";
              e.target.parentElement.innerHTML =
                "<div class='text-slate-400 text-xs font-semibold p-4 text-center'>📷 Rasm yuklanmadi</div>";
            }}
          />
        ) : (
          <div className="text-slate-400 dark:text-emerald-300/40 text-xs font-semibold p-4 text-center flex flex-col items-center gap-1.5">
            <svg className="w-8 h-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="opacity-75">Rasm yo'q</span>
          </div>
        )}

        {/* Omborda qoldiq belgisi */}
        <span
          className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-xs backdrop-blur-md ${
            quantity > 0
              ? isDarkMode
                ? "bg-[#065f46]/95 text-emerald-100 border border-emerald-400/30"
                : "bg-emerald-600/90 text-white"
              : "bg-rose-500/90 text-white"
          }`}
        >
          {quantity > 0 ? `${quantity} ${unit}` : "Tugagan"}
        </span>

        {/* Kategoriya */}
        {item?.group?.name && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-black/60 text-white backdrop-blur-xs max-w-[80%] truncate">
            {item.group.name}
          </span>
        )}
      </div>

      {/* Mahsulot ma'lumotlari */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3
            className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-emerald-400 transition-colors"
            title={item?.name}
          >
            {item?.name || "Noma'lum tovar"}
          </h3>
        </div>

        {/* Narx va Tovar Kodi */}
        <div className="space-y-1.5 pt-2 border-t border-inherit">
          <div className="flex items-baseline justify-between">
            <span className="text-xs opacity-60">Narxi:</span>
            <span className="text-base font-extrabold text-emerald-400">
              {formatMoney(price, "UZS")}
            </span>
          </div>

          {/* Tovar kodi */}
          {(itemCode !== undefined && itemCode !== null && String(itemCode).trim() !== "") && (
            <div className="flex items-center justify-between text-[11px] pt-0.5">
              <span className="opacity-60 flex items-center gap-1">
                <span>🔢</span> Kodi:
              </span>
              <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                #{itemCode}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
