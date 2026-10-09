import { getPrimaryPhone } from "../utils/formatters";

export default function PartnersTable({
  loading,
  partners,
  onSelectPartner,
  isDarkMode,
}) {
  if (loading) {
    return (
      <div
        className={`p-12 text-center rounded-2xl border ${
          isDarkMode
            ? "bg-[#072f23] border-[#0e4b39] text-emerald-200/70"
            : "bg-white border-emerald-100 text-slate-500"
        }`}
      >
        <div
          className={`inline-block animate-spin rounded-full h-8 w-8 border-2 mb-3 ${
            isDarkMode
              ? "border-[#0e4b39] border-t-emerald-400"
              : "border-emerald-200 border-t-emerald-600"
          }`}
        ></div>
        <p className="text-sm">Hamkorlar yuklanmoqda...</p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border overflow-hidden shadow-sm transition-colors ${
        isDarkMode
          ? "bg-[#072f23] border-[#0e4b39]"
          : "bg-white border-emerald-100"
      }`}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className={`border-b text-xs uppercase tracking-wider font-semibold ${
                isDarkMode
                  ? "bg-[#041f17] border-[#0e4b39] text-emerald-200/60"
                  : "bg-emerald-50/70 border-emerald-100 text-[#064e3b]"
              }`}
            >
              <th className="py-3.5 px-5 w-16 text-center">№</th>
              <th className="py-3.5 px-5">Hamkor nomi</th>
              <th className="py-3.5 px-5">Telefon</th>
              <th className="py-3.5 px-5 text-right"></th>
            </tr>
          </thead>
          <tbody
            className={`divide-y text-sm ${
              isDarkMode ? "divide-[#0e4b39]/60" : "divide-slate-100"
            }`}
          >
            {partners.length > 0 ? (
              partners.map((partner, index) => {
                const phone = getPrimaryPhone(partner.phones);
                return (
                  <tr
                    key={partner.id}
                    onClick={() => onSelectPartner(partner)}
                    className={`cursor-pointer transition ${
                      isDarkMode
                        ? "hover:bg-[#0c3d2e] text-slate-200"
                        : "hover:bg-emerald-50/50 text-slate-800"
                    }`}
                  >
                    <td
                      className={`py-3.5 px-5 text-center text-xs font-mono ${
                        isDarkMode ? "text-emerald-300/60" : "text-slate-400"
                      }`}
                    >
                      {index + 1}
                    </td>
                    <td className="py-3.5 px-5 font-semibold">
                      {partner.name || "Noma'lum"}
                    </td>
                    <td
                      className={`py-3.5 px-5 text-xs ${
                        isDarkMode ? "text-emerald-200/70" : "text-slate-500"
                      }`}
                    >
                      {phone || "—"}
                    </td>
                    <td
                      className={`py-3.5 px-5 text-right font-medium text-xs ${
                        isDarkMode ? "text-emerald-400" : "text-emerald-700"
                      }`}
                    >
                      <span>→</span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className={`py-12 px-5 text-center text-sm ${
                    isDarkMode ? "text-emerald-200/50" : "text-slate-400"
                  }`}
                >
                  Hech qanday hamkor topilmadi
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {partners.length > 0 && (
        <div
          className={`px-5 py-3 border-t text-xs flex justify-between items-center ${
            isDarkMode
              ? "bg-[#041f17] border-[#0e4b39] text-emerald-200/60"
              : "bg-emerald-50/40 border-emerald-100 text-slate-500"
          }`}
        >
          <span>Ko‘rsatilmoqda: {partners.length} ta</span>
          <span>Batafsil ma‘lumot va akt sverka uchun bosing</span>
        </div>
      )}
    </div>
  );
}
