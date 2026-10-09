import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

export default function Login() {
  const { user, login, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = (e) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#f4f9f6] dark:bg-[#02130e] text-slate-800 dark:text-white transition-colors duration-200">
      <div className="bg-white dark:bg-[#052118] p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-emerald-900/30 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            Karavan Shop
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">
            Tizimga kirish uchun ma'lumotlarni kiriting
          </p>
        </div>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Foydalanuvchi nomi
            </label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#02130e] border border-slate-200 dark:border-emerald-900/30 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              required
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
              Parol
            </label>
            <input 
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#02130e] border border-slate-200 dark:border-emerald-900/30 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
              required
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="mt-2 w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
          >
            Tizimga kirish
          </button>
        </form>
      </div>
    </div>
  );
}
