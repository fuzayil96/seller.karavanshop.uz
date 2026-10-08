import * as XLSX from "xlsx";

/**
 * Sellerlar sotuvi va bonuslari bo'yicha ma'lumotlarni zamonaviy Excel (.xlsx) formatida yuklab beruvchi funksiya
 */
export function exportSellerExcel({
  sellers,
  dateLabel,
  globalCommissionRate,
  totalNetSales,
  totalCommissionSum,
  totalChequesCount,
  selectedBranch,
}) {
  try {
    const branchLabel =
      selectedBranch === "all" ? "Barcha filiallar" : selectedBranch;
    const exportTime = new Date().toLocaleString("ru-RU");

    // 1. Excel varag'ining sarlavha va meta-ma'lumot qismlari
    const sheetData = [
      ["KARAVAN SHOP — SELLERLAR SOTUVI VA BONUS (FOIZ) HISOBOTI"],
      [],
      ["Hisobot davri:", dateLabel],
      ["Filial:", branchLabel],
      ["Asosiy foiz stavkasi:", `${globalCommissionRate}%`],
      ["Yuklab olingan vaqt:", exportTime],
      ["Faol sellerlar soni:", `${sellers.length} nafar`],
      [],
      // 2. Jadval ustunlari sarlavhasi
      [
        "№",
        "Sotuvchi (Seller)",
        "Filial / Do'kon",
        "Seller ID (Shtrix-kod)",
        "Login",
        "Cheklar soni",
        "Qaytarish soni",
        "Jami sotuv (UZS)",
        "Qaytarish summasi (UZS)",
        "Sof sotuv (UZS)",
        "Sotuv ulushi (%)",
        "Foiz stavkasi (%)",
        "Hisoblangan bonus (UZS)",
      ],
    ];

    let totalGrossSum = 0;
    let totalReturnsSum = 0;
    let totalReturnsCount = 0;

    // 3. Ma'lumot qatorlari
    sellers.forEach((s, idx) => {
      totalGrossSum += Number(s.totalSales || 0);
      totalReturnsSum += Number(s.returnsSum || 0);
      totalReturnsCount += Number(s.returnsCount || 0);

      sheetData.push([
        idx + 1,
        s.name || "—",
        s.group || "—",
        s.barcode || "—",
        s.login || "—",
        Number(s.chequesCount || 0),
        Number(s.returnsCount || 0),
        Number(s.totalSales || 0),
        Number(s.returnsSum || 0),
        Number(s.netSales || 0),
        `${Number(s.sharePercent || 0).toFixed(1)}%`,
        `${Number(s.rate || 0)}%`,
        Number(s.bonusSum || 0),
      ]);
    });

    // 4. Jami yakuniy qator
    sheetData.push([]);
    sheetData.push([
      "JAMI",
      "",
      "",
      "",
      "",
      totalChequesCount,
      totalReturnsCount,
      totalGrossSum,
      totalReturnsSum,
      totalNetSales,
      "100%",
      "—",
      totalCommissionSum,
    ]);

    // 5. WorkSheet yaratish
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

    // Ustunlar kengligini avtomatik moslashtirish (chiroyli ko'rinish uchun)
    worksheet["!cols"] = [
      { wch: 5 },  // №
      { wch: 28 }, // Sotuvchi nomi
      { wch: 20 }, // Filial
      { wch: 18 }, // ID
      { wch: 12 }, // Login
      { wch: 14 }, // Cheklar soni
      { wch: 14 }, // Qaytarish soni
      { wch: 18 }, // Jami sotuv
      { wch: 18 }, // Qaytarish summasi
      { wch: 18 }, // Sof sotuv
      { wch: 14 }, // Ulush
      { wch: 16 }, // Foiz stavkasi
      { wch: 22 }, // Hisoblangan bonus
    ];

    // 6. WorkBook yaratish va varaqni qo'shish
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sellerlar_Sotuvi");

    // 7. Fayl nomini hosil qilish va yuklash
    const safeDate = String(dateLabel)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const fileName = `Karavan_Sellerlar_Sotuvi_${safeDate}.xlsx`;

    XLSX.writeFile(workbook, fileName);
    return true;
  } catch (error) {
    console.error("Excel faylni yaratishda xatolik:", error);
    alert("Excel faylini yuklab olishda xatolik yuz berdi: " + error.message);
    return false;
  }
}
