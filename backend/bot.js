const { Bot, Keyboard, InlineKeyboard } = require("grammy");
const { readDb, updateDb } = require("./db");

// It's best to initialize the bot in the main file and pass it around, or export an initializer.
let bot;

function setupBot(token) {
  if (!token) {
    console.warn("No Telegram Bot Token provided. Bot will not start.");
    return null;
  }

  bot = new Bot(token);

  bot.command("start", async (ctx) => {
    updateDb((data) => {
      let existingUser = data.users.find((u) => u.telegramId === ctx.from.id);
      if (existingUser) {
        existingUser.firstName = ctx.from.first_name || "";
        existingUser.lastName = ctx.from.last_name || "";
        existingUser.username = ctx.from.username || "";
      } else {
        data.users.push({
          telegramId: ctx.from.id,
          firstName: ctx.from.first_name || "",
          lastName: ctx.from.last_name || "",
          username: ctx.from.username || "",
          phoneNumber: null,
          status: "pending",
          sellerId: null,
          notificationsEnabled: true,
          chatId: ctx.chat.id,
        });
      }
    });

    const db = readDb();
    const user = db.users.find((u) => u.telegramId === ctx.from.id);

    if (user && user.status === "banned") {
      return ctx.reply(
        "Kechirasiz, sizning botdan foydalanish huquqingiz cheklangan.",
      );
    }

    if (user && user.status === "approved") {
      let baseUrl = process.env.WEBAPP_URL || "https://example.com";
      if (!/^https?:\/\//i.test(baseUrl)) {
        baseUrl = "https://" + baseUrl;
      }
      if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
      }
      const keyboard = new InlineKeyboard()
        .webApp("📊 Mening Panelim", baseUrl);
      
      // Eski ishlamaydigan pastki klaviaturani olib tashlash va Menu tugmasini o'rnatish
      try {
        await ctx.api.setChatMenuButton({
          chat_id: ctx.chat.id,
          menu_button: {
            type: "web_app",
            text: "📊 Panel",
            web_app: { url: baseUrl }
          }
        });
        
        // Eski klaviaturani foydalanuvchi ekranidan butunlay tozalash uchun vaqtinchalik xabar
        const tempMsg = await ctx.reply("Klaviaturani yangilash...", {
          reply_markup: { remove_keyboard: true }
        });
        await ctx.api.deleteMessage(ctx.chat.id, tempMsg.message_id);
      } catch (e) {
        console.error("Menu button o'rnatishda xatolik:", e);
      }

      return ctx.reply(
        "Xush kelibsiz! Quyidagi tugma orqali panelingizga kiring:",
        {
          reply_markup: {
            inline_keyboard: keyboard.inline_keyboard,
          },
        }
      );
    }

    const keyboard = new Keyboard()
      .requestContact("☎️ Telefon raqamni yuborish")
      .resized()
      .oneTime();

    await ctx.reply(
      "Assalomu alaykum! Iltimos, telefon raqamingizni yuboring.",
      {
        reply_markup: keyboard,
      },
    );
  });

  bot.on("message:contact", async (ctx) => {
    const contact = ctx.message.contact;
    const db = readDb();
    const telegramId = ctx.from.id;
    const phoneNumber = contact.phone_number;

    let user = db.users.find((u) => u.telegramId === telegramId);

    if (user && user.status === "banned") {
      return ctx.reply(
        "Kechirasiz, sizning botdan foydalanish huquqingiz cheklangan.",
      );
    }

    if (!user) {
      updateDb((data) => {
        data.users.push({
          telegramId,
          firstName: ctx.from.first_name || "",
          lastName: ctx.from.last_name || "",
          username: ctx.from.username || "",
          phoneNumber,
          status: "pending",
          sellerId: null,
          notificationsEnabled: true,
          chatId: ctx.chat.id,
        });
      });
      user = db.users.find((u) => u.telegramId === telegramId);
    } else {
      // Update phone number if they already exist (e.g. from /start)
      updateDb((data) => {
        let existing = data.users.find((u) => u.telegramId === telegramId);
        if (existing) {
          existing.phoneNumber = phoneNumber;
          existing.firstName = ctx.from.first_name || existing.firstName || "";
          existing.lastName = ctx.from.last_name || existing.lastName || "";
          existing.username = ctx.from.username || existing.username || "";
        }
      });
      user = readDb().users.find((u) => u.telegramId === telegramId);
    }

    await ctx.reply("Tastiqlash so'rovi yuborildi", {
      reply_markup: { remove_keyboard: true },
    });

    const adminId = db.settings.adminNotificationTelegramId;
    if (adminId) {
      try {
        await bot.api.sendMessage(
          adminId,
          `Yangi tasdiqlash so'rovi!\nTelefon: ${phoneNumber}\nTelegram ID: ${telegramId}`,
        );
      } catch (err) {
        console.error("Failed to notify admin:", err);
      }
    }
  });

  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  bot.start();
  console.log("Bot is running...");
  return bot;
}

function getBot() {
  return bot;
}

module.exports = { setupBot, getBot };
