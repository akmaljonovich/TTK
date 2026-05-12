import "dotenv/config";
import express from "express";
import cors from "cors";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { getUser, getSessionUser, uploadsDir } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
import productsRouter from "./routes/products.js";
import cardsRouter from "./routes/cards.js";
import foldersRouter from "./routes/folders.js";
import usersRouter from "./routes/users.js";
import adminRouter from "./routes/admin.js";
import uploadRouter from "./routes/upload.js";
import catalogRouter from "./routes/catalog.js";

const app = express();
const PORT = process.env.PORT || 3001;
const BOT_TOKEN = process.env.BOT_TOKEN || "";

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api/uploads", express.static(uploadsDir));

function validateTelegramInitData(initData) {
  if (!BOT_TOKEN || BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const pairs = [];
  for (const [k, v] of params.entries()) pairs.push(k + "=" + v);
  pairs.sort();
  const dataCheckString = pairs.join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (hmac !== hash) return null;

  try {
    const user = JSON.parse(params.get("user") || "{}");
    return String(user.id || "");
  } catch {
    return null;
  }
}

app.use((req, res, next) => {
  if (req.path === "/api/auth/login" || req.path === "/api/auth/register") {
    return next();
  }

  const initData = req.headers["x-telegram-init-data"] || "";
  const tgId = validateTelegramInitData(initData);

  if (tgId) {
    req.tgId = tgId;
    const user = getUser(tgId);
    if (user) {
      req.user = user;
      req.orgId = user.orgId;
    }
    return next();
  }

  const authHeader = req.headers["authorization"] || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const user = getSessionUser(token);
    if (user) {
      req.tgId = user.tgId;
      req.user = user;
      req.orgId = user.orgId;
      return next();
    }
  }

  if (process.env.NODE_ENV !== "production" && req.headers["x-dev-user"]) {
    req.tgId = req.headers["x-dev-user"];
    const user = getUser(req.tgId);
    if (user) {
      req.user = user;
      req.orgId = user.orgId;
    }
    return next();
  }

  if (!BOT_TOKEN || BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
    req.tgId = "dev_user";
    return next();
  }

  res.status(401).json({ error: "Unauthorized" });
});

app.use("/api/auth", usersRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/admin", adminRouter);

function requireRegistered(req, res, next) {
  if (!req.user || !req.user.registered) {
    return res.status(403).json({ error: "Not registered" });
  }
  next();
}

app.use("/api/catalog", requireRegistered, catalogRouter);
app.use("/api/products", requireRegistered, productsRouter);
app.use("/api/cards", requireRegistered, cardsRouter);
app.use("/api/folders", requireRegistered, foldersRouter);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, tgId: req.tgId });
});

// Serve built frontend in production
const distDir = join(__dirname, "..", "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(join(distDir, "index.html"));
    }
  });
}

app.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT}`);
});
