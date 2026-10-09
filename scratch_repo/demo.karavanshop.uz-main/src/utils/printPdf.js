import { formatMoney } from "./formatters";

// Akt Sverki hisobotini A4 formatda PDF sifatida saqlash / chop etish
export function handlePrintPdf(partner, balanceData, periodDays) {
  if (!partner || !balanceData) return;
  const periodLabel =
    periodDays === 30
      ? "Oxirgi 30 kun"
      : periodDays === 90
      ? "Oxirgi 90 kun"
      : periodDays === 365
      ? "Oxirgi 1 yil"
      : "Barcha davr";

  const phoneStr = Array.isArray(partner.phones)
    ? partner.phones.join(", ")
    : partner.phones || "—";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Iltimos, brauzerda yangi oyna (pop-up) ochilishiga ruxsat bering!");
    return;
  }

  const currenciesHtml = (balanceData.currencies || [])
    .map(
      (c) => `
      <tr>
        <td style="padding: 8px 12px; font-weight: bold; border: 1px solid #cbd5e1;">${c.currencyName}</td>
        <td style="padding: 8px 12px; text-align: right; border: 1px solid #cbd5e1;">${formatMoney(c.startAmount)} ${c.currencyName}</td>
        <td style="padding: 8px 12px; text-align: right; color: #047857; font-weight: bold; border: 1px solid #cbd5e1;">+${formatMoney(c.debit)} ${c.currencyName}</td>
        <td style="padding: 8px 12px; text-align: right; color: #b91c1c; font-weight: bold; border: 1px solid #cbd5e1;">-${formatMoney(c.credit)} ${c.currencyName}</td>
        <td style="padding: 8px 12px; text-align: right; font-weight: bold; border: 1px solid #cbd5e1;">${formatMoney(c.endAmount)} ${c.currencyName}</td>
      </tr>
    `
    )
    .join("");

  const operationsHtml = (balanceData.operations || [])
    .map(
      (op, index) => `
      <tr>
        <td style="padding: 6px 10px; text-align: center; border: 1px solid #e2e8f0;">${index + 1}</td>
        <td style="padding: 6px 10px; border: 1px solid #e2e8f0; white-space: nowrap;">${op.date}</td>
        <td style="padding: 6px 10px; border: 1px solid #e2e8f0;"><strong>${op.documentType}</strong> <span style="color: #64748b;">(${op.documentCode})</span></td>
        <td style="padding: 6px 10px; text-align: right; color: #047857; font-weight: 600; border: 1px solid #e2e8f0;">
          ${op.debit > 0 ? `+${formatMoney(op.debit)} ${op.currencyName}` : "—"}
        </td>
        <td style="padding: 6px 10px; text-align: right; color: #b91c1c; font-weight: 600; border: 1px solid #e2e8f0;">
          ${op.credit > 0 ? `-${formatMoney(op.credit)} ${op.currencyName}` : "—"}
        </td>
        <td style="padding: 6px 10px; text-align: right; font-weight: 600; border: 1px solid #e2e8f0;">
          ${formatMoney(op.endAmount)} ${op.currencyName}
        </td>
      </tr>
    `
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="uz">
    <head>
      <meta charset="UTF-8">
      <title>Akt Sverki - ${partner.name}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          color: #1e293b;
          margin: 25px;
          font-size: 13px;
          line-height: 1.4;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #064e3b;
          padding-bottom: 12px;
        }
        .header h1 {
          margin: 0 0 6px 0;
          font-size: 20px;
          color: #064e3b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .header p {
          margin: 2px 0;
          color: #475569;
          font-size: 13px;
        }
        .info-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          background: #f8fafc;
          padding: 12px 18px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        .info-col p {
          margin: 4px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 12px;
        }
        th {
          background-color: #064e3b;
          color: white;
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          border: 1px solid #064e3b;
        }
        th.text-right, td.text-right { text-align: right; }
        th.text-center, td.text-center { text-align: center; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .signatures {
          margin-top: 35px;
          display: flex;
          justify-content: space-between;
          page-break-inside: avoid;
        }
        .sig-block {
          width: 44%;
          border-top: 1px solid #334155;
          padding-top: 8px;
          margin-top: 35px;
        }
        .sig-block p { margin: 3px 0; }
        .btn-print {
          padding: 9px 18px;
          background: #065f46;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
        }
        @media print {
          .no-print { display: none !important; }
          body { margin: 8mm 12mm; }
          @page { size: A4; margin: 10mm 10mm; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: #64748b; font-size: 13px;">Chop etish yoki PDF sifatida saqlash oynasi:</span>
        <button class="btn-print" onclick="window.print()">
          🖨️ PDF sifatida saqlash / Chop etish
        </button>
      </div>

      <div class="header">
        <h1>Solishtiruv Dalolatnomasi (Akt Sverki)</h1>
        <p><strong>Tashkilot:</strong> KARAVAN &nbsp;|&nbsp; <strong>Hamkor:</strong> ${partner.name}</p>
        <p><strong>Davr:</strong> ${periodLabel} &nbsp;|&nbsp; <strong>Holati:</strong> ${new Date().toLocaleDateString("ru-RU")}</p>
      </div>

      <div class="info-grid">
        <div class="info-col">
          <p><strong>Tashkilot:</strong> KARAVAN </p>
          <p><strong>Hujjat sanasi:</strong> ${new Date().toLocaleDateString("ru-RU")}</p>
        </div>
        <div class="info-col">
          <p><strong>Hamkor:</strong> ${partner.name}</p>
          <p><strong>Telefon:</strong> ${phoneStr}</p>
        </div>
      </div>

      <h3 style="margin-bottom: 8px; color: #064e3b; font-size: 14px;">1. Umumiy hisob-kitob (Valyutalar bo'yicha)</h3>
      <table>
        <thead>
          <tr>
            <th>Valyuta</th>
            <th class="text-right">Boshlang‘ich qoldiq</th>
            <th class="text-right">Kirim (+)</th>
            <th class="text-right">Chiqim (-)</th>
            <th class="text-right">Yakuniy qoldiq</th>
          </tr>
        </thead>
        <tbody>
          ${currenciesHtml || '<tr><td colspan="5" class="text-center" style="padding: 10px;">Maʼlumot topilmadi</td></tr>'}
        </tbody>
      </table>

      <h3 style="margin-bottom: 8px; color: #064e3b; font-size: 14px;">2. Operatsiyalar va harakatlar tafsiloti (${(balanceData.operations || []).length} ta)</h3>
      <table>
        <thead>
          <tr>
            <th class="text-center" style="width: 36px;">№</th>
            <th style="width: 130px;">Sana</th>
            <th>Hujjat turi va raqami</th>
            <th class="text-right">Kirim (+)</th>
            <th class="text-right">Chiqim (-)</th>
            <th class="text-right">Qoldiq</th>
          </tr>
        </thead>
        <tbody>
          ${operationsHtml || '<tr><td colspan="6" class="text-center" style="padding: 15px;">Davr boʻyicha amallar mavjud emas</td></tr>'}
        </tbody>
      </table>

      <div class="signatures">
        <div class="sig-block">
          <p><strong>KARAVAN</strong></p>
          <p>Mas'ul shaxs: ____________________</p>
          <p style="font-size: 11px; color: #64748b;">M.O‘ (Muhr o‘rni)</p>
        </div>
        <div class="sig-block">
          <p><strong>HAMKOR:</strong> ${partner.name}</p>
          <p>Qabul qildi: ____________________</p>
          <p style="font-size: 11px; color: #64748b;">M.O‘ (Muhr o‘rni)</p>
        </div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
