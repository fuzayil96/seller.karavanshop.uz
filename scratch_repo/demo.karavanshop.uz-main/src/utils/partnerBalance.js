import { formatMoney } from "./formatters";

// partnerbalance/get javobini tahlil qilish funksiyasi
// https://docs.regos.uz/en/api/references/partnerbalance/get
export function parsePartnerBalance(result) {
  if (!result || !Array.isArray(result) || result.length === 0) {
    return {
      currencies: [],
      operations: [],
      mainBalanceText: "0 so'm",
    };
  }

  // 1. Valyutalar bo'yicha yig'indilar (entity_type === "Currency")
  const currencies = result
    .filter((row) => row.entity_type === "Currency")
    .map((row) => {
      const curName = row.currency?.code_chr || row.currency?.name || "UZS";
      const startAmount = Number(row.start_amount || 0);
      const debit = Number(row.debit || 0);
      const credit = Number(row.credit || 0);
      const endAmount = Number(
        row.end_amount !== null && row.end_amount !== undefined
          ? row.end_amount
          : startAmount + debit - credit
      );
      return {
        id: row.entity_id || row.id,
        currencyName: curName,
        startAmount,
        debit,
        credit,
        endAmount,
      };
    });

  // 2. Haqiqiy operatsiyalar / hujjatlar (id > 0)
  const operations = result
    .filter(
      (row) =>
        (row.entity_type === "PartnerBalance" || !row.entity_type) &&
        row.id > 0
    )
    .map((row) => {
      const curName = row.currency?.code_chr || row.currency?.name || "UZS";
      let formattedDate = "—";
      if (row.date) {
        const d = new Date(row.date * 1000);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, "0");
        const mins = String(d.getMinutes()).padStart(2, "0");
        formattedDate = `${day}.${month}.${year} ${hours}:${mins}`;
      }
      return {
        id: row.id,
        date: formattedDate,
        timestamp: row.date || 0,
        documentCode: row.document_code || `№${row.document_id || row.id}`,
        documentType: row.document_type?.name || "Operatsiya",
        debit: Number(row.debit || 0),
        credit: Number(row.credit || 0),
        endAmount: Number(row.end_amount || 0),
        currencyName: curName,
      };
    })
    .sort((a, b) => b.timestamp - a.timestamp);

  // Asosiy balans matni
  let mainBalanceText = "0 so'm";
  if (currencies.length > 0) {
    mainBalanceText = currencies
      .map((c) => `${formatMoney(c.endAmount)} ${c.currencyName}`)
      .join(" / ");
  } else {
    const closingRow = result.find(
      (r) =>
        r.document_type?.name_var === "app_balance_at_the_end_of_period" ||
        r.document_type?.name === "Сальдо на конец периода"
    );
    if (
      closingRow &&
      closingRow.end_amount !== null &&
      closingRow.end_amount !== undefined
    ) {
      mainBalanceText = `${formatMoney(closingRow.end_amount)} ${
        closingRow.currency?.code_chr || "UZS"
      }`;
    }
  }

  return { currencies, operations, mainBalanceText };
}
