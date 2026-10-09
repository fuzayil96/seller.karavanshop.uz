import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({
  isDarkMode,
  toggleTheme,
  children,
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-200 ${
        isDarkMode ? "bg-[#02130e] text-white" : "bg-[#f4f9f6] text-slate-800"
      }`}
    >
      {/* Chap Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
        isDarkMode={isDarkMode}
      />

      {/* Asosiy kontent maydoni */}
      <div
        className={`min-h-screen flex flex-col transition-all duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Yuqori Topbar */}
        <Topbar
          setIsMobileOpen={setIsMobileOpen}
          isDarkMode={isDarkMode}
          toggleTheme={toggleTheme}
        />

        {/* Faol bo'lim kontenti */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
