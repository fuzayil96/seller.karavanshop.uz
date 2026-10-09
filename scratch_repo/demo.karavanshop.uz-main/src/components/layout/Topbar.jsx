import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({
  setIsMobileOpen,
  isDarkMode,
  toggleTheme,
}) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // 3 ta asosiy sahifa uchun sarlavhalar
  const routeInfo = {
    "/": {
      title: "Boshqaruv Paneli (BI Dashboard)",
      subtitle: "REGOS Vidjetlar tahlili va asosiy ko'rsatkichlar",
    },
    "/dashboard": {
      title: "Boshqaruv Paneli (BI Dashboard)",
      subtitle: "REGOS Vidjetlar tahlili va asosiy ko'rsatkichlar",
    },
    "/sellers": {
      title: "Sellerlar & Sotuv Foizi",
      subtitle: "Sellerlar savdo hisoboti, foiz hisoblash va Excel eksport",
    },
    "/partners": {
      title: "Hamkorlar & Kontragentlar",
      subtitle: "Hamkorlar balansi, Solishtiruv dalolatnomasi (Akt sverka) va Telegram",
    },
    "/stock": {
      title: "Ombor Qoldiqlari",
      subtitle: "Real vaqtda tovar qoldiqlari va narxlar (Mock API)",
    },
    "/admin": {
      title: "Admin Panel",
      subtitle: "Foydalanuvchilarni va tizim sozlamalarini boshqarish",
    },
  };

  const current = routeInfo[location.pathname] || {
    title: "KARAVAN ERP",
    subtitle: "Do'konlar tarmog'i boshqaruvi",
  };

  const currentDate = new Date().toLocaleDateString("uz-UZ", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  return (
    <header
      className={`h-16 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 border-b transition-colors backdrop-blur-md ${
        isDarkMode
          ? "bg-[#041f17]/95 border-[#0e4b39] text-white"
          : "bg-white/95 border-emerald-100 text-slate-800"
      }`}
    >
      {/* Chap qism: Mobil menyu tugmasi va Sahifa sarlavhasi */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsMobileOpen(true)}
          className={`lg:hidden p-2 rounded-xl border transition ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-emerald-200"
              : "bg-emerald-50 border-emerald-100 text-slate-700"
          }`}
          title="Menyuni ochish"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h2 className="text-base sm:text-lg font-black tracking-tight truncate leading-tight">
            {current.title}
          </h2>
          <p
            className={`text-[11px] hidden sm:block truncate ${
              isDarkMode ? "text-emerald-200/60" : "text-slate-400"
            }`}
          >
            {current.subtitle} • {currentDate}
          </p>
        </div>
      </div>

      {/* O'ng qism: Holat va Dark/Light switcher va Chiqish tugmasi */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Tizim holati indikatori */}
        <div
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
            isDarkMode
              ? "bg-[#072f23]/80 border-[#0e4b39] text-emerald-300"
              : "bg-emerald-50 border-emerald-200 text-emerald-800"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>REGOS Cloud</span>
        </div>

        {/* Dark Mode / Light Mode o'tkazgich */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition border flex items-center gap-2 ${
            isDarkMode
              ? "bg-[#072f23] hover:bg-[#0c3d2e] border-[#0e4b39] text-amber-300"
              : "bg-emerald-50 hover:bg-emerald-100 border-slate-200 text-[#064e3b]"
          }`}
          title={isDarkMode ? "Kunduzgi rejim (Light mode)" : "Tungi rejim (Dark mode)"}
        >
          {isDarkMode ? (
            <>
              <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="hidden sm:inline">Yorug'</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-emerald-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
              <span className="hidden sm:inline">Qorong'u</span>
            </>
          )}
        </button>

        {/* Chiqish (Logout) tugmasi */}
        {user && (
          <button
            type="button"
            onClick={logout}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold transition border flex items-center gap-2 ${
              isDarkMode
                ? "bg-red-900/20 hover:bg-red-900/40 border-red-900/30 text-red-400"
                : "bg-red-50 hover:bg-red-100 border-red-100 text-red-600"
            }`}
            title="Tizimdan chiqish"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline">Chiqish</span>
          </button>
        )}
      </div>
    </header>
  );
}
