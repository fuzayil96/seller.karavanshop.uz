// Pul miqdorlarini chiroyli formatlash
export function formatMoney(amount, currency = "") {
  const num = Number(amount || 0);
  const formatted = num.toLocaleString("ru-RU", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return currency ? `${formatted} ${currency}` : formatted;
}

// Telefon raqamni tozalash (faqat raqam va + belgisini qoldirish)
export function getCleanPhone(phone) {
  if (!phone) return "";
  const phoneStr = Array.isArray(phone) ? phone[0] : phone;
  return String(phoneStr).replace(/[^0-9+]/g, "");
}

// Asosiy telefon raqamini ko'rsatish
export function getPrimaryPhone(phone) {
  if (!phone) return "";
  return Array.isArray(phone) ? phone[0] : String(phone);
}
