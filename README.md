# ТехКарты PRO — Telegram Mini App

Технологик карталар, номенклатура ва таннарх ҳисоблаш тизими.
Telegram бот + Mini App + Express API + SQLite.

## Қандай ишлайди

```
Telegram Bot  →  Mini App (React)  →  Express API  →  SQLite Database
```

Ҳар бир фойдаланувчи (Telegram user ID) ўз маълумотларини кўради.

## Ишга тушириш

### 1. Зависимостларни ўрнатиш

```bash
npm install
```

### 2. Telegram бот яратиш

1. Telegram да @BotFather га `/newbot` юборинг
2. Бот номини ва username ни киритинг
3. Олинган токенни `.env` файлга ёзинг:

```env
BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
```

### 3. Локал ишга тушириш (тест учун)

```bash
npm run dev
```

Бу 3 та процессни ишга туширади:
- Express API → http://localhost:3001
- Vite dev server → http://localhost:5173
- Telegram bot

Браузерда http://localhost:5173 очиб тест қилишингиз мумкин (dev mode да авторизация талаб қилинмайди).

### 4. Telegram Mini App учун deploy

Telegram Mini App HTTPS талаб қилади. Варианлар:

**a) ngrok билан (тест учун):**
```bash
npx ngrok http 5173
```
Олинган HTTPS URL ни `.env` даги `MINI_APP_URL` га ёзинг ва ботни қайта ишга туширинг.

**b) VPS/сервер (прод учун):**
1. Серверга deploy қилинг
2. `npm run build` — React ни build қилинг
3. Express серверга static файлларни берадиган қўшимча маршрут қўшинг
4. Nginx + SSL сертификат (Let's Encrypt) ўрнатинг
5. `.env` даги `MINI_APP_URL` ни ўзгартиринг

### 5. BotFather да Mini App ни рўйхатдан ўтказиш

1. @BotFather → `/mybots` → ботингизни танланг
2. `Bot Settings` → `Menu Button` → HTTPS URL ни киритинг

## Лойиҳа структураси

```
├── bot/index.js           # Telegram бот (Telegraf)
├── server/
│   ├── index.js           # Express API сервер
│   ├── db.js              # SQLite база + CRUD
│   └── routes/
│       ├── products.js    # Номенклатура API
│       ├── cards.js       # Техкарталар API
│       └── folders.js     # Папкалар API
├── src/
│   ├── main.jsx           # React entry
│   ├── App.jsx            # Асосий UI
│   └── api.js             # API client
├── data/                  # SQLite база файли (авто яратилади)
├── .env                   # Конфигурация
├── index.html             # HTML entry
├── vite.config.js         # Vite конфиг
└── package.json
```

## API

| Метод | Йўл | Тавсиф |
|-------|------|--------|
| GET | /api/products | Барча номенклатура |
| POST | /api/products | Яратиш/таҳрирлаш |
| DELETE | /api/products/:id | Ўчириш |
| GET | /api/cards | Барча техкарталар |
| POST | /api/cards | Яратиш/таҳрирлаш |
| DELETE | /api/cards/:id | Ўчириш |
| GET | /api/folders | Барча папкалар |
| POST | /api/folders | Яратиш/таҳрирлаш |
| DELETE | /api/folders/:id | Ўчириш |
