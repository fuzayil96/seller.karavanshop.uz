import React, { useState, useEffect } from "react";
import { getUsers, updateUser, deleteUser } from "../../services/authService";

export default function UsersAdmin({ isDarkMode, sellersStats }) {
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const handleRoleChange = (telegramId, newRole) => {
    const updated = updateUser(telegramId, { role: newRole });
    if (updated) setUsers(getUsers());
  };

  const handleSellerSelect = (telegramId, sellerId) => {
    const updated = updateUser(telegramId, { sellerId: sellerId });
    if (updated) setUsers(getUsers());
  };

  const handleDelete = (telegramId) => {
    if (window.confirm("Foydalanuvchini o'chirishni tasdiqlaysizmi?")) {
      deleteUser(telegramId);
      setUsers(getUsers());
    }
  };

  return (
    <div className={`mt-8 p-5 rounded-2xl border shadow-sm ${
      isDarkMode ? "bg-[#072f23] border-[#0e4b39]" : "bg-white border-emerald-100"
    }`}>
      <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2">
        <span>🛡️</span> Telegram orqali kirish huquqlari (Admin Panel)
      </h2>
      <div className="overflow-x-auto">
        <table className={`w-full text-left text-xs ${isDarkMode ? "text-emerald-100" : "text-slate-800"}`}>
          <thead>
            <tr className={isDarkMode ? "bg-[#041f17] text-emerald-300" : "bg-emerald-50 text-[#065f46]"}>
              <th className="p-3 font-semibold rounded-tl-xl">Foydalanuvchi</th>
              <th className="p-3 font-semibold">Tizim Rol</th>
              <th className="p-3 font-semibold">Bog'langan Seller</th>
              <th className="p-3 font-semibold rounded-tr-xl text-right">Harakat</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.telegramId} className={`border-b ${isDarkMode ? "border-[#0e4b39]" : "border-emerald-50"}`}>
                <td className="p-3">
                  <div className="font-bold">{u.firstName}</div>
                  <div className="text-[10px] opacity-60">@{u.username || 'yoq'} (ID: {u.telegramId})</div>
                </td>
                <td className="p-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.telegramId, e.target.value)}
                    className={`p-1.5 rounded-lg border text-xs focus:outline-none ${
                      isDarkMode 
                        ? "bg-[#041f17] border-[#0e4b39] text-emerald-200" 
                        : "bg-white border-emerald-200 text-slate-800"
                    }`}
                  >
                    <option value="admin">Admin</option>
                    <option value="seller">Seller (Sotuvchi)</option>
                    <option value="pending">Kutilmoqda</option>
                  </select>
                </td>
                <td className="p-3">
                  {u.role === 'seller' ? (
                    <select
                      value={u.sellerId || ""}
                      onChange={(e) => handleSellerSelect(u.telegramId, e.target.value)}
                      className={`p-1.5 rounded-lg border text-xs focus:outline-none w-full max-w-[200px] ${
                        isDarkMode 
                          ? "bg-[#041f17] border-[#0e4b39] text-emerald-200" 
                          : "bg-white border-emerald-200 text-slate-800"
                      }`}
                    >
                      <option value="">-- Sellerni tanlang --</option>
                      {sellersStats?.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.group})</option>
                      ))}
                    </select>
                  ) : (
                    <span className="opacity-50 text-[10px]">-</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  {u.telegramId !== 1 && (
                    <button 
                      onClick={() => handleDelete(u.telegramId)}
                      className="px-2 py-1 rounded-md bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
                    >
                      O'chirish
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="p-4 text-center opacity-50">Tizimda foydalanuvchilar mavjud emas</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
