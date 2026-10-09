import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";

// Mock data for Regos API "ItemStockLimit/Get"
const MOCK_STOCK = [
  { id: 101, name: "Iphone 15 Pro", barcode: "123456789", category: "Telefonlar", price: 12000000, quantity: 45, store: "Asosiy Ombor" },
  { id: 102, name: "MacBook Air M2", barcode: "987654321", category: "Noutbuklar", price: 15000000, quantity: 12, store: "Asosiy Ombor" },
  { id: 103, name: "AirPods Pro", barcode: "112233445", category: "Aksessuarlar", price: 2500000, quantity: 105, store: "Filial 1" },
  { id: 104, name: "Samsung S24 Ultra", barcode: "554433221", category: "Telefonlar", price: 14000000, quantity: 8, store: "Asosiy Ombor" },
];

export default function Stock({ isDarkMode }) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredStock = MOCK_STOCK.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.barcode.includes(searchTerm)
  );

  return (
    <div className={`space-y-6 ${isDarkMode ? "text-white" : "text-slate-800"}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ombor Qoldiqlari</h1>
          <p className={`mt-1 text-sm ${isDarkMode ? "text-emerald-400" : "text-emerald-600"}`}>
            Haqiqiy vaqtda ombordagi tovarlar va ularning miqdorlari (Regos API Mock)
          </p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <input 
          type="text" 
          placeholder="Shtrixkod yoki nom bo'yicha qidirish..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full max-w-md px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? "bg-[#052118] border-emerald-900/30 text-white" : "bg-white border-slate-200 text-slate-900"}`}
        />
      </div>

      <div className={`overflow-x-auto rounded-2xl shadow-sm border ${isDarkMode ? "bg-[#052118] border-emerald-900/30" : "bg-white border-slate-200"}`}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={`border-b text-sm ${isDarkMode ? "border-emerald-900/30 text-slate-400" : "border-slate-200 text-slate-500"}`}>
              <th className="p-4 font-semibold">Shtrixkod</th>
              <th className="p-4 font-semibold">Nomi</th>
              <th className="p-4 font-semibold">Kategoriya</th>
              <th className="p-4 font-semibold">Narxi</th>
              <th className="p-4 font-semibold text-right">Qoldiq</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-emerald-900/10 dark:divide-emerald-900/30">
            {filteredStock.map((item) => (
              <tr key={item.id} className={`transition-colors ${isDarkMode ? "hover:bg-[#072f23]" : "hover:bg-slate-50"}`}>
                <td className="p-4 font-mono text-xs">{item.barcode}</td>
                <td className="p-4 font-bold">{item.name}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${isDarkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>
                    {item.category}
                  </span>
                </td>
                <td className="p-4">{item.price.toLocaleString("ru-RU")} UZS</td>
                <td className="p-4 text-right">
                  <span className={`px-3 py-1 font-bold rounded-lg ${
                    item.quantity > 20 
                      ? "bg-green-500/20 text-green-600 dark:text-green-400" 
                      : "bg-red-500/20 text-red-600 dark:text-red-400"
                  }`}>
                    {item.quantity} ta
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
