// ══════════════════════════════════════════════════════════════════════════════
// TechCards PRO — Database Layer (sql.js, optimized)
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

// ── Debounced Save (batch multiple writes into one disk write) ───────────────
let saveTimer = null;
function save() {
  if (saveTimer) return; // Already scheduled
  saveTimer = setTimeout(() => {
    try {
      writeFileSync(dbPath, Buffer.from(db.export()));
    } catch (e) {
      console.error("[DB] Save failed:", e.message);
    }
    saveTimer = null;
  }, 100); // Save max once per 100ms
}

function saveNow() {
  if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
  try { writeFileSync(dbPath, Buffer.from(db.export())); } catch (_) {}
}

// Save on exit
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
  const rows = queryAll(sql, params);
  return rows.length ? rows[0] : null;
}

function run(sql, params) {
  db.run(sql, params);
  save();
}

function genId() {
  return crypto.randomBytes(6).toString("hex");
}

function hashPassword(pw) {
  return crypto.createHash("sha256").update(String(pw)).digest("hex");
}

// ── Schema ───────────────────────────────────────────────────────────────────
db.run(`CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY, name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'food',
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.run(`CREATE TABLE IF NOT EXISTS user_orgs (
  user_id TEXT NOT NULL, org_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
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
      db.run("INSERT OR IGNORE INTO user_orgs (user_id, org_id, role) VALUES (?,?,?)", [u.id, u.org_id, u.role || "admin"]);
    }
  }
  // Set active_org_id for users who don't have one
  db.run("UPDATE users SET active_org_id = org_id WHERE active_org_id IS NULL AND org_id IS NOT NULL");
} catch (_) {}

// ── Indexes (after migrations) ───────────────────────────────────────────────
const indexes = [
  "CREATE INDEX IF NOT EXISTS idx_products_org ON products(org_id)",
  "CREATE INDEX IF NOT EXISTS idx_cards_org ON cards(org_id)",
  "CREATE INDEX IF NOT EXISTS idx_folders_org ON folders(org_id)",
  "CREATE INDEX IF NOT EXISTS idx_steps_card ON steps(card_id)",
  "CREATE INDEX IF NOT EXISTS idx_ingredients_step ON ingredients(step_id)",
  "CREATE INDEX IF NOT EXISTS idx_users_tg ON users(tg_id)",
  "CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id)",
  "CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id)",
];
for (const sql of indexes) {
  try { db.run(sql); } catch (_) {}
}
try { db.run("CREATE INDEX IF NOT EXISTS idx_users_login ON users(login)"); } catch (_) {}
try { db.run("CREATE INDEX IF NOT EXISTS idx_user_orgs_user ON user_orgs(user_id)"); } catch (_) {}
try { db.run("CREATE INDEX IF NOT EXISTS idx_user_orgs_org ON user_orgs(org_id)"); } catch (_) {}

saveNow();

// ── User Mapper ──────────────────────────────────────────────────────────────
function mapUser(u) {
  if (!u) return null;
  const activeOrgId = u.active_org_id || u.org_id;
  // Get role from user_orgs for active org (fallback to user.role)
  const uo = activeOrgId
    ? queryOne("SELECT role FROM user_orgs WHERE user_id = ? AND org_id = ?", [u.id, activeOrgId])
    : null;
  // Get org type
  const org = activeOrgId
    ? queryOne("SELECT type, name FROM organizations WHERE id = ?", [activeOrgId])
    : null;
  return {
    id: u.id, tgId: u.tg_id, orgId: activeOrgId, name: u.name,
    age: u.age, city: u.city, position: u.position,
    workplace: u.workplace, purpose: u.purpose,
    role: uo ? uo.role : (u.role || "user"),
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
  const a = queryOne("SELECT name, tg_id, position, workplace FROM users WHERE role = 'admin' LIMIT 1");
  if (!a) return null;
  return { name: a.name, tgId: a.tg_id, position: a.position, workplace: a.workplace };
}

export function getUser(tgId) {
  return mapUser(queryOne("SELECT * FROM users WHERE tg_id = ?", [String(tgId)]));
}

export function registerUser(tgId, data) {
  const existing = getUser(tgId);

  if (existing) {
    const parts = ["name=?", "age=?", "city=?", "position=?", "workplace=?", "purpose=?", "registered=1"];
    const params = [data.name || "", +data.age || 0, data.city || "", data.position || "", data.workplace || "", data.purpose || ""];
    if (data.login) { parts.push("login=?"); params.push(data.login); }
    if (data.password) { parts.push("password_hash=?"); params.push(hashPassword(data.password)); }
    params.push(String(tgId));
    run("UPDATE users SET " + parts.join(", ") + " WHERE tg_id=?", params);
    if (existing.orgId && data.workplace) {
      run("UPDATE organizations SET name=? WHERE id=?", [data.workplace, existing.orgId]);
    }
    return getUser(tgId);
  }

  // New user creates a new org — org creator is always admin
  const orgId = genId();
  const userId = genId();
  const role = "admin";

  const orgType = data.orgType || "food";
  db.run("INSERT INTO organizations (id, name, type) VALUES (?,?,?)", [orgId, data.workplace || "Организация", orgType]);
  db.run("INSERT INTO users (id, tg_id, org_id, active_org_id, name, age, city, position, workplace, purpose, role, theme, registered, login, password_hash) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,1,?,?)",
    [userId, String(tgId), orgId, orgId, data.name || "", +data.age || 0, data.city || "", data.position || "", data.workplace || "", data.purpose || "", role, "dark", data.login || null, data.password ? hashPassword(data.password) : ""]);
  db.run("INSERT INTO user_orgs (user_id, org_id, role) VALUES (?,?,?)", [userId, orgId, "admin"]);
  saveNow();

  return getUser(tgId);
}

export function updateTheme(tgId, theme) {
  run("UPDATE users SET theme=? WHERE tg_id=?", [theme, String(tgId)]);
}

export function loginUser(login, password) {
  const row = queryOne("SELECT * FROM users WHERE login = ?", [login]);
  if (!row) return null;
  if (row.password_hash !== hashPassword(password)) return null;
  return mapUser(row);
}

export function loginExists(login) {
  return !!queryOne("SELECT id FROM users WHERE login = ?", [login]);
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
  const orgId = genId();
  db.run("INSERT INTO organizations (id, name, type) VALUES (?,?,?)", [orgId, name || "Организация", type]);
  db.run("INSERT INTO user_orgs (user_id, org_id, role) VALUES (?,?,?)", [userId, orgId, "admin"]);
  db.run("UPDATE users SET active_org_id = ?, org_id = ? WHERE id = ?", [orgId, orgId, userId]);
  saveNow();
  return { id: orgId, name: name || "Организация", type, role: "admin" };
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
  if (name && type) {
    run("UPDATE organizations SET name=?, type=? WHERE id=?", [name, type, orgId]);
  } else if (name) {
    run("UPDATE organizations SET name=? WHERE id=?", [name, orgId]);
  } else if (type) {
    run("UPDATE organizations SET type=? WHERE id=?", [type, orgId]);
  }
}

export function deleteOrg(userId, orgId) {
  // Only admin can delete
  const membership = queryOne("SELECT role FROM user_orgs WHERE user_id = ? AND org_id = ?", [userId, orgId]);
  if (!membership || membership.role !== "admin") return false;
  deleteOrgData(orgId);
  db.run("DELETE FROM user_orgs WHERE org_id = ?", [orgId]);
  db.run("DELETE FROM organizations WHERE id = ?", [orgId]);
  // Switch user to another org if they were on this one
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
  run("INSERT INTO sessions (token, user_id) VALUES (?,?)", [token, userId]);
  // Clean old sessions (keep last 10 per user)
  try {
    const old = queryAll("SELECT token FROM sessions WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    if (old.length > 10) {
      for (let i = 10; i < old.length; i++) {
        db.run("DELETE FROM sessions WHERE token = ?", [old[i].token]);
      }
      save();
    }
  } catch (_) {}
  return token;
}

export function getSessionUser(token) {
  if (!token) return null;
  const row = queryOne(
    "SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?",
    [token]
  );
  return mapUser(row);
}

export function deleteSession(token) {
  run("DELETE FROM sessions WHERE token = ?", [token]);
}

// ── Profile Management ───────────────────────────────────────────────────────

export function updateUserProfile(tgId, data) {
  run("UPDATE users SET name=?, age=?, city=?, position=?, workplace=?, purpose=? WHERE tg_id=?",
    [data.name || "", +data.age || 0, data.city || "", data.position || "", data.workplace || "", data.purpose || "", String(tgId)]);
  if (data.workplace) {
    const u = getUser(tgId);
    if (u && u.orgId) run("UPDATE organizations SET name=? WHERE id=?", [data.workplace, u.orgId]);
  }
  return getUser(tgId);
}

export function changePassword(tgId, oldPassword, newPassword) {
  const row = queryOne("SELECT password_hash FROM users WHERE tg_id = ?", [String(tgId)]);
  if (!row) return { ok: false, error: "user_not_found" };
  if (row.password_hash && row.password_hash !== hashPassword(oldPassword)) {
    return { ok: false, error: "wrong_password" };
  }
  run("UPDATE users SET password_hash=? WHERE tg_id=?", [hashPassword(newPassword), String(tgId)]);
  return { ok: true };
}

export function resetPassword(login, newPassword) {
  const row = queryOne("SELECT tg_id FROM users WHERE login = ?", [login]);
  if (!row) return { ok: false, error: "user_not_found" };
  run("UPDATE users SET password_hash=? WHERE login=?", [hashPassword(newPassword), login]);
  return { ok: true };
}

export function changeLogin(tgId, newLogin) {
  const dup = queryOne("SELECT id FROM users WHERE login = ? AND tg_id != ?", [newLogin, String(tgId)]);
  if (dup) return { ok: false, error: "login_taken" };
  run("UPDATE users SET login=? WHERE tg_id=?", [newLogin, String(tgId)]);
  return { ok: true };
}

export function updateAvatar(tgId, avatar) {
  run("UPDATE users SET avatar=? WHERE tg_id=?", [avatar || "", String(tgId)]);
}

// ══════════════════════════════════════════════════════════════════════════════
// DATA MANAGEMENT
// ══════════════════════════════════════════════════════════════════════════════

export function deleteOrgData(orgId) {
  const cards = queryAll("SELECT id FROM cards WHERE org_id = ?", [orgId]);
  for (const c of cards) {
    const steps = queryAll("SELECT id FROM steps WHERE card_id = ?", [c.id]);
    for (const s of steps) db.run("DELETE FROM ingredients WHERE step_id = ?", [s.id]);
    db.run("DELETE FROM steps WHERE card_id = ?", [c.id]);
  }
  db.run("DELETE FROM cards WHERE org_id = ?", [orgId]);
  db.run("DELETE FROM products WHERE org_id = ?", [orgId]);
  db.run("DELETE FROM folders WHERE org_id = ?", [orgId]);
  saveNow();
}

export function deleteUserAccount(tgId) {
  const user = getUser(tgId);
  if (!user) return;
  db.run("DELETE FROM sessions WHERE user_id = ?", [user.id]);
  const others = queryAll("SELECT id FROM users WHERE org_id = ? AND tg_id != ?", [user.orgId, String(tgId)]);
  if (others.length === 0) {
    deleteOrgData(user.orgId);
    db.run("DELETE FROM organizations WHERE id = ?", [user.orgId]);
  }
  db.run("DELETE FROM users WHERE tg_id = ?", [String(tgId)]);
  saveNow();
}

// ══════════════════════════════════════════════════════════════════════════════
// ORGANIZATIONS (Admin)
// ══════════════════════════════════════════════════════════════════════════════

export function getOrg(orgId) {
  const row = queryOne("SELECT * FROM organizations WHERE id = ?", [orgId]);
  if (!row) return null;
  return { id: row.id, name: row.name, createdAt: row.created_at };
}

export function getAllOrgs() {
  return queryAll("SELECT * FROM organizations ORDER BY created_at DESC").map((o) => ({
    id: o.id, name: o.name, createdAt: o.created_at,
    userCount: queryOne("SELECT COUNT(*) as c FROM users WHERE org_id = ?", [o.id])?.c || 0,
    productCount: queryOne("SELECT COUNT(*) as c FROM products WHERE org_id = ?", [o.id])?.c || 0,
    cardCount: queryOne("SELECT COUNT(*) as c FROM cards WHERE org_id = ?", [o.id])?.c || 0,
  }));
}

export function getAllUsers() {
  return queryAll("SELECT u.*, o.name as org_name FROM users u LEFT JOIN organizations o ON u.org_id = o.id ORDER BY u.created_at DESC")
    .map((u) => ({
      id: u.id, tgId: u.tg_id, orgId: u.org_id, orgName: u.org_name,
      name: u.name, age: u.age, city: u.city, position: u.position,
      workplace: u.workplace, purpose: u.purpose, role: u.role,
      registered: !!u.registered, createdAt: u.created_at,
    }));
}

export function setUserRole(tgId, role) {
  run("UPDATE users SET role=? WHERE tg_id=?", [role, String(tgId)]);
}

export function getOrgData(orgId) {
  return {
    products: queryAll("SELECT * FROM products WHERE org_id = ? ORDER BY name", [orgId]).map(mapProduct),
    cards: queryAll("SELECT * FROM cards WHERE org_id = ? ORDER BY name", [orgId]).map((c) => ({
      id: c.id, name: c.name, description: c.description || "",
      outputQty: c.output_qty, outputUnit: c.output_unit,
      stepsCount: queryOne("SELECT COUNT(*) as c FROM steps WHERE card_id = ?", [c.id])?.c || 0,
    })),
    folders: queryAll("SELECT * FROM folders WHERE org_id = ? ORDER BY name", [orgId])
      .map((f) => ({ id: f.id, name: f.name })),
    users: queryAll("SELECT name, position, city FROM users WHERE org_id = ?", [orgId]),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// FOLDERS
// ══════════════════════════════════════════════════════════════════════════════

export function getFolders(orgId) {
  return queryAll("SELECT * FROM folders WHERE org_id = ? ORDER BY name", [orgId])
    .map((r) => ({ id: r.id, name: r.name, parentId: r.parent_id || null }));
}

export function upsertFolder(orgId, f) {
  const exists = queryOne("SELECT id FROM folders WHERE id = ?", [f.id]);
  if (exists) {
    run("UPDATE folders SET name=?, parent_id=? WHERE id=?", [f.name, f.parentId || null, f.id]);
  } else {
    run("INSERT INTO folders (id, name, parent_id, org_id) VALUES (?,?,?,?)", [f.id, f.name, f.parentId || null, orgId]);
  }
}

export function deleteFolder(orgId, id) {
  run("DELETE FROM folders WHERE id = ? AND org_id = ?", [id, orgId]);
}

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════

export function getProducts(orgId) {
  return queryAll("SELECT * FROM products WHERE org_id = ? ORDER BY name", [orgId]).map(mapProduct);
}

export function upsertProduct(orgId, p) {
  const exists = queryOne("SELECT id FROM products WHERE id = ?", [p.id]);
  if (exists) {
    run(`UPDATE products SET name=?, nom_type=?, unit=?, price=?, packaging=?,
      pack_price=?, pack_qty=?, folder_id=?, gross_weight=?, net_weight=?,
      linked_card_id=?, description=?, image=?,
      fats=?, proteins=?, carbs=?, calories=? WHERE id=?`,
      [p.name, p.nomType || "tovar", p.unit || "кг", +p.price || 0, p.packaging || "", +p.packPrice || 0, +p.packQty || 0,
       p.folderId || null, +p.grossWeight || 0, +p.netWeight || 0, p.linkedCardId || "", p.description || "", p.image || "",
       +p.fats || 0, +p.proteins || 0, +p.carbs || 0, +p.calories || 0, p.id]);
  } else {
    run(`INSERT INTO products (id, org_id, name, nom_type, unit, price, packaging, pack_price, pack_qty, folder_id,
      gross_weight, net_weight, linked_card_id, description, image, fats, proteins, carbs, calories)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [p.id, orgId, p.name, p.nomType || "tovar", p.unit || "кг", +p.price || 0, p.packaging || "", +p.packPrice || 0, +p.packQty || 0,
       p.folderId || null, +p.grossWeight || 0, +p.netWeight || 0, p.linkedCardId || "", p.description || "", p.image || "",
       +p.fats || 0, +p.proteins || 0, +p.carbs || 0, +p.calories || 0]);
  }
}

export function deleteProduct(orgId, id) {
  run("DELETE FROM products WHERE id = ? AND org_id = ?", [id, orgId]);
}

// ══════════════════════════════════════════════════════════════════════════════
// CARDS (Tech Cards)
// ══════════════════════════════════════════════════════════════════════════════

export function getCards(orgId) {
  return queryAll("SELECT * FROM cards WHERE org_id = ? ORDER BY name", [orgId]).map((c) => {
    const steps = queryAll("SELECT * FROM steps WHERE card_id = ? ORDER BY idx", [c.id]);
    return {
      id: c.id, name: c.name, description: c.description || "",
      outputQty: c.output_qty, outputUnit: c.output_unit,
      grossWeight: c.gross_weight, netWeight: c.net_weight,
      createdAt: c.created_at,
      steps: steps.map((s) => ({
        id: s.id, name: s.name, process: s.process,
        params: { temp: s.temp, time: s.time, pressure: s.pressure, note: s.note },
        ingredients: queryAll("SELECT * FROM ingredients WHERE step_id = ?", [s.id])
          .map((i) => ({ id: i.id, type: i.type, refId: i.ref_id, qty: i.qty })),
      })),
    };
  });
}

export function upsertCard(orgId, card) {
  const exists = queryOne("SELECT id FROM cards WHERE id = ?", [card.id]);
  if (exists) {
    db.run("UPDATE cards SET name=?, description=?, output_qty=?, output_unit=?, gross_weight=?, net_weight=? WHERE id=?",
      [card.name, card.description || "", +card.outputQty || 0, card.outputUnit || "порц", +card.grossWeight || 0, +card.netWeight || 0, card.id]);
  } else {
    db.run("INSERT INTO cards (id, org_id, name, description, output_qty, output_unit, gross_weight, net_weight, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
      [card.id, orgId, card.name, card.description || "", +card.outputQty || 0, card.outputUnit || "порц", +card.grossWeight || 0, +card.netWeight || 0, card.createdAt || new Date().toISOString()]);
  }

  // Clear old steps & ingredients, re-insert
  const oldSteps = queryAll("SELECT id FROM steps WHERE card_id = ?", [card.id]);
  for (const s of oldSteps) db.run("DELETE FROM ingredients WHERE step_id = ?", [s.id]);
  db.run("DELETE FROM steps WHERE card_id = ?", [card.id]);

  for (let idx = 0; idx < (card.steps || []).length; idx++) {
    const s = card.steps[idx];
    db.run("INSERT INTO steps (id, card_id, idx, name, process, temp, time, pressure, note) VALUES (?,?,?,?,?,?,?,?,?)",
      [s.id, card.id, idx, s.name || "", s.process || "", s.params?.temp || "", s.params?.time || "", s.params?.pressure || "", s.params?.note || ""]);
    for (const i of s.ingredients || []) {
      db.run("INSERT INTO ingredients (id, step_id, type, ref_id, qty) VALUES (?,?,?,?,?)",
        [i.id, s.id, i.type || "product", i.refId || "", +i.qty || 0]);
    }
  }
  saveNow();
}

export function deleteCard(orgId, id) {
  const steps = queryAll("SELECT id FROM steps WHERE card_id = ?", [id]);
  for (const s of steps) db.run("DELETE FROM ingredients WHERE step_id = ?", [s.id]);
  db.run("DELETE FROM steps WHERE card_id = ?", [id]);
  run("DELETE FROM cards WHERE id = ? AND org_id = ?", [id, orgId]);
}

export default db;
