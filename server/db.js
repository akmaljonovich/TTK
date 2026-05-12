import initSqlJs from "sql.js";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");
const uploadsDir = join(dataDir, "uploads");
const dbPath = join(dataDir, "techcards.db");

if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true });
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const SQL = await initSqlJs();

let db;
if (existsSync(dbPath)) {
  const buf = readFileSync(dbPath);
  db = new SQL.Database(buf);
} else {
  db = new SQL.Database();
}

db.run("PRAGMA foreign_keys = ON");

// ── Schema ──
db.run(`CREATE TABLE IF NOT EXISTS organizations (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.run(`CREATE TABLE IF NOT EXISTS users (
  id         TEXT PRIMARY KEY,
  tg_id      TEXT UNIQUE NOT NULL,
  org_id     TEXT,
  name       TEXT NOT NULL DEFAULT '',
  age        INTEGER DEFAULT 0,
  city       TEXT DEFAULT '',
  position   TEXT DEFAULT '',
  workplace  TEXT DEFAULT '',
  purpose    TEXT DEFAULT '',
  role       TEXT DEFAULT 'user',
  theme      TEXT DEFAULT 'dark',
  registered INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (org_id) REFERENCES organizations(id)
)`);

db.run(`CREATE TABLE IF NOT EXISTS folders (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  parent_id  TEXT,
  org_id     TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)`);

db.run(`CREATE TABLE IF NOT EXISTS products (
  id             TEXT PRIMARY KEY,
  org_id         TEXT NOT NULL,
  name           TEXT NOT NULL,
  nom_type       TEXT NOT NULL DEFAULT 'tovar',
  unit           TEXT NOT NULL DEFAULT 'кг',
  price          REAL DEFAULT 0,
  packaging      TEXT DEFAULT '',
  folder_id      TEXT,
  gross_weight   REAL DEFAULT 0,
  net_weight     REAL DEFAULT 0,
  linked_card_id TEXT DEFAULT '',
  description    TEXT DEFAULT '',
  image          TEXT DEFAULT '',
  created_at     TEXT DEFAULT (datetime('now'))
)`);

db.run(`CREATE TABLE IF NOT EXISTS cards (
  id           TEXT PRIMARY KEY,
  org_id       TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT DEFAULT '',
  output_qty   REAL DEFAULT 0,
  output_unit  TEXT DEFAULT 'порц',
  gross_weight REAL DEFAULT 0,
  net_weight   REAL DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
)`);

db.run(`CREATE TABLE IF NOT EXISTS steps (
  id        TEXT PRIMARY KEY,
  card_id   TEXT NOT NULL,
  idx       INTEGER NOT NULL DEFAULT 0,
  name      TEXT DEFAULT '',
  process   TEXT DEFAULT '',
  temp      TEXT DEFAULT '',
  time      TEXT DEFAULT '',
  pressure  TEXT DEFAULT '',
  note      TEXT DEFAULT ''
)`);

db.run(`CREATE TABLE IF NOT EXISTS ingredients (
  id      TEXT PRIMARY KEY,
  step_id TEXT NOT NULL,
  type    TEXT NOT NULL DEFAULT 'product',
  ref_id  TEXT DEFAULT '',
  qty     REAL DEFAULT 0
)`);

db.run("CREATE INDEX IF NOT EXISTS idx_products_org ON products(org_id)");
db.run("CREATE INDEX IF NOT EXISTS idx_cards_org ON cards(org_id)");
db.run("CREATE INDEX IF NOT EXISTS idx_folders_org ON folders(org_id)");
db.run("CREATE INDEX IF NOT EXISTS idx_steps_card ON steps(card_id)");
db.run("CREATE INDEX IF NOT EXISTS idx_ingredients_step ON ingredients(step_id)");
db.run("CREATE INDEX IF NOT EXISTS idx_users_tg ON users(tg_id)");
db.run("CREATE INDEX IF NOT EXISTS idx_users_org ON users(org_id)");

// migrate: add image column if missing
try { db.run("ALTER TABLE products ADD COLUMN image TEXT DEFAULT ''"); } catch(e) {}
// migrate: add org_id to products/cards/folders if missing (from old user_id schema)
try { db.run("ALTER TABLE products ADD COLUMN org_id TEXT DEFAULT ''"); } catch(e) {}
try { db.run("ALTER TABLE cards ADD COLUMN org_id TEXT DEFAULT ''"); } catch(e) {}
try { db.run("ALTER TABLE folders ADD COLUMN org_id TEXT DEFAULT ''"); } catch(e) {}
// migrate: add packaging price and nutrition columns
try { db.run("ALTER TABLE products ADD COLUMN pack_price REAL DEFAULT 0"); } catch(e) {}
try { db.run("ALTER TABLE products ADD COLUMN fats REAL DEFAULT 0"); } catch(e) {}
try { db.run("ALTER TABLE products ADD COLUMN proteins REAL DEFAULT 0"); } catch(e) {}
try { db.run("ALTER TABLE products ADD COLUMN carbs REAL DEFAULT 0"); } catch(e) {}
try { db.run("ALTER TABLE products ADD COLUMN calories REAL DEFAULT 0"); } catch(e) {}
try { db.run("ALTER TABLE products ADD COLUMN pack_qty REAL DEFAULT 0"); } catch(e) {}
try { db.run("ALTER TABLE users ADD COLUMN login TEXT"); } catch(e) {}
try { db.run("ALTER TABLE users ADD COLUMN password_hash TEXT DEFAULT ''"); } catch(e) {}
try { db.run("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT ''"); } catch(e) {}

db.run(`CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
)`);

function save() {
  const data = db.export();
  writeFileSync(dbPath, Buffer.from(data));
}

function queryAll(sql, params) {
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function run(sql, params) {
  db.run(sql, params);
  save();
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Users ──
export function getUser(tgId) {
  const rows = queryAll("SELECT * FROM users WHERE tg_id = ?", [String(tgId)]);
  if (!rows.length) return null;
  const u = rows[0];
  return {
    id: u.id, tgId: u.tg_id, orgId: u.org_id, name: u.name,
    age: u.age, city: u.city, position: u.position,
    workplace: u.workplace, purpose: u.purpose,
    role: u.role, theme: u.theme, registered: !!u.registered,
    login: u.login || "", avatar: u.avatar || "",
  };
}

export function registerUser(tgId, data) {
  const existing = getUser(tgId);
  if (existing) {
    var sql = "UPDATE users SET name=?, age=?, city=?, position=?, workplace=?, purpose=?, registered=1";
    var params = [data.name, +data.age || 0, data.city || "", data.position || "",
       data.workplace || "", data.purpose || ""];
    if (data.login) { sql += ", login=?"; params.push(data.login); }
    if (data.password) { sql += ", password_hash=?"; params.push(hashPassword(data.password)); }
    sql += " WHERE tg_id=?";
    params.push(String(tgId));
    run(sql, params);
    if (existing.orgId && data.workplace) {
      run("UPDATE organizations SET name=? WHERE id=?", [data.workplace, existing.orgId]);
    }
    return getUser(tgId);
  }

  const orgId = genId();
  const userId = genId();
  run("INSERT INTO organizations (id, name) VALUES (?,?)", [orgId, data.workplace || "Организация"]);
  run(`INSERT INTO users (id, tg_id, org_id, name, age, city, position, workplace, purpose, role, theme, registered, login, password_hash)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,1,?,?)`,
    [userId, String(tgId), orgId, data.name, +data.age || 0, data.city || "",
     data.position || "", data.workplace || "", data.purpose || "", "user", "dark",
     data.login || null, data.password ? hashPassword(data.password) : ""]);
  return getUser(tgId);
}

export function updateTheme(tgId, theme) {
  run("UPDATE users SET theme=? WHERE tg_id=?", [theme, String(tgId)]);
}

function hashPassword(pw) {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

export function loginUser(login, password) {
  var rows = queryAll("SELECT * FROM users WHERE login = ?", [login]);
  if (!rows.length) return null;
  if (rows[0].password_hash !== hashPassword(password)) return null;
  return getUser(rows[0].tg_id);
}

export function loginExists(login) {
  return queryAll("SELECT id FROM users WHERE login = ?", [login]).length > 0;
}

export function createSession(userId) {
  var token = crypto.randomBytes(32).toString("hex");
  run("INSERT INTO sessions (token, user_id) VALUES (?,?)", [token, userId]);
  return token;
}

export function getSessionUser(token) {
  if (!token) return null;
  var rows = queryAll("SELECT user_id FROM sessions WHERE token = ?", [token]);
  if (!rows.length) return null;
  var uRows = queryAll("SELECT tg_id FROM users WHERE id = ?", [rows[0].user_id]);
  if (!uRows.length) return null;
  return getUser(uRows[0].tg_id);
}

export function deleteSession(token) {
  run("DELETE FROM sessions WHERE token = ?", [token]);
}

export function updateUserProfile(tgId, data) {
  run("UPDATE users SET name=?, age=?, city=?, position=?, workplace=?, purpose=? WHERE tg_id=?",
    [data.name || "", +data.age || 0, data.city || "", data.position || "", data.workplace || "", data.purpose || "", String(tgId)]);
  if (data.workplace) {
    var u = getUser(tgId);
    if (u && u.orgId) run("UPDATE organizations SET name=? WHERE id=?", [data.workplace, u.orgId]);
  }
  return getUser(tgId);
}

export function changePassword(tgId, oldPassword, newPassword) {
  var rows = queryAll("SELECT password_hash FROM users WHERE tg_id = ?", [String(tgId)]);
  if (!rows.length) return { ok: false, error: "user_not_found" };
  if (rows[0].password_hash && rows[0].password_hash !== hashPassword(oldPassword)) return { ok: false, error: "wrong_password" };
  run("UPDATE users SET password_hash=? WHERE tg_id=?", [hashPassword(newPassword), String(tgId)]);
  return { ok: true };
}

export function changeLogin(tgId, newLogin) {
  var existing = queryAll("SELECT id FROM users WHERE login = ? AND tg_id != ?", [newLogin, String(tgId)]);
  if (existing.length) return { ok: false, error: "login_taken" };
  run("UPDATE users SET login=? WHERE tg_id=?", [newLogin, String(tgId)]);
  return { ok: true };
}

export function updateAvatar(tgId, avatar) {
  run("UPDATE users SET avatar=? WHERE tg_id=?", [avatar || "", String(tgId)]);
}

export function deleteOrgData(orgId) {
  var cards = queryAll("SELECT id FROM cards WHERE org_id = ?", [orgId]);
  cards.forEach(function(c) {
    var steps = queryAll("SELECT id FROM steps WHERE card_id = ?", [c.id]);
    steps.forEach(function(s) { db.run("DELETE FROM ingredients WHERE step_id = ?", [s.id]); });
    db.run("DELETE FROM steps WHERE card_id = ?", [c.id]);
  });
  db.run("DELETE FROM cards WHERE org_id = ?", [orgId]);
  db.run("DELETE FROM products WHERE org_id = ?", [orgId]);
  db.run("DELETE FROM folders WHERE org_id = ?", [orgId]);
  save();
}

export function deleteUserAccount(tgId) {
  var user = getUser(tgId);
  if (!user) return;
  run("DELETE FROM sessions WHERE user_id = ?", [user.id]);
  var otherUsers = queryAll("SELECT id FROM users WHERE org_id = ? AND tg_id != ?", [user.orgId, String(tgId)]);
  if (otherUsers.length === 0) {
    deleteOrgData(user.orgId);
    run("DELETE FROM organizations WHERE id = ?", [user.orgId]);
  }
  run("DELETE FROM users WHERE tg_id = ?", [String(tgId)]);
}

// ── Organizations ──
export function getOrg(orgId) {
  const rows = queryAll("SELECT * FROM organizations WHERE id = ?", [orgId]);
  return rows.length ? { id: rows[0].id, name: rows[0].name, createdAt: rows[0].created_at } : null;
}

// ── Admin functions ──
export function getAllOrgs() {
  return queryAll("SELECT * FROM organizations ORDER BY created_at DESC").map(o => ({
    id: o.id, name: o.name, createdAt: o.created_at,
    userCount: queryAll("SELECT COUNT(*) as c FROM users WHERE org_id = ?", [o.id])[0]?.c || 0,
    productCount: queryAll("SELECT COUNT(*) as c FROM products WHERE org_id = ?", [o.id])[0]?.c || 0,
    cardCount: queryAll("SELECT COUNT(*) as c FROM cards WHERE org_id = ?", [o.id])[0]?.c || 0,
  }));
}

export function getAllUsers() {
  return queryAll("SELECT u.*, o.name as org_name FROM users u LEFT JOIN organizations o ON u.org_id = o.id ORDER BY u.created_at DESC")
    .map(u => ({
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
    products: queryAll("SELECT * FROM products WHERE org_id = ? ORDER BY name", [orgId])
      .map(r => ({
        id: r.id, name: r.name, nomType: r.nom_type, unit: r.unit,
        price: r.price, packaging: r.packaging, packPrice: r.pack_price || 0, packQty: r.pack_qty || 0,
        folderId: r.folder_id || null, description: r.description || "",
        fats: r.fats || 0, proteins: r.proteins || 0, carbs: r.carbs || 0, calories: r.calories || 0,
      })),
    cards: queryAll("SELECT * FROM cards WHERE org_id = ? ORDER BY name", [orgId])
      .map(c => ({
        id: c.id, name: c.name, description: c.description || "",
        outputQty: c.output_qty, outputUnit: c.output_unit,
        stepsCount: queryAll("SELECT COUNT(*) as c FROM steps WHERE card_id = ?", [c.id])[0]?.c || 0,
      })),
    folders: queryAll("SELECT * FROM folders WHERE org_id = ? ORDER BY name", [orgId])
      .map(f => ({ id: f.id, name: f.name })),
    users: queryAll("SELECT name, position, city FROM users WHERE org_id = ?", [orgId]),
  };
}

// ── Folders (org-scoped) ──
export function getFolders(orgId) {
  return queryAll("SELECT * FROM folders WHERE org_id = ? ORDER BY name", [orgId])
    .map(r => ({ id: r.id, name: r.name, parentId: r.parent_id || null }));
}
export function upsertFolder(orgId, f) {
  const exists = queryAll("SELECT id FROM folders WHERE id = ?", [f.id]);
  if (exists.length > 0) {
    run("UPDATE folders SET name=?, parent_id=? WHERE id=?", [f.name, f.parentId || null, f.id]);
  } else {
    run("INSERT INTO folders (id, name, parent_id, org_id) VALUES (?,?,?,?)",
      [f.id, f.name, f.parentId || null, orgId]);
  }
}
export function deleteFolder(orgId, id) {
  run("DELETE FROM folders WHERE id = ? AND org_id = ?", [id, orgId]);
}

// ── Products (org-scoped) ──
export function getProducts(orgId) {
  return queryAll("SELECT * FROM products WHERE org_id = ? ORDER BY name", [orgId])
    .map(r => ({
      id: r.id, name: r.name, nomType: r.nom_type, unit: r.unit,
      price: r.price, packaging: r.packaging, packPrice: r.pack_price || 0, packQty: r.pack_qty || 0,
      folderId: r.folder_id || null,
      grossWeight: r.gross_weight, netWeight: r.net_weight,
      linkedCardId: r.linked_card_id, description: r.description,
      image: r.image || "",
      fats: r.fats || 0, proteins: r.proteins || 0, carbs: r.carbs || 0, calories: r.calories || 0,
    }));
}
export function upsertProduct(orgId, p) {
  const exists = queryAll("SELECT id FROM products WHERE id = ?", [p.id]);
  if (exists.length > 0) {
    run(`UPDATE products SET name=?, nom_type=?, unit=?, price=?, packaging=?, pack_price=?, pack_qty=?, folder_id=?,
      gross_weight=?, net_weight=?, linked_card_id=?, description=?, image=?,
      fats=?, proteins=?, carbs=?, calories=? WHERE id=?`,
      [p.name, p.nomType || "tovar", p.unit || "кг", +p.price || 0, p.packaging || "", +p.packPrice || 0, +p.packQty || 0,
       p.folderId || null, +p.grossWeight || 0, +p.netWeight || 0,
       p.linkedCardId || "", p.description || "", p.image || "",
       +p.fats || 0, +p.proteins || 0, +p.carbs || 0, +p.calories || 0, p.id]);
  } else {
    run(`INSERT INTO products (id, org_id, name, nom_type, unit, price, packaging, pack_price, pack_qty, folder_id, gross_weight, net_weight, linked_card_id, description, image, fats, proteins, carbs, calories)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [p.id, orgId, p.name, p.nomType || "tovar", p.unit || "кг", +p.price || 0,
       p.packaging || "", +p.packPrice || 0, +p.packQty || 0, p.folderId || null, +p.grossWeight || 0, +p.netWeight || 0,
       p.linkedCardId || "", p.description || "", p.image || "",
       +p.fats || 0, +p.proteins || 0, +p.carbs || 0, +p.calories || 0]);
  }
}
export function deleteProduct(orgId, id) {
  run("DELETE FROM products WHERE id = ? AND org_id = ?", [id, orgId]);
}

// ── Cards (org-scoped) ──
export function getCards(orgId) {
  const cards = queryAll("SELECT * FROM cards WHERE org_id = ? ORDER BY name", [orgId]);
  return cards.map(c => {
    const steps = queryAll("SELECT * FROM steps WHERE card_id = ? ORDER BY idx", [c.id]);
    return {
      id: c.id, name: c.name, description: c.description,
      outputQty: c.output_qty, outputUnit: c.output_unit,
      grossWeight: c.gross_weight, netWeight: c.net_weight,
      createdAt: c.created_at,
      steps: steps.map(s => ({
        id: s.id, name: s.name, process: s.process,
        params: { temp: s.temp, time: s.time, pressure: s.pressure, note: s.note },
        ingredients: queryAll("SELECT * FROM ingredients WHERE step_id = ?", [s.id])
          .map(i => ({ id: i.id, type: i.type, refId: i.ref_id, qty: i.qty })),
      })),
    };
  });
}

export function upsertCard(orgId, card) {
  const exists = queryAll("SELECT id FROM cards WHERE id = ?", [card.id]);
  if (exists.length > 0) {
    db.run("UPDATE cards SET name=?, description=?, output_qty=?, output_unit=?, gross_weight=?, net_weight=? WHERE id=?",
      [card.name, card.description || "", +card.outputQty || 0, card.outputUnit || "порц",
       +card.grossWeight || 0, +card.netWeight || 0, card.id]);
  } else {
    db.run("INSERT INTO cards (id, org_id, name, description, output_qty, output_unit, gross_weight, net_weight, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
      [card.id, orgId, card.name, card.description || "", +card.outputQty || 0,
       card.outputUnit || "порц", +card.grossWeight || 0, +card.netWeight || 0,
       card.createdAt || new Date().toISOString()]);
  }

  const oldSteps = queryAll("SELECT id FROM steps WHERE card_id = ?", [card.id]);
  oldSteps.forEach(s => db.run("DELETE FROM ingredients WHERE step_id = ?", [s.id]));
  db.run("DELETE FROM steps WHERE card_id = ?", [card.id]);

  (card.steps || []).forEach((s, idx) => {
    db.run("INSERT INTO steps (id, card_id, idx, name, process, temp, time, pressure, note) VALUES (?,?,?,?,?,?,?,?,?)",
      [s.id, card.id, idx, s.name || "", s.process || "",
       (s.params && s.params.temp) || "", (s.params && s.params.time) || "",
       (s.params && s.params.pressure) || "", (s.params && s.params.note) || ""]);

    (s.ingredients || []).forEach(i => {
      db.run("INSERT INTO ingredients (id, step_id, type, ref_id, qty) VALUES (?,?,?,?,?)",
        [i.id, s.id, i.type || "product", i.refId || "", +i.qty || 0]);
    });
  });

  save();
}

export function deleteCard(orgId, id) {
  const steps = queryAll("SELECT id FROM steps WHERE card_id = ?", [id]);
  steps.forEach(s => db.run("DELETE FROM ingredients WHERE step_id = ?", [s.id]));
  db.run("DELETE FROM steps WHERE card_id = ?", [id]);
  run("DELETE FROM cards WHERE id = ? AND org_id = ?", [id, orgId]);
}

export { uploadsDir };
export default db;
