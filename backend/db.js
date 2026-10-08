const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'db.json');

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
