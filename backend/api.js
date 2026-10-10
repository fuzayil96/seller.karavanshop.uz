const express = require('express');
const jwt = require('jsonwebtoken');
const { readDb, updateDb } = require('./db');
const { getBot } = require('./bot');
const { InlineKeyboard } = require('grammy');
const bcrypt = require('bcryptjs');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey123';

// Middleware to verify Admin JWT
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'analytics') throw new Error();
    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireSuperAdmin = (req, res, next) => {
  if (req.admin.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};

async function getData(data) {
  const url = process.env.KARAVAN_API_URL || 'https://api.karavanshop.uz/v1/';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await response.json();
  } catch (error) {
    console.error("Error fetching data:", error);
    return { result: [] };
  }
}

// Admin Login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  const db = readDb();
  const admin = db.admins.find(a => a.username === username && a.password === password);
  if (admin) {
    const role = admin.role || 'admin';
    const token = jwt.sign({ username: admin.username, role: role }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Admin get settings
router.get('/admin/settings', verifyAdmin, requireSuperAdmin, (req, res) => {
  const db = readDb();
  res.json({ settings: db.settings, categories: db.categories });
});

// Admin update settings
router.post('/admin/settings', verifyAdmin, requireSuperAdmin, (req, res) => {
  const { adminNotificationTelegramId, categories, ui } = req.body;
  updateDb(db => {
    if (adminNotificationTelegramId !== undefined) {
      db.settings.adminNotificationTelegramId = adminNotificationTelegramId;
    }
    if (ui !== undefined) {
      db.settings.ui = ui;
    }
    if (categories) {
      db.categories = categories;
    }
  });
  res.json({ success: true });
});

// Admin list users
router.get('/admin/users', verifyAdmin, requireSuperAdmin, (req, res) => {
  const db = readDb();
  res.json(db.users);
});

// Admin Regos proxy
router.get('/admin/regos/groups', verifyAdmin, async (req, res) => {
  const data = await getData({ url: "/usergroup/get", reqData: {} });
  res.json(data);
});

router.get('/admin/regos/users', verifyAdmin, async (req, res) => {
  const data = await getData({ url: "/user/get", reqData: {} });
  res.json(data);
});

// Admin approve/update user
router.post('/admin/users/:telegramId', verifyAdmin, requireSuperAdmin, async (req, res) => {
  const { telegramId } = req.params;
  const { sellerId, status } = req.body;
  let userUpdated = false;

  updateDb(db => {
    const user = db.users.find(u => u.telegramId === parseInt(telegramId));
    if (user) {
      user.sellerId = sellerId;
      user.status = status; // 'approved', 'banned', 'pending'
      userUpdated = true;
    }
  });

  if (userUpdated && status === 'approved') {
    const bot = getBot();
    if (bot) {
      try {
        let baseUrl = process.env.WEBAPP_URL || 'https://example.com';
        if (!/^https?:\/\//i.test(baseUrl)) {
          baseUrl = 'https://' + baseUrl;
        }
        if (!baseUrl.endsWith('/')) {
          baseUrl += '/';
        }
        const { InlineKeyboard } = require('grammy');
        const keyboard = new InlineKeyboard().webApp("📊 Mening Panelim", baseUrl);
        
        try {
          await bot.api.setChatMenuButton({
            chat_id: telegramId,
            menu_button: {
              type: "web_app",
              text: "📊 Panel",
              web_app: { url: baseUrl }
            }
          });
          const tempMsg = await bot.api.sendMessage(telegramId, "Klaviaturani yangilash...", {
            reply_markup: { remove_keyboard: true }
          });
          await bot.api.deleteMessage(telegramId, tempMsg.message_id);
        } catch (e) {
          console.error("Menu/keyboard xatolik (api.js):", e);
        }

        await bot.api.sendMessage(telegramId, "Tasdiqlandi! Siz endi botdan va Web App dan to'liq foydalanishingiz mumkin.", {
          reply_markup: keyboard
        });
      } catch (err) {
        console.error("Failed to send approval message", err);
      }
    }
  } else if (userUpdated && status === 'banned') {
    const bot = getBot();
    if (bot) {
      try {
        await bot.api.sendMessage(telegramId, "Sizning botdan foydalanish huquqingiz cheklandi va panelga kirish o'chirildi.", {
          reply_markup: { remove_keyboard: true }
        });
      } catch (err) {
        console.error("Failed to send ban message", err);
      }
    }
  }
  res.json({ success: userUpdated });
});

// Admin delete user completely
router.delete('/admin/users/:telegramId', verifyAdmin, requireSuperAdmin, async (req, res) => {
  const { telegramId } = req.params;
  let userDeleted = false;
  
  updateDb(db => {
    const initialLength = db.users.length;
    db.users = db.users.filter(u => u.telegramId !== parseInt(telegramId));
    if (db.users.length !== initialLength) {
      userDeleted = true;
    }
  });

  if (userDeleted) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Admin send message
router.post('/admin/message', verifyAdmin, requireSuperAdmin, async (req, res) => {
  const { telegramId, message } = req.body; // telegramId = 'all' for bulk
  const db = readDb();
  const bot = getBot();
  if (!bot) return res.status(500).json({ error: 'Bot is not running' });

  if (telegramId === 'all') {
    for (const user of db.users) {
      try {
        await bot.api.sendMessage(user.telegramId, message);
      } catch (e) {}
    }
  } else {
    try {
      await bot.api.sendMessage(telegramId, message);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to send message' });
    }
  }
  res.json({ success: true });
});

// Regos Webhook for Sales
router.post('/webhook/sales', async (req, res) => {
  // Expected roughly: { seller_id: 123, amount: 50000, receipt_id: 'R123', category_id: 1, date: '...' }
  // We adapt this as needed based on exact regos payload.
  const data = req.body;
  const db = readDb();
  
  // Store sale
  const newSale = {
    id: data.receipt_id || Date.now().toString(),
    sellerId: data.seller_id,
    amount: data.amount || 0,
    categoryId: data.category_id || null,
    date: data.date || new Date().toISOString()
  };

  updateDb(dbData => {
    dbData.sales.push(newSale);
  });

  // Notify seller
  const user = db.users.find(u => u.sellerId === data.seller_id && u.status === 'approved');
  if (user && user.notificationsEnabled) {
    const bot = getBot();
    if (bot) {
      try {
        await bot.api.sendMessage(user.telegramId, `🎉 Yangi savdo!\nSumma: ${newSale.amount}\nSana: ${newSale.date}`);
      } catch (e) {}
    }
  }

  res.json({ success: true });
});

// Web App: Get Seller Stats (Live from Regos)
router.get('/webapp/stats/:telegramId', async (req, res) => {
  const { telegramId } = req.params;
  let { startDate, endDate } = req.query;
  const db = readDb();
  
  const user = db.users.find(u => u.telegramId === parseInt(telegramId));
  if (!user || user.status !== 'approved') return res.status(403).json({ error: 'Not approved' });

  // Get seller name and users list for leaderboard
  let sellerName = `Sotuvchi #${user.sellerId}`;
  let userGroupId = null;
  let regosUsersList = [];
  try {
    const regosUsers = await getData({ url: "/user/get", reqData: {} });
    if (regosUsers && Array.isArray(regosUsers.result)) {
      regosUsersList = regosUsers.result;
      const match = regosUsersList.find(ru => ru.id == user.sellerId);
      if (match) {
        sellerName = [match.first_name, match.last_name].filter(Boolean).join(' ') || match.name || match.username || match.login || sellerName;
        userGroupId = match.user_group?.id;
        user.groupName = match.user_group?.name || '';
      }
    }
  } catch(e) {}
  user.sellerName = sellerName;

  const category = db.categories.find(c => c.id == userGroupId) || { bonusPercentage: 0 };
  
  let cashservers = [];
  try {
    const csRes = await getData({ url: "/cashserver/get", reqData: {} });
    if (csRes && Array.isArray(csRes.result)) {
      cashservers = csRes.result.map(c => ({
        id: c.id,
        name: c.name,
        last_sync: c.last_sync,
        sync_status: c.sync_status,
        active: c.active
      }));
    }
  } catch(e) {}
  
  try {
    // If dates not provided, default to current month
    if (!startDate || !endDate) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startDate = startOfMonth.toISOString().split('T')[0];
      endDate = new Date().toISOString().split('T')[0];
    }

    let startUnix = Math.floor(new Date(startDate + "T00:00:00").getTime() / 1000);
    let endUnix = Math.floor(new Date(endDate + "T23:59:59.999").getTime() / 1000);
    
    if (endUnix - startUnix > 31 * 86400) {
      return res.status(400).json({ error: 'Maksimal ruxsat etilgan muddat 31 kundan oshmasligi kerak.' });
    }

    const CHUNK_SIZE = 3 * 86400; // 3 kunlik qismlar
    let allCheques = [];
    
    for (let currentStart = startUnix; currentStart <= endUnix; currentStart += CHUNK_SIZE + 1) {
      let currentEnd = currentStart + CHUNK_SIZE;
      if (currentEnd > endUnix) currentEnd = endUnix;

      try {
        const resData = await getData({
          url: "/doccheque/get",
          reqData: {
            start_date: currentStart,
            end_date: currentEnd,
            limit: 100000,
            filters: [{ Field: "status", Operator: "Equal", Value: "Closed" }]
          }
        });
        if (resData && Array.isArray(resData.result)) {
          allCheques = allCheques.concat(resData.result);
        }
      } catch (err) {
        console.error("Chunk yuklashda xato:", err);
      }
    }

    // Takrorlanishlarning oldini olish
    const uniqueMap = new Map();
    allCheques.forEach((ch) => {
      if (ch.uuid) uniqueMap.set(ch.uuid, ch);
      else if (ch.id) uniqueMap.set(ch.id, ch);
    });

    const response = { result: Array.from(uniqueMap.values()) };

    let totalAmount = 0;
    let salesCount = 0;
    const sellerTotals = {}; // For ranking
    const myCheques = []; // To send back recent cheques

    // Populate sellerTotals with all users in the same group
    if (userGroupId && regosUsersList.length > 0) {
      regosUsersList.forEach(ru => {
        if (ru.user_group?.id == userGroupId) {
          sellerTotals[ru.id] = 0;
        }
      });
    }

    // Ensure current user is in sellerTotals so they always get ranked
    sellerTotals[user.sellerId] = 0;

    if (response && Array.isArray(response.result)) {
      response.result.forEach(c => {
        // Handle potential nested structures or variations in Regos API
        const sellerId = c.seller?.id || c.author_id || c.user_id || c.seller_id || (c.author && c.author.id);
        if (!sellerId) return;
        
        const isReturn = Boolean(c.is_return);
        let amount = Number(c.amount || c.total || c.total_amount || c.sum || 0);
        
        if (isReturn) {
          amount = -amount;
        }

        sellerTotals[sellerId] = (sellerTotals[sellerId] || 0) + amount;
        
        if (sellerId == user.sellerId) {
          totalAmount += amount;
          if (!isReturn) salesCount++; // Faqat haqiqiy sotuvlar soni
          
          myCheques.push({
            id: c.id || c.uuid || Math.random().toString(),
            date: c.date,
            amount: amount,
            bonus: (amount * (category.bonusPercentage || 0)) / 100,
            number: c.number || c.doc_number || '-',
            isReturn: isReturn
          });
        }
      });
    }

    // Sort cheques latest first
    myCheques.sort((a, b) => new Date(b.date) - new Date(a.date));

    const bonus = (totalAmount * category.bonusPercentage) / 100;
    
    // UI Settings
    const uiSettings = db.settings.ui || { showLeaderboard: true, showChequeDetails: true };

    // Calculate Leaderboards
    const groupLeaderboard = [];
    const overallLeaderboard = [];
    
    Object.keys(sellerTotals).forEach(id => {
      const u = regosUsersList.find(ru => ru.id == id);
      const uGroupId = u?.user_group?.id;
      const groupName = u?.user_group?.name || '';
      const name = u ? ([u.first_name, u.last_name].filter(Boolean).join(' ') || u.name || u.login) : `Sotuvchi #${id}`;
      
      const entry = { sellerId: id, name, groupName, sales: sellerTotals[id] };
      
      // FAQAT o'z guruhi
      if (uGroupId == userGroupId || id == user.sellerId) {
        groupLeaderboard.push(entry);
      }
      
      // Umumiy
      overallLeaderboard.push(entry);
    });
    
    groupLeaderboard.sort((a,b) => b.sales - a.sales);
    overallLeaderboard.sort((a,b) => b.sales - a.sales);

    const groupRank = groupLeaderboard.findIndex(s => s.sellerId == user.sellerId) + 1;
    const overallRank = overallLeaderboard.findIndex(s => s.sellerId == user.sellerId) + 1;

    res.json({
      user,
      totalSales: totalAmount,
      bonus,
      salesCount,
      cheques: myCheques,
      groupRank: groupRank > 0 ? groupRank : '-',
      overallRank: overallRank > 0 ? overallRank : '-',
      groupLeaderboard: uiSettings.showLeaderboard ? groupLeaderboard : [],
      overallLeaderboard: uiSettings.showLeaderboard ? overallLeaderboard : [],
      settings: uiSettings,
      cashservers: cashservers
    });

  } catch (err) {
    console.error("Failed to fetch live stats", err);
    res.status(500).json({ error: 'Live data Error' });
  }
});

// Web App: Toggle Notifications
router.post('/webapp/notifications/:telegramId', (req, res) => {
  const { telegramId } = req.params;
  const { enabled } = req.body;
  
  updateDb(db => {
    const user = db.users.find(u => u.telegramId === parseInt(telegramId));
    if (user) user.notificationsEnabled = enabled;
  });
  res.json({ success: true });
});

// Web App: Get Cheque Items
router.get('/webapp/cheque-items/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const response = await getData({
      url: "/docchequeoperation/get",
      reqData: { doc_sale_uuid: uuid }
    });
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: "Xatolik" });
  }
});

module.exports = router;
