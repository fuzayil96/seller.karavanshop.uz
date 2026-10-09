export default function StatCard({
  title,
  value,
  subValue,
  icon,
  trend,
  color = "emerald",
  onClick,
  isDarkMode,
}) {
  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden group ${
        onClick ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5" : ""
      } ${
        isDarkMode
          ? "bg-[#072f23] border-[#0e4b39] text-white"
          : "bg-white border-emerald-100 text-slate-800 shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <span
            className={`text-xs uppercase font-semibold tracking-wider block truncate ${
              isDarkMode ? "text-emerald-200/70" : "text-slate-500"
            }`}
          >
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1.5 truncate">
            {value}
          </div>
          {subValue && (
            <p
              className={`text-xs mt-1 truncate ${
                isDarkMode ? "text-emerald-300/60" : "text-emerald-700"
              }`}
            >
              {subValue}
            </p>
          )}
        </div>

        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${
            isDarkMode
              ? "bg-[#041f17] text-emerald-400 border border-[#0e4b39]"
              : "bg-emerald-50 text-[#064e3b] border border-emerald-100"
          }`}
        >
          {icon}
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-inherit flex items-center justify-between text-xs">
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <span>↑</span> {trend}
          </span>
          <span className={isDarkMode ? "text-emerald-200/50" : "text-slate-400"}>
            REGOS hisobi
          </span>
        </div>
      )}
    </div>
  );
}
