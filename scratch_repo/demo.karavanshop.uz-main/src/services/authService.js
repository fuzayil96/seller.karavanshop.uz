export const USERS_STORAGE_KEY = "erp_users";
export const AUDIT_LOGS_KEY = "erp_audit_logs";

// Initialize with a default admin if empty
const initUsers = () => {
  const users = localStorage.getItem(USERS_STORAGE_KEY);
  if (!users) {
    const defaultUsers = [
      {
        telegramId: 1, // Default Admin ID for mock testing
        firstName: "Super Admin",
        username: "admin",
        password: "123", // Oddiy parol
        role: "admin",
        sellerId: null,
        sellerStockPercentages: {}, // Format: { [stockId]: percentage }
        permissions: ["/", "/sellers", "/partners", "/admin", "/stock", "/cashflow"], // barcha sahifalar
      },
    ];
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
    return defaultUsers;
  }
  return JSON.parse(users);
};

export const logAudit = (telegramId, action, details = "") => {
  const logs = JSON.parse(localStorage.getItem(AUDIT_LOGS_KEY) || "[]");
  logs.unshift({
    id: Date.now(),
    telegramId,
    action,
    details,
    timestamp: new Date().toISOString(),
  });
  // Keep only last 100 logs
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
};

export const getAuditLogs = () => {
  return JSON.parse(localStorage.getItem(AUDIT_LOGS_KEY) || "[]");
};

export const getUserByCredentials = (username, password) => {
  const users = getUsers();
  const user = users.find((u) => 
    u.username === username && 
    (u.password === password || (!u.password && password === "123"))
  ) || null;
  
  if (user) {
    logAudit(user.telegramId, "LOGIN", "Tizimga kirdi");
  }
  return user;
};

export const getUsers = () => {
  return initUsers();
};

export const saveUsers = (users) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};

export const getUserById = (telegramId) => {
  const users = getUsers();
  return users.find((u) => u.telegramId === Number(telegramId)) || null;
};

export const addUser = (user) => {
  const users = getUsers();
  if (users.find(u => u.telegramId === user.telegramId)) {
    throw new Error("User already exists");
  }
  users.push(user);
  saveUsers(users);
  return user;
};

export const updateUser = (telegramId, updates) => {
  const users = getUsers();
  const index = users.findIndex((u) => u.telegramId === Number(telegramId));
  if (index !== -1) {
    users[index] = { ...users[index], ...updates };
    saveUsers(users);
    return users[index];
  }
  return null;
};

export const deleteUser = (telegramId) => {
  const users = getUsers();
  const filtered = users.filter((u) => u.telegramId !== Number(telegramId));
  saveUsers(filtered);
};
