// ══════════════════════════════════════════════════════════════════════════════
// TechCards PRO — Database Layer (sql.js, hardened)
// ══════════════════════════════════════════════════════════════════════════════
import initSqlJs from "sql.js";
import crypto from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// ── Paths ────────────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir =
  process.env.NODE_ENV === "production" && existsSync("/data")
    ? "/data"
    : join(__dirname, "..", "data");

export const uploadsDir = join(dataDir, "uploads");
const dbPath = join(dataDir, "techcards.db");

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

// ── Database Init ────────────────────────────────────────────────────────────
const SQL = await initSqlJs();
let db;
if (existsSync(dbPath)) {
  db = new SQL.Database(readFileSync(dbPath));
} else {
  db = new SQL.Database();
}

db.run("PRAGMA foreign_keys = ON");

// ── Debounced Save ──────────────────────────────────────────────────────────
let saveTimer = null;
let saveCount = 0;
function save() {
  saveCount++;
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    try {
      const buf = Buffer.from(db.export());
      writeFileSync(dbPath, buf);
    } catch (e) {
      console.error("[DB] Save failed:", e.message);
    }
    saveTimer = null;
    saveCount = 0;
  }, 1000); // Save max once per second (reduces disk I/O under load)
}

function saveNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  try { writeFileSync(dbPath, Buffer.from(db.export())); } catch (_) {}
  saveCount = 0;
}

// Periodic save every 30s if there are pending writes
setInterval(() => { if (saveCount > 0) saveNow(); }, 30000);

process.on("exit", saveNow);
process.on("SIGINT", () => { saveNow(); process.exit(0); });
process.on("SIGTERM", () => { saveNow(); process.exit(0); });

// ── Query Helpers ────────────────────────────────────────────────────────────
function queryAll(sql, params) {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function queryOne(sql, params) {
  // Optimize: add LIMIT 1 if not already present
  const q = /\bLIMIT\b/i.test(sql) ? sql : sql + " LIMIT 1";
  const stmt = db.prepare(q);
  if (params) stmt.bind(params);
  let row = null;
  if (stmt.step()) row = stmt.getAsObject();
  stmt.free();
  return row;
}

function run(sql, params) {
  db.run(sql, params);
  save();
}

function genId() {
  return crypto.randomBytes(12).toString("hex");
}

// ── Password Hashing (salted) ───────────────────────────────────────────────
const SALT = process.env.PASSWORD_SALT || "techcards_pro_2024_salt";

function hashPassword(pw) {
  return crypto.createHmac("sha256", SALT).update(String(pw)).digest("hex");
}

// ── Input Sanitization ──────────────────────────────────────────────────────
function sanitize(str, maxLen) {
  if (!str) return "";
  return String(str).slice(0, maxLen || 500).trim();
}

function sanitizeNum(val, min, max) {
  const n = +val || 0;
  if (min !== undefined && n < min) return min;
  if (max !== undefined && n > max) return max;
  return n;
}

// ── Schema ───────────────────────────────────────────────────────────────────
db.run(`CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'food',
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.run(`CREATE TABLE IF NOT EXISTS user_orgs (
  user_id TEXT NOT NULL, org_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  PRIMARY KEY (user_id, org_id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, tg_id TEXT UNIQUE NOT NULL, org_id TEXT,
  name TEXT NOT NULL DEFAULT '', age INTEGER DEFAULT 0,
  city TEXT DEFAULT '', position TEXT DEFAULT '',
  workplace TEXT DEFAULT '', purpose TEXT DEFAULT '',
  role TEXT DEFAULT 'user', theme TEXT DEFAULT 'dark',
  registered INTEGER DEFAULT 0, login TEXT,
  password_hash TEXT DEFAULT '', avatar TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  parent_id TEXT, org_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.run(`CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL,
  name TEXT NOT NULL, nom_type TEXT NOT NULL DEFAULT 'tovar',
  unit TEXT NOT NULL DEFAULT 'кг', price REAL DEFAULT 0,
  packaging TEXT DEFAULT '', pack_price REAL DEFAULT 0,
  pack_qty REAL DEFAULT 0, folder_id TEXT,
  gross_weight REAL DEFAULT 0, net_weight REAL DEFAULT 0,
  linked_card_id TEXT DEFAULT '', description TEXT DEFAULT '',
  image TEXT DEFAULT '', fats REAL DEFAULT 0,
  proteins REAL DEFAULT 0, carbs REAL DEFAULT 0,
  calories REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.run(`CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY, org_id TEXT NOT NULL,
  name TEXT NOT NULL, description TEXT DEFAULT '',
  output_qty REAL DEFAULT 0, output_unit TEXT DEFAULT 'порц',
  gross_weight REAL DEFAULT 0, net_weight REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.run(`CREATE TABLE IF NOT EXISTS steps (
  id TEXT PRIMARY KEY, card_id TEXT NOT NULL,
  idx INTEGER NOT NULL DEFAULT 0, name TEXT DEFAULT '',
  process TEXT DEFAULT '', temp TEXT DEFAULT '',
  time TEXT DEFAULT '', pressure TEXT DEFAULT '', note TEXT DEFAULT ''
)`);

db.run(`CREATE TABLE IF NOT EXISTS ingredients (
  id TEXT PRIMARY KEY, step_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'product',
  ref_id TEXT DEFAULT '', qty REAL DEFAULT 0
)`);

db.run(`CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY, user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)`);

// ── Migrations ───────────────────────────────────────────────────────────────
const migrations = [
  "ALTER TABLE products ADD COLUMN image TEXT DEFAULT ''",
  "ALTER TABLE products ADD COLUMN org_id TEXT DEFAULT ''",
  "ALTER TABLE cards ADD COLUMN org_id TEXT DEFAULT ''",
  "ALTER TABLE folders ADD COLUMN org_id TEXT DEFAULT ''",
  "ALTER TABLE products ADD COLUMN pack_price REAL DEFAULT 0",
  "ALTER TABLE products ADD COLUMN fats REAL DEFAULT 0",
  "ALTER TABLE products ADD COLUMN proteins REAL DEFAULT 0",
  "ALTER TABLE products ADD COLUMN carbs REAL DEFAULT 0",
  "ALTER TABLE products ADD COLUMN calories REAL DEFAULT 0",
  "ALTER TABLE products ADD COLUMN pack_qty REAL DEFAULT 0",
  "ALTER TABLE users ADD COLUMN login TEXT",
  "ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT ''",
  "ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''",
  "ALTER TABLE organizations ADD COLUMN type TEXT DEFAULT 'food'",
  "ALTER TABLE users ADD COLUMN active_org_id TEXT",
];
for (const sql of migrations) {
  try { db.run(sql); } catch (_) {}
}

// ── Data migration: create user_orgs for existing users ─────────────────────
try {
  const usersWithOrg = queryAll("SELECT id, org_id, role FROM users WHERE org_id IS NOT NULL AND org_id != ''");
  for (const u of usersWithOrg) {
    const exists = queryOne("SELECT user_id FROM user_orgs WHERE user_id = ? AND org_id = ?", [u.id, u.org_id]);
    if (!exists) {
      db.run("INSERT OR IGNORE INTO user_orgs (user_id, org_id, role) VALUES (?,?,?)", [u.id, u.org_id, u.role || "user"]);
    }
  }
  db.run("UPDATE users SET active_org_id = org_id WHERE active_org_id IS NULL AND org_id IS NOT NULL");
} catch (_) {}

// ── Indexes ─────────────────────────────────────────────────────────────────
const indexes = [
  "CREATE INDEX IF NOT EXISTS idx_products_org ON products(org_id)",
  "CREATE INDEX IF NOT EXISTS idx_cards_org ON cards(org_id)",
  "CREATE INDEX IF NOT EXISTS idx_folders_org ON folders(org_id)",
  "CREATE INDEX IF NOT EXISTS idx_steps_card ON steps(card_id)",
  "CREATE INDEX IF NOT EXISTS idx_ingredients_step ON ingredients(step_id)",
  "CREATE INDEX IF NOT EXISTS idx_users_tg ON users(tg_id)",
  "CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_users_login ON users(login)",
  "CREATE INDEX IF NOT EXISTS idx_user_orgs_user ON user_orgs(user_id)",
  "CREATE INDEX IF NOT EXISTS idx_user_orgs_org ON user_orgs(org_id)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_created ON sessions(created_at)",
];
for (const sql of indexes) {
  try { db.run(sql); } catch (_) {}
}

// Clean expired sessions on startup
try { db.run("DELETE FROM sessions WHERE created_at < datetime('now', '-7 days')"); } catch (_) {}

saveNow();

// ── User Mapper ──────────────────────────────────────────────────────────────
function mapUser(u) {
  if (!u) return null;
  const activeOrgId = u.active_org_id || u.org_id;
  const uo = activeOrgId
    ? queryOne("SELECT role FROM user_orgs WHERE user_id = ? AND org_id = ?", [u.id, activeOrgId])
    : null;
  const org = activeOrgId
    ? queryOne("SELECT type, name FROM organizations WHERE id = ?", [activeOrgId])
    : null;
  return {
    id: u.id, tgId: u.tg_id, orgId: activeOrgId, name: u.name,
    age: u.age, city: u.city, position: u.position,
    workplace: u.workplace, purpose: u.purpose,
    role: uo ? uo.role : (u.role || "user"),
    globalRole: u.role || "user",
    theme: u.theme, registered: !!u.registered,
    login: u.login || "", avatar: u.avatar || "",
    orgType: org ? org.type : "food",
    orgName: org ? org.name : "",
  };
}

function mapProduct(r) {
  return {
    id: r.id, name: r.name, nomType: r.nom_type, unit: r.unit,
    price: r.price, packaging: r.packaging,
    packPrice: r.pack_price || 0, packQty: r.pack_qty || 0,
    folderId: r.folder_id || null,
    grossWeight: r.gross_weight, netWeight: r.net_weight,
    linkedCardId: r.linked_card_id, description: r.description || "",
    image: r.image || "",
    fats: r.fats || 0, proteins: r.proteins || 0,
    carbs: r.carbs || 0, calories: r.calories || 0,
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// AUTH & USERS
// ══════════════════════════════════════════════════════════════════════════════

export function getAdminContact() {
  // Check user_orgs first for accurate role
  const a = queryOne(`SELECT u.name, u.tg_id, u.position, u.workplace
    FROM users u INNER JOIN user_orgs uo ON u.id = uo.user_id
    WHERE uo.role = 'admin'`);
  if (!a) {
    // Fallback to users table
    const b = queryOne("SELECT name, tg_id, position, workplace FROM users WHERE role = 'admin'");
    if (!b) return null;
    return { name: b.name, tgId: b.tg_id, position: b.position, workplace: b.workplace };
  }
  return { name: a.name, tgId: a.tg_id, position: a.position, workplace: a.workplace };
}

export function getUser(tgId) {
  return mapUser(queryOne("SELECT * FROM users WHERE tg_id = ?", [String(tgId)]));
}

export function registerUser(tgId, data) {
  const existing = getUser(tgId);
  const name = sanitize(data.name, 100);
  const age = sanitizeNum(data.age, 0, 150);
  const city = sanitize(data.city, 100);
  const position = sanitize(data.position, 100);
  const workplace = sanitize(data.workplace, 100);
  const purpose = sanitize(data.purpose, 300);
  const login = data.login ? sanitize(data.login, 50) : null;

  if (existing) {
    const parts = ["name=?", "age=?", "city=?", "position=?", "workplace=?", "purpose=?", "registered=1"];
    const params = [name, age, city, position, workplace, purpose];
    if (login) { parts.push("login=?"); params.push(login); }
    if (data.password && data.password.length >= 4) {
      parts.push("password_hash=?"); params.push(hashPassword(data.password));
    }
    params.push(String(tgId));
    run("UPDATE users SET " + parts.join(", ") + " WHERE tg_id=?", params);
    if (existing.orgId && workplace) {
      run("UPDATE organizations SET name=? WHERE id=?", [workplace, existing.orgId]);
    }
    return getUser(tgId);
  }

  const orgId = genId();
  const userId = genId();
  // First user in the system becomes admin, all others are regular users
  const totalUsers = queryOne("SELECT COUNT(*) as cnt FROM users WHERE registered = 1");
  const role = (!totalUsers || totalUsers.cnt === 0) ? "admin" : "user";
  const validTypes = ["food", "manufacturing", "construction"];
  const orgType = validTypes.includes(data.orgType) ? data.orgType : "food";

  db.run("INSERT INTO organizations (id, name, type) VALUES (?,?,?)", [orgId, workplace || "Организация", orgType]);
  db.run("INSERT INTO users (id, tg_id, org_id, active_org_id, name, age, city, position, workplace, purpose, role, theme, registered, login, password_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)",
    [userId, String(tgId), orgId, orgId, name, age, city, position, workplace, purpose, role, "dark", login, data.password ? hashPassword(data.password) : ""]);
  db.run("INSERT INTO user_orgs (user_id, org_id, role) VALUES (?,?,?)", [userId, orgId, role]);
  save();

  return getUser(tgId);
}

export function updateTheme(tgId, theme) {
  if (!["dark", "light"].includes(theme)) return;
  run("UPDATE users SET theme=? WHERE tg_id=?", [theme, String(tgId)]);
}

export function loginUser(login, password) {
  if (!login || !password) return null;
  const row = queryOne("SELECT * FROM users WHERE login = ?", [sanitize(login, 50)]);
  if (!row) return null;
  if (!row.password_hash) return null;
  // Constant-time comparison to prevent timing attacks
  const hash = hashPassword(password);
  if (hash.length !== row.password_hash.length) return null;
  let match = true;
  for (let i = 0; i < hash.length; i++) {
    if (hash[i] !== row.password_hash[i]) match = false;
  }
  if (!match) return null;
  return mapUser(row);
}

export function loginExists(login) {
  return !!queryOne("SELECT id FROM users WHERE login = ?", [sanitize(login, 50)]);
}

export function linkTelegramId(oldTgId, newTgId) {
  const existing = queryOne("SELECT id FROM users WHERE tg_id = ?", [String(newTgId)]);
  if (existing) return false;
  run("UPDATE users SET tg_id=? WHERE tg_id=?", [String(newTgId), String(oldTgId)]);
  return true;
}

// ── Multi-Org Management ────────────────────────────────────────────────────

export function getUserOrgs(userId) {
  return queryAll(
    `SELECT o.id, o.name, o.type, o.created_at, uo.role
     FROM user_orgs uo JOIN organizations o ON o.id = uo.org_id
     WHERE uo.user_id = ? ORDER BY o.created_at DESC`,
    [userId]
  ).map(o => ({
    id: o.id, name: o.name, type: o.type,
    role: o.role, createdAt: o.created_at,
  }));
}

export function createOrg(userId, name, type) {
  const validTypes = ["food", "manufacturing", "construction"];
  if (!validTypes.includes(type)) type = "food";
  const cleanName = sanitize(name, 100) || "Организация";
  const orgId = genId();
  db.run("INSERT INTO organizations (id, name, type) VALUES (?,?,?)", [orgId, cleanName, type]);
  db.run("INSERT INTO user_orgs (user_id, org_id, role) VALUES (?,?,?)", [userId, orgId, "admin"]);
  db.run("UPDATE users SET active_org_id = ?, org_id = ? WHERE id = ?", [orgId, orgId, userId]);
  save();
  return { id: orgId, name: cleanName, type, role: "admin" };
}

export function switchOrg(userId, orgId) {
  const membership = queryOne("SELECT role FROM user_orgs WHERE user_id = ? AND org_id = ?", [userId, orgId]);
  if (!membership) return false;
  db.run("UPDATE users SET active_org_id = ?, org_id = ? WHERE id = ?", [orgId, orgId, userId]);
  save();
  return true;
}

export function getOrgType(orgId) {
  const org = queryOne("SELECT type FROM organizations WHERE id = ?", [orgId]);
  return org ? org.type : "food";
}

export function updateOrg(orgId, name, type) {
  const validTypes = ["food", "manufacturing", "construction"];
  if (type && !validTypes.includes(type)) type = null;
  const cleanName = name ? sanitize(name, 100) : null;
  if (cleanName && type) {
    run("UPDATE organizations SET name=?, type=? WHERE id=?", [cleanName, type, orgId]);
  } else if (cleanName) {
    run("UPDATE organizations SET name=? WHERE id=?", [cleanName, orgId]);
  } else if (type) {
    run("UPDATE organizations SET type=? WHERE id=?", [type, orgId]);
  }
}

export function deleteOrg(userId, orgId) {
  const membership = queryOne("SELECT role FROM user_orgs WHERE user_id = ? AND org_id = ?", [userId, orgId]);
  if (!membership || membership.role !== "admin") return false;
  deleteOrgData(orgId);
  db.run("DELETE FROM user_orgs WHERE org_id = ?", [orgId]);
  db.run("DELETE FROM organizations WHERE id = ?", [orgId]);
  const user = queryOne("SELECT id, active_org_id FROM users WHERE id = ?", [userId]);
  if (user && user.active_org_id === orgId) {
    const other = queryOne("SELECT org_id FROM user_orgs WHERE user_id = ?", [userId]);
    const newOrg = other ? other.org_id : null;
    db.run("UPDATE users SET active_org_id = ?, org_id = ? WHERE id = ?", [newOrg, newOrg, userId]);
  }
  saveNow();
  return true;
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  db.run("INSERT INTO sessions (token, user_id) VALUES (?,?)", [token, userId]);
  // Clean old sessions efficiently (single query)
  try {
    db.run(`DELETE FROM sessions WHERE user_id = ? AND token NOT IN (
      SELECT token FROM sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
    )`, [userId, userId]);
  } catch (_) {}
  save();
  return token;
}

export function getSessionUser(token) {
  if (!token || token.length !== 64) return null;
  const row = queryOne(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ? AND s.created_at > datetime('now', '-7 days')",
    [token]
  );
  if (!row) {
    try { db.run("DELETE FROM sessions WHERE token = ?", [token]); } catch (_) {}
    return null;
  }
  return mapUser(row);
}

export function deleteSession(token) {
  if (!token) return;
  run("DELETE FROM sessions WHERE token = ?", [token]);
}

// ── Profile Management ───────────────────────────────────────────────────────

export function updateUserProfile(tgId, data) {
  const name = sanitize(data.name, 100);
  const age = sanitizeNum(data.age, 0, 150);
  const city = sanitize(data.city, 100);
  const position = sanitize(data.position, 100);
  const workplace = sanitize(data.workplace, 100);
  const purpose = sanitize(data.purpose, 300);
  run("UPDATE users SET name=?, age=?, city=?, position=?, workplace=?, purpose=? WHERE tg_id=?",
    [name, age, city, position, workplace, purpose, String(tgId)]);
  if (workplace) {
    const u = getUser(tgId);
    if (u && u.orgId) run("UPDATE organizations SET name=? WHERE id=?", [workplace, u.orgId]);
  }
  return getUser(tgId);
}

export function changePassword(tgId, oldPassword, newPassword) {
  if (!newPassword || newPassword.length < 4) return { ok: false, error: "password_too_short" };
  const row = queryOne("SELECT password_hash FROM users WHERE tg_id = ?", [String(tgId)]);
  if (!row) return { ok: false, error: "user_not_found" };
  if (row.password_hash && row.password_hash !== hashPassword(oldPassword)) {
    return { ok: false, error: "wrong_password" };
  }
  run("UPDATE users SET password_hash=? WHERE tg_id=?", [hashPassword(newPassword), String(tgId)]);
  return { ok: true };
}

export function resetPassword(login, newPassword) {
  if (!newPassword || newPassword.length < 4) return { ok: false, error: "password_too_short" };
  const row = queryOne("SELECT tg_id FROM users WHERE login = ?", [sanitize(login, 50)]);
  if (!row) return { ok: false, error: "user_not_found" };
  run("UPDATE users SET password_hash=? WHERE login=?", [hashPassword(newPassword), sanitize(login, 50)]);
  return { ok: true };
}

export function changeLogin(tgId, newLogin) {
  const clean = sanitize(newLogin, 50);
  if (clean.length < 3) return { ok: false, error: "login_too_short" };
  const dup = queryOne("SELECT id FROM users WHERE login = ? AND tg_id != ?", [clean, String(tgId)]);
  if (dup) return { ok: false, error: "login_taken" };
  run("UPDATE users SET login=? WHERE tg_id=?", [clean, String(tgId)]);
  return { ok: true };
}

export function updateAvatar(tgId, avatar) {
  run("UPDATE users SET avatar=? WHERE tg_id=?", [sanitize(avatar, 500) || "", String(tgId)]);
}

// ══════════════════════════════════════════════════════════════════════════════
// DATA MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

export function deleteOrgData(orgId) {
  // Use subqueries for efficiency instead of looping
  db.run(`DELETE FROM ingredients WHERE step_id IN (
    SELECT s.id FROM steps s INNER JOIN cards c ON s.card_id = c.id WHERE c.org_id = ?
  )`, [orgId]);
  db.run(`DELETE FROM steps WHERE card_id IN (
    SELECT id FROM cards WHERE org_id = ?
  )`, [orgId]);
  db.run("DELETE FROM cards WHERE org_id = ?", [orgId]);
  db.run("DELETE FROM products WHERE org_id = ?", [orgId]);
  db.run("DELETE FROM folders WHERE org_id = ?", [orgId]);
  saveNow();
}

export function deleteUserAccount(tgId) {
  const user = getUser(tgId);
  if (!user) return;
  db.run("DELETE FROM sessions WHERE user_id = ?", [user.id]);
  // Clean up all orgs where user is the only member
  const userOrgs = queryAll("SELECT org_id FROM user_orgs WHERE user_id = ?", [user.id]);
  for (const uo of userOrgs) {
    const memberCount = queryOne("SELECT COUNT(*) as c FROM user_orgs WHERE org_id = ?", [uo.org_id]);
    if (memberCount && memberCount.c <= 1) {
      deleteOrgData(uo.org_id);
      db.run("DELETE FROM organizations WHERE id = ?", [uo.org_id]);
    }
  }
  db.run("DELETE FROM user_orgs WHERE user_id = ?", [user.id]);
  db.run("DELETE FROM users WHERE tg_id = ?", [String(tgId)]);
  saveNow();
}

// ══════════════════════════════════════════════════════════════════════════════
// ORGANIZATIONS (Admin)
// ══════════════════════════════════════════════════════════════════════════════

export function getOrg(orgId) {
  const row = queryOne("SELECT * FROM organizations WHERE id = ?", [orgId]);
  if (!row) return null;
  return { id: row.id, name: row.name, type: row.type, createdAt: row.created_at };
}

export function getAllOrgs() {
  // Single query with subqueries instead of N+3
  return queryAll(`
    SELECT o.*,
      (SELECT COUNT(*) FROM users WHERE org_id = o.id) as user_count,
      (SELECT COUNT(*) FROM products WHERE org_id = o.id) as product_count,
      (SELECT COUNT(*) FROM cards WHERE org_id = o.id) as card_count
    FROM organizations o ORDER BY o.created_at DESC
  `).map(o => ({
    id: o.id, name: o.name, type: o.type, createdAt: o.created_at,
    userCount: o.user_count || 0,
    productCount: o.product_count || 0,
    cardCount: o.card_count || 0,
  }));
}

export function getAllUsers() {
  return queryAll(`
    SELECT u.*, o.name as org_name
    FROM users u LEFT JOIN organizations o ON u.org_id = o.id
    ORDER BY u.created_at DESC
  `).map(u => ({
    id: u.id, tgId: u.tg_id, orgId: u.org_id, orgName: u.org_name,
    name: u.name, age: u.age, city: u.city, position: u.position,
    workplace: u.workplace, purpose: u.purpose, role: u.role,
    registered: !!u.registered, createdAt: u.created_at,
  }));
}

export function setUserRole(tgId, role) {
  const validRoles = ["user", "technolog", "admin"];
  if (!validRoles.includes(role)) return;
  run("UPDATE users SET role=? WHERE tg_id=?", [role, String(tgId)]);
  const user = queryOne("SELECT id, active_org_id, org_id FROM users WHERE tg_id = ?", [String(tgId)]);
  if (user) {
    const orgId = user.active_org_id || user.org_id;
    if (orgId) {
      const exists = queryOne("SELECT user_id FROM user_orgs WHERE user_id = ? AND org_id = ?", [user.id, orgId]);
      if (exists) {
        run("UPDATE user_orgs SET role=? WHERE user_id=? AND org_id=?", [role, user.id, orgId]);
      }
    }
  }
}

export function getOrgData(orgId) {
  return {
    products: queryAll("SELECT * FROM products WHERE org_id = ? ORDER BY name", [orgId]).map(mapProduct),
    cards: queryAll(`
      SELECT c.*, (SELECT COUNT(*) FROM steps WHERE card_id = c.id) as steps_count
      FROM cards c WHERE c.org_id = ? ORDER BY c.name
    `, [orgId]).map(c => ({
      id: c.id, name: c.name, description: c.description || "",
      outputQty: c.output_qty, outputUnit: c.output_unit,
      stepsCount: c.steps_count || 0,
    })),
    folders: queryAll("SELECT * FROM folders WHERE org_id = ? ORDER BY name", [orgId])
      .map(f => ({ id: f.id, name: f.name })),
    users: queryAll("SELECT name, position, city FROM users WHERE org_id = ?", [orgId]),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// FOLDERS
// ══════════════════════════════════════════════════════════════════════════════

export function getFolders(orgId) {
  return queryAll("SELECT * FROM folders WHERE org_id = ? ORDER BY name", [orgId])
    .map(r => ({ id: r.id, name: r.name, parentId: r.parent_id || null }));
}

export function upsertFolder(orgId, f) {
  const name = sanitize(f.name, 100);
  if (!name) return;
  const exists = queryOne("SELECT id, org_id FROM folders WHERE id = ?", [f.id]);
  if (exists) {
    // Verify ownership
    if (exists.org_id !== orgId) return;
    run("UPDATE folders SET name=?, parent_id=? WHERE id=? AND org_id=?", [name, f.parentId || null, f.id, orgId]);
  } else {
    run("INSERT INTO folders (id, name, parent_id, org_id) VALUES (?,?,?,?)", [f.id, name, f.parentId || null, orgId]);
  }
}

export function deleteFolder(orgId, id) {
  // Unlink products from this folder before deleting
  db.run("UPDATE products SET folder_id = NULL WHERE folder_id = ? AND org_id = ?", [id, orgId]);
  // Also delete child folders
  db.run("DELETE FROM folders WHERE parent_id = ? AND org_id = ?", [id, orgId]);
  run("DELETE FROM folders WHERE id = ? AND org_id = ?", [id, orgId]);
}

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════

export function getProducts(orgId) {
  return queryAll("SELECT * FROM products WHERE org_id = ? ORDER BY name", [orgId]).map(mapProduct);
}

export function upsertProduct(orgId, p) {
  const name = sanitize(p.name, 200);
  if (!name) return;
  const validNomTypes = ["tovar", "zagotovka", "polufabrikat", "gotovaya", "blyudo", "hom_ashyo", "tayyor_mahsulot"];
  const nomType = validNomTypes.includes(p.nomType) ? p.nomType : "tovar";

  const exists = queryOne("SELECT id, org_id FROM products WHERE id = ?", [p.id]);
  if (exists) {
    // Verify ownership
    if (exists.org_id !== orgId) return;
    run(`UPDATE products SET name=?, nom_type=?, unit=?, price=?, packaging=?,
      pack_price=?, pack_qty=?, folder_id=?, gross_weight=?, net_weight=?,
      linked_card_id=?, description=?, image=?,
      fats=?, proteins=?, carbs=?, calories=? WHERE id=? AND org_id=?`,
      [name, nomType, sanitize(p.unit, 20) || "кг", sanitizeNum(p.price, 0), sanitize(p.packaging, 100),
       sanitizeNum(p.packPrice, 0), sanitizeNum(p.packQty, 0),
       p.folderId || null, sanitizeNum(p.grossWeight, 0), sanitizeNum(p.netWeight, 0),
       p.linkedCardId || "", sanitize(p.description, 500), sanitize(p.image, 500),
       sanitizeNum(p.fats, 0), sanitizeNum(p.proteins, 0), sanitizeNum(p.carbs, 0), sanitizeNum(p.calories, 0),
       p.id, orgId]);
  } else {
    run(`INSERT INTO products (id, org_id, name, nom_type, unit, price, packaging, pack_price, pack_qty, folder_id,
      gross_weight, net_weight, linked_card_id, description, image, fats, proteins, carbs, calories)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [p.id, orgId, name, nomType, sanitize(p.unit, 20) || "кг", sanitizeNum(p.price, 0), sanitize(p.packaging, 100),
       sanitizeNum(p.packPrice, 0), sanitizeNum(p.packQty, 0),
       p.folderId || null, sanitizeNum(p.grossWeight, 0), sanitizeNum(p.netWeight, 0),
       p.linkedCardId || "", sanitize(p.description, 500), sanitize(p.image, 500),
       sanitizeNum(p.fats, 0), sanitizeNum(p.proteins, 0), sanitizeNum(p.carbs, 0), sanitizeNum(p.calories, 0)]);
  }
}

export function deleteProduct(orgId, id) {
  run("DELETE FROM products WHERE id = ? AND org_id = ?", [id, orgId]);
}

// ══════════════════════════════════════════════════════════════════════════════
// CARDS (Tech Cards)
// ══════════════════════════════════════════════════════════════════════════════

export function getCards(orgId) {
  const cards = queryAll("SELECT * FROM cards WHERE org_id = ? ORDER BY name", [orgId]);
  if (cards.length === 0) return [];

  // Batch load all steps and ingredients for this org's cards (eliminates N+1)
  const cardIds = cards.map(c => c.id);
  const placeholders = cardIds.map(() => "?").join(",");

  const allSteps = queryAll(
    `SELECT * FROM steps WHERE card_id IN (${placeholders}) ORDER BY card_id, idx`,
    cardIds
  );
  const stepIds = allSteps.map(s => s.id);
  let allIngredients = [];
  if (stepIds.length > 0) {
    // Batch in chunks of 500 to avoid SQL variable limit
    for (let i = 0; i < stepIds.length; i += 500) {
      const chunk = stepIds.slice(i, i + 500);
      const ph = chunk.map(() => "?").join(",");
      const ings = queryAll(`SELECT * FROM ingredients WHERE step_id IN (${ph})`, chunk);
      allIngredients = allIngredients.concat(ings);
    }
  }

  // Index by parent
  const stepsByCard = {};
  for (const s of allSteps) {
    if (!stepsByCard[s.card_id]) stepsByCard[s.card_id] = [];
    stepsByCard[s.card_id].push(s);
  }
  const ingsByStep = {};
  for (const i of allIngredients) {
    if (!ingsByStep[i.step_id]) ingsByStep[i.step_id] = [];
    ingsByStep[i.step_id].push(i);
  }

  return cards.map(c => ({
    id: c.id, name: c.name, description: c.description || "",
    outputQty: c.output_qty, outputUnit: c.output_unit,
    grossWeight: c.gross_weight, netWeight: c.net_weight,
    createdAt: c.created_at,
    steps: (stepsByCard[c.id] || []).map(s => ({
      id: s.id, name: s.name, process: s.process,
      params: { temp: s.temp, time: s.time, pressure: s.pressure, note: s.note },
      ingredients: (ingsByStep[s.id] || []).map(i => ({
        id: i.id, type: i.type, refId: i.ref_id, qty: i.qty,
      })),
    })),
  }));
}

export function upsertCard(orgId, card) {
  const name = sanitize(card.name, 200);
  if (!name) return;

  const exists = queryOne("SELECT id, org_id FROM cards WHERE id = ?", [card.id]);
  if (exists) {
    if (exists.org_id !== orgId) return;
    db.run("UPDATE cards SET name=?, description=?, output_qty=?, output_unit=?, gross_weight=?, net_weight=? WHERE id=? AND org_id=?",
      [name, sanitize(card.description, 500), sanitizeNum(card.outputQty, 0), sanitize(card.outputUnit, 20) || "порц",
       sanitizeNum(card.grossWeight, 0), sanitizeNum(card.netWeight, 0), card.id, orgId]);
  } else {
    db.run("INSERT INTO cards (id, org_id, name, description, output_qty, output_unit, gross_weight, net_weight, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
      [card.id, orgId, name, sanitize(card.description, 500), sanitizeNum(card.outputQty, 0),
       sanitize(card.outputUnit, 20) || "порц", sanitizeNum(card.grossWeight, 0), sanitizeNum(card.netWeight, 0),
       card.createdAt || new Date().toISOString()]);
  }

  // Clear old steps & ingredients efficiently
  db.run(`DELETE FROM ingredients WHERE step_id IN (SELECT id FROM steps WHERE card_id = ?)`, [card.id]);
  db.run("DELETE FROM steps WHERE card_id = ?", [card.id]);

  for (let idx = 0; idx < (card.steps || []).length; idx++) {
    const s = card.steps[idx];
    db.run("INSERT INTO steps (id, card_id, idx, name, process, temp, time, pressure, note) VALUES (?,?,?,?,?,?,?,?,?)",
      [s.id, card.id, idx, sanitize(s.name, 100), sanitize(s.process, 100),
       sanitize(s.params?.temp, 20), sanitize(s.params?.time, 20),
       sanitize(s.params?.pressure, 20), sanitize(s.params?.note, 300)]);
    for (const i of s.ingredients || []) {
      db.run("INSERT INTO ingredients (id, step_id, type, ref_id, qty) VALUES (?,?,?,?,?)",
        [i.id, s.id, i.type === "semifinished" ? "semifinished" : "product", i.refId || "", sanitizeNum(i.qty, 0)]);
    }
  }
  save();
}

export function deleteCard(orgId, id) {
  // Efficient cascade delete with subquery
  db.run("DELETE FROM ingredients WHERE step_id IN (SELECT id FROM steps WHERE card_id = ?)", [id]);
  db.run("DELETE FROM steps WHERE card_id = ?", [id]);
  run("DELETE FROM cards WHERE id = ? AND org_id = ?", [id, orgId]);
}

export default db;
