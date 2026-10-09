import React, { useState, useEffect } from "react";
import { getUsers, addUser, deleteUser, getAuditLogs } from "../../services/authService";
import { getSettings, saveSettings } from "../../services/settingsService";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";

const ALL_PERMISSIONS = [
  { id: "/", label: "Dashboard (BI)" },
  { id: "/sellers", label: "Sellerlar" },
  { id: "/partners", label: "Hamkorlar" },
  { id: "/stock", label: "Ombor Qoldiqlari" },
  { id: "/admin", label: "Admin Panel" },
];

export default function AdminPanel({ isDarkMode }) {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState({ allowedPartnerCategories: [] });
  const [categoriesInput, setCategoriesInput] = useState("");
  const [activeTab, setActiveTab] = useState("users"); // 'users', 'audit', 'settings'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    username: "",
    password: "",
    role: "seller",
    sellerId: "",
    permissions: [],
  });

  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsersList(getUsers());
    setAuditLogs(getAuditLogs());
    const currentSettings = getSettings();
    setSettings(currentSettings);
    setCategoriesInput(currentSettings.allowedPartnerCategories.join(", "));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePermissionToggle = (permId) => {
    setFormData(prev => {
      const perms = prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId];
      return { ...prev, permissions: perms };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const newUser = {
        telegramId: Date.now(), // Generate a unique ID for new users
        firstName: formData.firstName,
        username: formData.username,
        password: formData.password,
        role: formData.role,
        sellerId: formData.sellerId ? Number(formData.sellerId) : null,
        sellerStockPercentages: {},
        permissions: formData.permissions,
      };
      addUser(newUser);
      loadData();
      setIsModalOpen(false);
      setFormData({ firstName: "", username: "", password: "", role: "seller", sellerId: "", permissions: [] });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDelete = (telegramId) => {
    if (window.confirm("Rostdan ham bu foydalanuvchini o'chirmoqchimisiz?")) {
      deleteUser(telegramId);
      loadData();
    }
  };

  const handleSaveSettings = () => {
    const categoriesArray = categoriesInput.split(",").map(c => c.trim()).filter(Boolean);
    saveSettings({ allowedPartnerCategories: categoriesArray });
    loadData();
    alert("Sozlamalar saqlandi!");
  };

  return (
    <div className={`space-y-6 ${isDarkMode ? "text-white" : "text-slate-800"}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Admin Panel</h1>
          <p className={`mt-1 text-sm ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
            Tizim foydalanuvchilari va harakatlar tarixi
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-lg shadow-emerald-500/20 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Yangi foydalanuvchi
        </button>
      </div>

      <div className="flex gap-6 border-b border-emerald-900/20 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("users")}
          className={`font-bold pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "users" ? "border-emerald-500 text-emerald-500" : "border-transparent opacity-60"}`}
        >
          Foydalanuvchilar
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`font-bold pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "audit" ? "border-emerald-500 text-emerald-500" : "border-transparent opacity-60"}`}
        >
          Harakatlar tarixi
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`font-bold pb-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === "settings" ? "border-emerald-500 text-emerald-500" : "border-transparent opacity-60"}`}
        >
          Tizim Sozlamalari
        </button>
      </div>

      {activeTab === "users" && (
        <div className={`overflow-x-auto rounded-2xl shadow-sm border ${isDarkMode ? "bg-[#052118] border-emerald-900/30" : "bg-white border-slate-200"}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-sm ${isDarkMode ? "border-emerald-900/30 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                <th className="p-4 font-semibold">Ism</th>
                <th className="p-4 font-semibold">Login</th>
                <th className="p-4 font-semibold">Rol</th>
                <th className="p-4 font-semibold">Huquqlar (Ruxsatlar)</th>
                <th className="p-4 font-semibold text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/10 dark:divide-emerald-900/30">
              {usersList.map((u) => (
                <tr key={u.telegramId} className={`transition-colors ${isDarkMode ? "hover:bg-[#072f23]" : "hover:bg-slate-50"}`}>
                  <td className="p-4 font-medium">{u.firstName}</td>
                  <td className="p-4">{u.username}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                      u.role === "admin" 
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" 
                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    }`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {u.permissions?.map(p => (
                        <span key={p} className="text-[10px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded">{p}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {u.username !== "admin" && (
                      <button
                        onClick={() => handleDelete(u.telegramId)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="O'chirish"
                      >
                        O'chirish
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "audit" && (
        <div className={`overflow-x-auto rounded-2xl shadow-sm border ${isDarkMode ? "bg-[#052118] border-emerald-900/30" : "bg-white border-slate-200"}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-sm ${isDarkMode ? "border-emerald-900/30 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                <th className="p-4 font-semibold">Vaqt</th>
                <th className="p-4 font-semibold">User ID</th>
                <th className="p-4 font-semibold">Harakat</th>
                <th className="p-4 font-semibold">Tafsilotlar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-900/10 dark:divide-emerald-900/30">
              {auditLogs.map((log) => (
                <tr key={log.id} className={`transition-colors ${isDarkMode ? "hover:bg-[#072f23]" : "hover:bg-slate-50"}`}>
                  <td className="p-4">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-4">{log.telegramId}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${log.action === 'LOGIN' ? 'bg-green-500/20 text-green-500' : 'bg-orange-500/20 text-orange-500'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4">{log.details}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr><td colSpan="4" className="p-4 text-center opacity-50">Hozircha tarix yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "settings" && (
        <div className={`p-6 rounded-2xl shadow-sm border ${isDarkMode ? "bg-[#052118] border-emerald-900/30" : "bg-white border-slate-200"}`}>
          <h2 className="text-xl font-bold mb-4">Hamkorlar Kategoriyalari</h2>
          <p className={`text-sm mb-4 ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
            "Hamkorlar" sahifasida ko'rinishi kerak bo'lgan hamkor kategoriyalarini vergul bilan ajratib yozing. Faqat shu kategoriyadagi hamkorlar sahifada ko'rinadi.
          </p>
          <div className="space-y-4 max-w-2xl">
            <input
              type="text"
              value={categoriesInput}
              onChange={(e) => setCategoriesInput(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? "bg-[#02130e] border-emerald-900/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}
              placeholder="Ta'minotchilar, Kuryerlar, VIP Mijozlar"
            />
            <button
              onClick={handleSaveSettings}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
            >
              Sozlamalarni saqlash
            </button>
          </div>
        </div>
      )}

      {/* Yangi Foydalanuvchi Modali */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? "bg-[#052118]" : "bg-white"}`}>
            <div className={`px-6 py-4 border-b flex justify-between items-center ${isDarkMode ? "border-emerald-900/30" : "border-slate-200"}`}>
              <h3 className="text-lg font-bold">Yangi foydalanuvchi</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ism</label>
                <input type="text" name="firstName" required value={formData.firstName} onChange={handleInputChange} className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? "bg-[#02130e] border-emerald-900/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Login</label>
                <input type="text" name="username" required value={formData.username} onChange={handleInputChange} className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? "bg-[#02130e] border-emerald-900/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Parol</label>
                <input type="text" name="password" required value={formData.password} onChange={handleInputChange} className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? "bg-[#02130e] border-emerald-900/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rol</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? "bg-[#02130e] border-emerald-900/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`}>
                    <option value="seller">Seller</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                {formData.role === "seller" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Seller ID</label>
                    <input type="number" name="sellerId" value={formData.sellerId} onChange={handleInputChange} className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? "bg-[#02130e] border-emerald-900/30 text-white" : "bg-slate-50 border-slate-200 text-slate-900"}`} />
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Huquqlar (Ruxsat etilgan sahifalar)</label>
                <div className="grid grid-cols-2 gap-2">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.permissions.includes(p.id)} 
                        onChange={() => handlePermissionToggle(p.id)}
                        className="rounded border-emerald-900/30 text-emerald-500 focus:ring-emerald-500 bg-[#02130e]"
                      />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>Bekor qilish</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors shadow-lg shadow-emerald-500/20">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
