import "dotenv/config";
import { Telegraf, Markup } from "telegraf";

const BOT_TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || "http://localhost:5173";
const isHttps = MINI_APP_URL.startsWith("https://");

if (!BOT_TOKEN || BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
  console.error("[Bot] BOT_TOKEN not set in .env — get one from @BotFather");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  if (isHttps) {
    ctx.reply(
      "🍳 *ТехКарты PRO*\n\n" +
      "Технологик карталар, номенклатура ва таннарх ҳисоблаш тизими.\n\n" +
      "📋 Техкарталар яратиш ва бошқариш\n" +
      "📦 Номенклатура базаси\n" +
      "💰 Автоматик таннарх ҳисоби\n" +
      "📊 Excel экспорт\n\n" +
      "Бошлаш учун пастдаги тугмани босинг 👇",
      {
        parse_mode: "Markdown",
        ...Markup.inlineKeyboard([
          [Markup.button.webApp("📋 Дастурни очиш", MINI_APP_URL)],
        ]),
      }
    );
  } else {
    ctx.reply(
      "🍳 ТехКарты PRO\n\n" +
      "Технологик карталар, номенклатура ва таннарх ҳисоблаш тизими.\n\n" +
      "📋 Техкарталар яратиш ва бошқариш\n" +
      "📦 Номенклатура базаси\n" +
      "💰 Автоматик таннарх ҳисоби\n" +
      "📊 Excel экспорт\n\n" +
      "Бошлаш учун пастдаги тугмани босинг 👇",
      Markup.inlineKeyboard([
        [Markup.button.url("📋 Дастурни очиш", MINI_APP_URL)],
        [Markup.button.url("📦 Номенклатура", MINI_APP_URL + "?tab=nom")],
        [Markup.button.callback("⚙️ HTTPS ҳақида", "about_https")],
      ])
    );
  }
});

bot.action("about_https", (ctx) => {
  ctx.answerCbQuery();
  ctx.reply(
    "⚠️ Telegram Mini App тўлиқ ишлаши учун HTTPS керак.\n\n" +
    "Ҳозирча дастур браузерда очилади.\n\n" +
    "HTTPS олиш учун:\n" +
    "1. VPS сервер олинг\n" +
    "2. Домен улаб SSL сертификат ўрнатинг\n" +
    "3. .env файлда MINI_APP_URL ни HTTPS га ўзгартиринг\n" +
    "4. Ботни қайта ишга туширинг"
  );
});

bot.command("menu", (ctx) => {
  if (isHttps) {
    ctx.reply("Бўлимни танланг:", Markup.inlineKeyboard([
      [Markup.button.webApp("📋 Техкарталар", MINI_APP_URL + "?tab=cards")],
      [Markup.button.webApp("📦 Номенклатура", MINI_APP_URL + "?tab=nom")],
    ]));
  } else {
    ctx.reply("Бўлимни танланг:", Markup.inlineKeyboard([
      [Markup.button.url("📋 Техкарталар", MINI_APP_URL + "?tab=cards")],
      [Markup.button.url("📦 Номенклатура", MINI_APP_URL + "?tab=nom")],
    ]));
  }
});

bot.command("help", (ctx) => {
  ctx.reply(
    "📖 Ёрдам\n\n" +
    "/start — Бошланғич экран\n" +
    "/menu — Бўлимлар менюси\n" +
    "/stats — Статистика\n" +
    "/help — Ёрдам\n\n" +
    "Дастур Telegram Mini App сифатида ишлайди.\n" +
    "Барча маълумотлар серверда сақланади."
  );
});

bot.command("stats", async (ctx) => {
  try {
    const res = await fetch("http://localhost:" + (process.env.PORT || 3001) + "/api/health", {
      headers: { "X-Dev-User": String(ctx.from.id) }
    });
    if (res.ok) {
      ctx.reply("✅ Сервер ишлаяпти!\n\nДастурни очиш учун /start босинг.");
    } else {
      ctx.reply("❌ Сервер жавоб бермаяпти.");
    }
  } catch(e) {
    ctx.reply("❌ Сервер жавоб бермаяпти: " + e.message);
  }
});

bot.launch();
console.log("[Bot] Started — URL: " + MINI_APP_URL + " (HTTPS: " + isHttps + ")");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
