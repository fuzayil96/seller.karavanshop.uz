import { useEffect, useState } from "react";
import getData from "../../utils/getData";
import { formatMoney } from "../../utils/formatters";

export default function Settings({ isDarkMode, toggleTheme }) {
  const [loading, setLoading] = useState(true);
  const [tariff, setTariff] = useState(null);
  const [currencies, setCurrencies] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [apiPing, setApiPing] = useState(null);

  useEffect(() => {
    async function loadSettingsData() {
      try {
        setLoading(true);
        const t0 = performance.now();

        const [tariffRes, currRes, stockRes] = await Promise.all([
          getData({ url: "/widgetdata/get", reqData: { id: 42 } }).catch(() => null),
          getData({ url: "/currency/get", reqData: {} }).catch(() => null),
          getData({ url: "/stock/get", reqData: {} }).catch(() => null),
        ]);

        const pingTime = Math.round(performance.now() - t0);
        setApiPing(pingTime);

        setTariff(tariffRes?.ok ? tariffRes.result : null);
        setCurrencies(Array.isArray(currRes?.result) ? currRes.result : []);
        setStocks(
          Array.isArray(stockRes?.result)
            ? stockRes.result.filter((s) => s?.name && s.name !== "---")
            : []
        );
      } catch (err) {
        console.error("Sozlamalarni yuklashda xatolik:", err);
      } finally {
        setLoading(false);
      }
    }

    loadSettingsData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Sarlavha Paneli */}
      <div
        className={`p-6 sm:p-7 rounded-3xl border transition-all ${
          isDarkMode
            ? "bg-[#072f23] border-[#0e4b39] text-white"
            : "bg-white border-emerald-100 text-slate-800 shadow-sm"
        }`}
      >
        <span
          className={`text-xs uppercase font-extrabold tracking-wider ${
            isDarkMode ? "text-emerald-300" : "text-[#065f46]"
          }`}
        >
          Konfiguratsiya & Integratsiya
        </span>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
          Tizim Sozlamalari va REGOS API
        </h1>
        <p className={`text-xs sm:text-sm mt-1 ${isDarkMode ? "text-emerald-200/70" : "text-slate-500"}`}>
          Cloud server ulanishi, valyuta kurslari, do'konlar tarmog'i va interfeys sozlamalari.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* REGOS API Ulanish Holati */}
        <div
          className={`p-6 rounded-3xl border transition-colors space-y-4 ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <span>🌐</span>
              <span>REGOS Cloud API Status</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
              ● Online
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className={`p-3.5 rounded-xl flex justify-between items-center ${
              isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
            }`}>
              <span className="opacity-60">API Gateway:</span>
              <span className="font-mono font-bold">https://api.karavanshop.uz/v1/</span>
            </div>

            <div className={`p-3.5 rounded-xl flex justify-between items-center ${
              isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
            }`}>
              <span className="opacity-60">Server javob tezligi (Ping):</span>
              <span className="font-bold text-emerald-400">
                {apiPing ? `${apiPing} ms` : "O'lchanmoqda..."}
              </span>
            </div>

            <div className={`p-3.5 rounded-xl flex justify-between items-center ${
              isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
            }`}>
              <span className="opacity-60">Protokol turi:</span>
              <span className="font-bold">JSON-RPC 2.0 / REST HTTPS</span>
            </div>

            <div className={`p-3.5 rounded-xl flex justify-between items-center ${
              isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
            }`}>
              <span className="opacity-60">Rasmiy hujjatlar:</span>
              <a
                href="https://docs.regos.uz/en/api"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-sky-400 hover:underline flex items-center gap-1"
              >
                <span>docs.regos.uz</span>
                <span>↗</span>
              </a>
            </div>
          </div>
        </div>

        {/* REGOS Tarif Rejasi */}
        <div
          className={`p-6 rounded-3xl border transition-colors space-y-4 ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <span>⚡</span>
              <span>REGOS Tarif Rejasi</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300">
              {tariff?.name || "Tarif 600"}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className={`p-3.5 rounded-xl flex justify-between items-center ${
              isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
            }`}>
              <span className="opacity-60">Tarif narxi:</span>
              <span className="font-bold">
                {tariff?.price ? formatMoney(tariff.price, "UZS") : "275 000 UZS / oy"}
              </span>
            </div>

            <div className={`p-3.5 rounded-xl flex justify-between items-center ${
              isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
            }`}>
              <span className="opacity-60">Amal qilish muddati:</span>
              <span className="font-bold text-emerald-400">
                {tariff?.paid_until
                  ? new Date(tariff.paid_until).toLocaleDateString("uz-UZ", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Muddatsiz"}
              </span>
            </div>

            <div className={`p-3.5 rounded-xl flex justify-between items-center ${
              isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
            }`}>
              <span className="opacity-60">Faol Filiallar & Do'konlar:</span>
              <span className="font-bold">{stocks.length} ta do'kon ulangan</span>
            </div>
          </div>
        </div>

        {/* Valyutalar va Kurslar */}
        <div
          className={`p-6 rounded-3xl border transition-colors space-y-4 ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
            <span>💱</span>
            <span>Valyutalar va Ayirboshlash Kurslari</span>
          </h2>

          <div className="space-y-2 text-xs">
            {currencies.map((c) => (
              <div
                key={c.id}
                className={`p-3.5 rounded-xl flex justify-between items-center ${
                  isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
                }`}
              >
                <div>
                  <span className="font-bold block">
                    {c.name} ({c.code_chr})
                  </span>
                  <span className="text-[10px] opacity-60">
                    {c.is_base ? "Asosiy hisob valyutasi" : "Chet el valyutasi"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-black text-sm text-emerald-400">
                    1 {c.code_chr} = {formatMoney(c.exchange_rate, "UZS")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interfeys va Tizim Sozlamalari */}
        <div
          className={`p-6 rounded-3xl border transition-colors space-y-4 ${
            isDarkMode
              ? "bg-[#072f23] border-[#0e4b39] text-white"
              : "bg-white border-emerald-100 text-slate-800 shadow-sm"
          }`}
        >
          <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
            <span>⚙️</span>
            <span>Interfeys Sozlamalari</span>
          </h2>

          <div className="space-y-3 text-xs">
            <div className={`p-3.5 rounded-xl flex justify-between items-center ${
              isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
            }`}>
              <div>
                <span className="font-bold block">Tungi / Kunduzgi Rejim</span>
                <span className="text-[10px] opacity-60">
                  {isDarkMode ? "Darkgreen (To'q yashil) rejim" : "Light (Yorug') rejim"}
                </span>
              </div>
              <button
                onClick={toggleTheme}
                className={`px-3 py-1.5 rounded-xl font-bold border transition ${
                  isDarkMode
                    ? "bg-[#064e3b] text-amber-300 border-[#0e4b39]"
                    : "bg-white text-emerald-800 border-slate-200"
                }`}
              >
                {isDarkMode ? "☀️ Yorug' rejim" : "🌙 Tungi rejim"}
              </button>
            </div>

            <div className={`p-3.5 rounded-xl flex justify-between items-center ${
              isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
            }`}>
              <div>
                <span className="font-bold block">Chop etish formati</span>
                <span className="text-[10px] opacity-60">
                  Akt sverka va Seller hisoboti uchun
                </span>
              </div>
              <span className="font-bold text-emerald-400">A4 Standart PDF</span>
            </div>

            <div className={`p-3.5 rounded-xl flex justify-between items-center ${
              isDarkMode ? "bg-[#041f17]" : "bg-slate-50"
            }`}>
              <div>
                <span className="font-bold block">Keshni tozalash</span>
                <span className="text-[10px] opacity-60">
                  Mahalliy brauzer xotirasini yangilash
                </span>
              </div>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-3 py-1.5 rounded-xl font-bold bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 transition"
              >
                Tozalash 🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
