// ══════════════════════════════════════════════════════════════════════════════
// TechCards PRO — Server
// ══════════════════════════════════════════════════════════════════════════════
import "dotenv/config";
import express from "express";
import cors from "cors";
import compression from "compression";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import { getUser, getSessionUser, uploadsDir, resetDatabase } from "./db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

import productsRouter from "./routes/products.js";
import cardsRouter from "./routes/cards.js";
import foldersRouter from "./routes/folders.js";
import usersRouter from "./routes/users.js";
import adminRouter from "./routes/admin.js";
import uploadRouter from "./routes/upload.js";
import catalogRouter from "./routes/catalog.js";
import orgsRouter from "./routes/orgs.js";

const app = express();
const PORT = process.env.PORT || 3001;
const BOT_TOKEN = process.env.BOT_TOKEN || "";

// ── Global Middleware ────────────────────────────────────────────────────────
app.use(compression());
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/api/uploads", express.static(uploadsDir));

// ── Telegram Auth Validation ─────────────────────────────────────────────────
function validateTelegramInitData(initData) {
  if (!BOT_TOKEN || BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const pairs = [];
  for (const [k, v] of params.entries()) pairs.push(k + "=" + v);
  pairs.sort();

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac("sha256", secretKey).update(pairs.join("\n")).digest("hex");
  if (hmac !== hash) return null;

  try {
    const user = JSON.parse(params.get("user") || "{}");
    return String(user.id || "");
  } catch {
    return null;
  }
}

// ── Auth Middleware ───────────────────────────────────────────────────────────
const openRoutes = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/profile",
  "/api/auth/reset-password",
  "/api/auth/admin-contact",
  "/api/health",
];

app.use((req, res, next) => {
  // Static files skip auth
  if (!req.path.startsWith("/api")) return next();

  // 1) Try Telegram initData
  const initData = req.headers["x-telegram-init-data"] || "";
  const tgId = validateTelegramInitData(initData);

  // 2) Try Bearer token (always check — works as fallback)
  const authHeader = req.headers["authorization"] || "";
  let bearerUser = null;
  if (authHeader.startsWith("Bearer ")) {
    bearerUser = getSessionUser(authHeader.slice(7));
  }

  // Telegram auth — user found
  if (tgId) {
    req.tgId = tgId;
    const user = getUser(tgId);
    if (user) {
      req.user = user;
      req.orgId = user.orgId;
      return next();
    }
    // Telegram ID not in DB — try Bearer token as fallback
    if (bearerUser) {
      req.user = bearerUser;
      req.orgId = bearerUser.orgId;
      return next();
    }
    return next(); // tgId set for registration
  }

  // Bearer token auth
  if (bearerUser) {
    req.tgId = bearerUser.tgId;
    req.user = bearerUser;
    req.orgId = bearerUser.orgId;
    return next();
  }

  // Dev mode (no BOT_TOKEN)
  if (!BOT_TOKEN || BOT_TOKEN === "YOUR_BOT_TOKEN_HERE") {
    req.tgId = "dev_user";
    const user = getUser("dev_user");
    if (user) { req.user = user; req.orgId = user.orgId; }
    return next();
  }

  // Dev header (development only)
  if (process.env.NODE_ENV !== "production" && req.headers["x-dev-user"]) {
    req.tgId = req.headers["x-dev-user"];
    const user = getUser(req.tgId);
    if (user) { req.user = user; req.orgId = user.orgId; }
    return next();
  }

  // Open routes pass without auth
  if (openRoutes.includes(req.path)) return next();

  res.status(401).json({ error: "Unauthorized" });
});

// ── Access Control Middleware ─────────────────────────────────────────────────
function requireRegistered(req, res, next) {
  if (!req.user || !req.user.registered) {
    return res.status(403).json({ error: "Not registered" });
  }
  next();
}

function requireEditor(req, res, next) {
  if (!req.user) return res.status(403).json({ error: "Not registered" });
  if (req.method === "GET") return next();
  const role = req.user.role || "user";
  if (role === "admin" || role === "technolog") return next();
  return res.status(403).json({ error: "No permission" });
}

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", usersRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/admin", adminRouter);
app.use("/api/orgs", requireRegistered, orgsRouter);
app.use("/api/catalog", requireRegistered, catalogRouter);
app.use("/api/products", requireRegistered, requireEditor, productsRouter);
app.use("/api/cards", requireRegistered, requireEditor, cardsRouter);
app.use("/api/folders", requireRegistered, requireEditor, foldersRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ── Database Reset (secret key protected) ───────────────────────────────────
app.post("/api/reset-db", (req, res) => {
  const secret = req.headers["x-reset-secret"] || req.body.secret;
  if (secret !== "techcards_reset_2024") {
    return res.status(403).json({ error: "Invalid secret" });
  }
  const result = resetDatabase();
  res.json(result);
});

// ── Serve Frontend (production) ──────────────────────────────────────────────
const distDir = join(__dirname, "..", "dist");
if (existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(join(distDir, "index.html"));
    }
  });
}

// ── Global Error Handler ─────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[Error]", err.message || err);
  res.status(500).json({ error: "Internal server error" });
});

// ── Start ────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`[Server] http://localhost:${PORT}`);
});
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
