const SETTINGS_KEY = "erp_settings";

const defaultSettings = {
  allowedPartnerCategories: ["Ta'minotchilar", "Kuryerlar", "VIP Mijozlar"],
};

export const getSettings = () => {
  const data = localStorage.getItem(SETTINGS_KEY);
  if (!data) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaultSettings));
    return defaultSettings;
  }
  return JSON.parse(data);
};

export const saveSettings = (newSettings) => {
  const current = getSettings();
  const updated = { ...current, ...newSettings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
};
