import { formatMoney } from "./formatters";

export function printSellerReport({
  sellers,
  dateLabel,
  globalCommissionRate,
  totalNetSales,
  totalCommissionSum,
  totalChequesCount,
  selectedBranch,
}) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Iltimos, brauzerda yangi oyna (pop-up) ochilishiga ruxsat bering!");
    return;
  }

  const branchLabel =
    selectedBranch === "all" ? "Barcha filiallar" : selectedBranch;

  const rowsHtml = (sellers || [])
    .map(
      (s, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
        <td style="padding: 7px 10px; text-align: center; color: #64748b;">${idx + 1}</td>
        <td style="padding: 7px 10px; font-weight: 600; color: #0f172a;">
          ${s.name}
          ${s.barcode ? `<div style="font-size: 10px; color: #64748b; font-family: monospace;">ID: ${s.barcode}</div>` : ""}
        </td>
        <td style="padding: 7px 10px; color: #334155;">${s.group || "—"}</td>
        <td style="padding: 7px 10px; text-align: center; font-weight: 600;">${s.chequesCount} ta</td>
        <td style="padding: 7px 10px; text-align: right; color: #334155;">${formatMoney(s.totalSales, "UZS")}</td>
        <td style="padding: 7px 10px; text-align: right; color: #e11d48;">${s.returnsSum > 0 ? `-${formatMoney(s.returnsSum, "UZS")}` : "0"}</td>
        <td style="padding: 7px 10px; text-align: right; font-weight: 700; color: #047857;">${formatMoney(s.netSales, "UZS")}</td>
        <td style="padding: 7px 10px; text-align: center; font-weight: 600; color: #0284c7;">${s.rate}%</td>
        <td style="padding: 7px 10px; text-align: right; font-weight: 800; color: #b45309; background-color: #fefce8;">${formatMoney(s.bonusSum, "UZS")}</td>
      </tr>
    `
    )
    .join("");

  const printDate = new Date().toLocaleString("ru-RU");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="uz">
    <head>
      <meta charset="UTF-8">
      <title>Sotuvchilar sotuvi va foiz hisoboti - ${dateLabel}</title>
      <style>
        @page {
          size: A4 landscape;
          margin: 12mm 12mm;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
          color: #1e293b;
          margin: 0;
          padding: 0;
          background-color: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #064e3b;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .brand {
          font-size: 20px;
          font-weight: 800;
          color: #064e3b;
          letter-spacing: 0.5px;
        }
        .subbrand {
          font-size: 11px;
          color: #64748b;
          text-transform: uppercase;
        }
        .title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 4px;
        }
        .meta-box {
          text-align: right;
          font-size: 11px;
          color: #475569;
          line-height: 1.5;
        }
        .stats-grid {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        .stat-card {
          flex: 1;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          text-align: center;
        }
        .stat-title {
          font-size: 10px;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
        }
        .stat-value {
          font-size: 15px;
          font-weight: 800;
          color: #064e3b;
          margin-top: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
        }
        th {
          background-color: #064e3b;
          color: #ffffff;
          padding: 8px 10px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-weight: 600;
        }
        .footer {
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #64748b;
          border-top: 1px dashed #cbd5e1;
          padding-top: 12px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand">KARAVAN SHOP</div>
          <div class="subbrand">REGOS ERP Tizimi</div>
          <div class="title">Sotuvchilar (Sellerlar) bo'yicha savdo va foiz (bonus) hisoboti</div>
        </div>
        <div class="meta-box">
          <div><strong>Sana:</strong> ${dateLabel}</div>
          <div><strong>Filial:</strong> ${branchLabel}</div>
          <div><strong>Asosiy stavka:</strong> ${globalCommissionRate}%</div>
          <div><strong>Chop etildi:</strong> ${printDate}</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-title">Jami sof sotuv</div>
          <div class="stat-value" style="color: #047857;">${formatMoney(totalNetSales, "UZS")}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Jami to'lanadigan bonus</div>
          <div class="stat-value" style="color: #b45309;">${formatMoney(totalCommissionSum, "UZS")}</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Cheklar soni</div>
          <div class="stat-value">${totalChequesCount} ta</div>
        </div>
        <div class="stat-card">
          <div class="stat-title">Faol sellerlar</div>
          <div class="stat-value">${sellers.length} nafar</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 35px; text-align: center;">№</th>
            <th style="text-align: left;">Sotuvchi (Seller)</th>
            <th style="text-align: left;">Filial / Do'kon</th>
            <th style="text-align: center;">Cheklar</th>
            <th style="text-align: right;">Jami sotuv</th>
            <th style="text-align: right;">Qaytarish</th>
            <th style="text-align: right;">Sof sotuv</th>
            <th style="text-align: center;">Foiz</th>
            <th style="text-align: right;">Hisoblangan bonus</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr style="background-color: #f1f5f9; font-weight: bold; font-size: 12px; border-top: 2px solid #064e3b;">
            <td colspan="3" style="padding: 10px; text-align: right; text-transform: uppercase;">Jami:</td>
            <td style="padding: 10px; text-align: center;">${totalChequesCount} ta</td>
            <td style="padding: 10px; text-align: right;">—</td>
            <td style="padding: 10px; text-align: right;">—</td>
            <td style="padding: 10px; text-align: right; color: #047857; font-size: 13px;">${formatMoney(totalNetSales, "UZS")}</td>
            <td style="padding: 10px; text-align: center;">${globalCommissionRate}%</td>
            <td style="padding: 10px; text-align: right; color: #b45309; font-size: 13px;">${formatMoney(totalCommissionSum, "UZS")}</td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        <div>Mas'ul shaxs imzosi: _____________________</div>
        <div>Hisobchi imzosi: _____________________</div>
        <div>Hujjat avtomatik tarzda REGOS Cloud API ma'lumotlari asosida yaratildi</div>
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
