// Yuqori boshqaruv va qidiruv paneli (Qadalib turuvchi / Sticky Top)
export default function Header({
  searchTerm,
  setSearchTerm,
  sortAsc,
  setSortAsc,
  isDarkMode,
  toggleTheme,
  totalCount,
}) {
  return (
    <div
      style={{ position: "sticky", top: 0, zIndex: 30 }}
      className={`sticky top-0 z-30 pt-1 pb-2.5 -mt-1 transition-colors backdrop-blur-md ${
        isDarkMode ? "bg-[#041f17]/95" : "bg-[#f4f9f6]/95"
      }`}
    >
      <div
        className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-2xl border transition-colors shadow-md ${
          isDarkMode
            ? "bg-[#072f23] border-[#0e4b39]"
            : "bg-white border-emerald-100"
        }`}
      >
        {/* Sarlavha va soni */}
        {/* <div>
          <h1
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isDarkMode ? "text-white" : "text-[#064e3b]"
            }`}
          >
            Hamkorlar
          </h1>
          <p
            className={`text-xs mt-0.5 ${
              isDarkMode ? "text-emerald-200/70" : "text-slate-500"
            }`}
          >
            Jami: {totalCount} ta hamkor
          </p>
        </div> */}

        {/* Qidiruv, saralash va Rejim o'zgartirish */}
        <div className="flex items-center gap-2">
          {/* Qidiruv inputi */}
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Qidirish..."
              className={`w-full pl-9 pr-8 py-2 rounded-xl text-sm transition focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDarkMode
                  ? "bg-[#041f17] border border-[#0e4b39] text-white placeholder-emerald-200/40"
                  : "bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white"
              }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className={`w-4 h-4 absolute left-3 top-2.5 pointer-events-none ${
                isDarkMode ? "text-emerald-300/50" : "text-slate-400"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className={`absolute right-2.5 top-2.5 text-xs transition ${
                  isDarkMode
                    ? "text-emerald-300 hover:text-white"
                    : "text-slate-400 hover:text-slate-600"
                }`}
                title="Tozalash"
              >
                ✕
              </button>
            )}
          </div>

          {/* A-Z saralash */}
          <button
            type="button"
            onClick={() => setSortAsc(!sortAsc)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition flex items-center gap-1 border ${
              isDarkMode
                ? "bg-[#041f17] hover:bg-[#0c3d2e] border-[#0e4b39] text-emerald-100"
                : "bg-white hover:bg-emerald-50 border-slate-200 text-slate-700"
            }`}
            title="Tartiblash"
          >
            <span>{sortAsc ? "A-Z" : "Z-A"}</span>
          </button>

          {/* Dark Mode / Light Mode o'tkazgich */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`p-2 rounded-xl text-sm font-medium transition border flex items-center justify-center ${
              isDarkMode
                ? "bg-[#041f17] hover:bg-[#0c3d2e] border-[#0e4b39] text-amber-300"
                : "bg-white hover:bg-emerald-50 border-slate-200 text-slate-700"
            }`}
            title={
              isDarkMode
                ? "Kunduzgi rejim (Light mode)"
                : "Tungi rejim (Dark mode)"
            }
          >
            {isDarkMode ? (
              <svg
                className="w-4 h-4 text-amber-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-emerald-800"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
