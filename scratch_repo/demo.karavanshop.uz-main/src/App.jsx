import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./components/dashboard/Dashboard";
import Partners from "./components/Partners";
import Sellers from "./components/sellers/Sellers";
import Login from "./components/auth/Login";
import AdminPanel from "./components/admin/AdminPanel";
import Stock from "./components/stock/Stock";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, loading } = useAuth();
  
  // Dark / Light mode (localStorage xotirasida saqlanadi)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved) return saved === "dark";
      return true; // Birlamchi to'q yashil (Darkgreen) rejim
    } catch {
      return true;
    }
  });

  const toggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("theme", next ? "dark" : "light");
      } catch (err) {
        console.error("Theme saqlashda xato:", err);
      }
      return next;
    });
  };

  // HTML / Body fon rangini rejimga qarab yangilash
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#02130e";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#f4f9f6";
    }
  }, [isDarkMode]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-[#f4f9f6] dark:bg-[#02130e] text-slate-800 dark:text-white">Yuklanmoqda...</div>;
  }

  if (!user) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login isDarkMode={isDarkMode} />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter>
      <Layout isDarkMode={isDarkMode} toggleTheme={toggleTheme}>
        <Routes>
          {/* 1. Asosiy Executive BI Dashboard */}
          <Route path="/" element={<Dashboard isDarkMode={isDarkMode} />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />

          {/* 2. Ombor qoldiqlari */}
          <Route path="/stock" element={<Stock isDarkMode={isDarkMode} />} />

          {/* 3. Sellerlar & Sotuv foizi */}
          <Route path="/sellers" element={<Sellers isDarkMode={isDarkMode} />} />

          {/* 4. Hamkorlar & Kontragentlar (Akt Sverka) */}
          <Route
            path="/partners"
            element={<Partners isDarkMode={isDarkMode} toggleTheme={toggleTheme} />}
          />

          {/* 5. Admin Panel */}
          <Route path="/admin" element={<AdminPanel isDarkMode={isDarkMode} />} />

          {/* Boshqa barcha sahifalar boshqaruv paneliga yo'naltiriladi */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
