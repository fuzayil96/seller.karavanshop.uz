import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Sidebar({
  isCollapsed,
  setIsCollapsed,
  isMobileOpen,
  setIsMobileOpen,
  isDarkMode,
}) {
  const location = useLocation();
  const { user } = useAuth();

  // Faqatgina asosiy sahifalar
  const menuItems = [
    {
      path: "/",
      label: "Boshqaruv paneli",
      shortLabel: "Asosiy",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      badge: "BI",
    },
    {
      path: "/stock",
      label: "Ombor Qoldiqlari",
      shortLabel: "Ombor",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      badge: "NEW",
    },
    {
      path: "/sellers",
      label: "Sellerlar & Foiz",
      shortLabel: "Sellerlar",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      badge: "YANGI",
    },
    {
      path: "/partners",
      label: "Hamkorlar & Kontragentlar",
      shortLabel: "Hamkorlar",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      badge: "REGOS",
    },
  ];

  if (user?.role === "admin") {
    menuItems.push({
      path: "/admin",
      label: "Foydalanuvchilar (Admin)",
      shortLabel: "Admin",
      icon: (
        <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      badge: "ROOT",
    });
  }

  return (
    <>
      {/* Mobil fon pardasi (Overlay) */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Asosiy Sidebar paneli */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r transition-all duration-300 ${
          isDarkMode
            ? "bg-[#041f17] border-[#0e4b39] text-white"
            : "bg-white border-emerald-100 text-slate-800"
        } ${
          isCollapsed ? "w-20" : "w-64"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Yuqori brend / Logo qismi */}
        <div className="h-16 px-4 flex items-center justify-between border-b shrink-0 border-inherit">
          <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#065f46] to-emerald-400 flex items-center justify-center text-white font-extrabold text-lg shadow-md shrink-0">
              K
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-base tracking-wider block truncate">
                  KARAVAN
                </span>
                <span
                  className={`text-[10px] tracking-wider block uppercase font-medium ${
                    isDarkMode ? "text-emerald-300/70" : "text-emerald-700"
                  }`}
                >
                  ERP Tizimi
                </span>
              </div>
            )}
          </NavLink>

          {/* Desktop yig'ish / ochish tugmasi */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden lg:flex p-1.5 rounded-lg border transition ${
              isDarkMode
                ? "bg-[#072f23] border-[#0e4b39] text-emerald-200 hover:text-white hover:bg-[#0c3d2e]"
                : "bg-emerald-50 border-emerald-100 text-slate-600 hover:text-slate-900 hover:bg-emerald-100"
            }`}
            title={isCollapsed ? "Kengaytirish" : "Yig'ish"}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-300 ${
                isCollapsed ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>

          {/* Mobil yopish tugmasi */}
          <button
            type="button"
            onClick={() => setIsMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Menyu bo'limlari (Faqatgina 3 ta asosiy bo'lim) */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-2">
          {!isCollapsed && (
            <div
              className={`px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                isDarkMode ? "text-emerald-300/50" : "text-slate-400"
              }`}
            >
              Asosiy Bo'limlar
            </div>
          )}

          {menuItems.map((item) => {
            const hasPermission = user?.role === 'admin' || user?.permissions?.includes(item.path);
            if (!hasPermission) return null;

            const isActive =
              item.path === "/"
                ? location.pathname === "/" || location.pathname === "/dashboard"
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl font-bold text-sm transition-all duration-150 group ${
                  isActive
                    ? isDarkMode
                      ? "bg-[#065f46] text-white shadow-lg shadow-emerald-950/40"
                      : "bg-[#064e3b] text-white shadow-md shadow-emerald-900/10"
                    : isDarkMode
                    ? "text-emerald-100/80 hover:bg-[#072f23] hover:text-white"
                    : "text-slate-600 hover:bg-emerald-50 hover:text-[#064e3b]"
                } ${isCollapsed ? "justify-center px-0" : ""}`}
                title={item.label}
              >
                <span
                  className={`transition-transform group-hover:scale-110 ${
                    isActive ? "text-white" : isDarkMode ? "text-emerald-300" : "text-[#065f46]"
                  }`}
                >
                  {item.icon}
                </span>

                {!isCollapsed && (
                  <span className="truncate flex-1 text-left">
                    {item.label}
                  </span>
                )}

                {!isCollapsed && item.badge && (
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg ${
                      isActive
                        ? "bg-white/20 text-white"
                        : isDarkMode
                        ? "bg-[#072f23] text-emerald-300 border border-[#0e4b39]"
                        : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Quyi qism: REGOS Cloud Status */}
        <div className="p-3 border-t shrink-0 border-inherit">
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2.5 ${
              isDarkMode
                ? "bg-[#072f23]/60 border border-[#0e4b39]"
                : "bg-emerald-50/80 border border-emerald-100"
            }`}
          >
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="font-bold truncate leading-tight">REGOS Cloud API</p>
                <p
                  className={`text-[10px] truncate ${
                    isDarkMode ? "text-emerald-300/70" : "text-emerald-700"
                  }`}
                >
                  Ulangan • api.karavanshop.uz
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
