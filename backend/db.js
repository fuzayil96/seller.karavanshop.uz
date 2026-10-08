const fs = require('fs');
const path = require('path');

const localDbPath = path.join(__dirname, 'db.json');
const dbPath = process.env.DATA_DIR ? path.join(process.env.DATA_DIR, 'db.json') : localDbPath;

// Agar Railway'da Volume ulangan bo'lsa va hali db.json yaratilmagan bo'lsa, local ma'lumotlarni nusxalaymiz
if (process.env.DATA_DIR && !fs.existsSync(dbPath) && fs.existsSync(localDbPath)) {
  try {
    fs.copyFileSync(localDbPath, dbPath);
    console.log("Local db.json ma'lumotlari Volume'ga muvaffaqiyatli ko'chirildi!");
  } catch (err) {
    console.error("Ma'lumotlarni nusxalashda xatolik:", err);
  }
}

const defaultDb = {
  users: [],
  admins: [{ username: 'admin', password: 'password', telegramId: null }],
  categories: [],
  settings: { 
    adminNotificationTelegramId: null,
    regosApiUrl: 'https://api.regos.uz/api/v1',
    regosApiToken: ''
  },
  sales: []
};

function readDb() {
  if (!fs.existsSync(dbPath)) {
    writeDb(defaultDb);
    return defaultDb;
  }
  try {
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading db.json:', error);
    return defaultDb;
  }
}

function writeDb(data) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to db.json:', error);
  }
}

function updateDb(updater) {
  const data = readDb();
  updater(data);
  writeDb(data);
}

module.exports = {
  readDb,
  writeDb,
  updateDb,
};
