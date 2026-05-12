import { Router } from "express";
import { PRODUCT_CATALOG, DISH_CATALOG } from "../catalog.js";
import { getProducts, upsertProduct, getFolders, upsertFolder, getCards, upsertCard } from "../db.js";

const router = Router();

function genId() { return Math.random().toString(36).slice(2, 10); }

// Get available catalog
router.get("/products", (req, res) => {
  res.json(PRODUCT_CATALOG);
});

router.get("/dishes", (req, res) => {
  res.json(DISH_CATALOG);
});

// Import products from catalog
router.post("/import-products", (req, res) => {
  const orgId = req.orgId;
  if (!orgId) return res.status(403).json({ error: "Not registered" });

  const { items } = req.body; // array of product names to import
  if (!items || !items.length) return res.status(400).json({ error: "No items" });

  const existingFolders = getFolders(orgId);
  const existingProducts = getProducts(orgId);
  const folderMap = {};

  // Create folders as needed
  existingFolders.forEach(f => { folderMap[f.name] = f.id; });

  let imported = 0;
  items.forEach(item => {
    // Skip if product with same name already exists
    if (existingProducts.some(p => p.name === item.name)) return;

    // Create folder if needed
    let folderId = null;
    if (item.folder) {
      if (!folderMap[item.folder]) {
        const fid = genId();
        upsertFolder(orgId, { id: fid, name: item.folder, parentId: null });
        folderMap[item.folder] = fid;
      }
      folderId = folderMap[item.folder];
    }

    upsertProduct(orgId, {
      id: genId(),
      name: item.name,
      nomType: item.nomType || "tovar",
      unit: item.unit || "кг",
      price: item.price || 0,
      packaging: item.packaging || "",
      folderId: folderId,
      grossWeight: 0,
      netWeight: 0,
      linkedCardId: "",
      description: "",
      image: "",
    });
    imported++;
  });

  res.json({ ok: true, imported });
});

// Import dish as tech card
router.post("/import-dish", (req, res) => {
  const orgId = req.orgId;
  if (!orgId) return res.status(403).json({ error: "Not registered" });

  const { dish } = req.body;
  if (!dish) return res.status(400).json({ error: "No dish" });

  const products = getProducts(orgId);
  const existingCards = getCards(orgId);

  // Skip if card with same name already exists
  if (existingCards.some(c => c.name === dish.name)) {
    return res.json({ ok: false, error: "already_exists" });
  }

  const steps = (dish.steps || []).map((s, idx) => {
    const ingredients = (s.ings || []).map(ingName => {
      const prod = products.find(p => p.name === ingName);
      return {
        id: genId(),
        type: "product",
        refId: prod ? prod.id : "",
        qty: 0,
      };
    }).filter(i => i.refId);

    return {
      id: genId(),
      name: s.name || "",
      process: s.process || "",
      params: {
        temp: (s.params && s.params.temp) || "",
        time: (s.params && s.params.time) || "",
        pressure: (s.params && s.params.pressure) || "",
        note: (s.params && s.params.note) || "",
      },
      ingredients,
    };
  });

  const card = {
    id: genId(),
    name: dish.name,
    description: dish.category || "",
    outputQty: dish.outputQty || 1,
    outputUnit: dish.outputUnit || "порц",
    grossWeight: 0,
    netWeight: 0,
    steps,
    createdAt: new Date().toISOString(),
  };

  upsertCard(orgId, card);
  res.json({ ok: true, cardId: card.id });
});

// Import from Excel data (parsed on frontend)
router.post("/import-excel", (req, res) => {
  const orgId = req.orgId;
  if (!orgId) return res.status(403).json({ error: "Not registered" });

  const { rows } = req.body; // [{name, unit, price, folder, nomType}]
  if (!rows || !rows.length) return res.status(400).json({ error: "No rows" });

  const existingFolders = getFolders(orgId);
  const existingProducts = getProducts(orgId);
  const folderMap = {};
  existingFolders.forEach(f => { folderMap[f.name] = f.id; });

  let imported = 0, skipped = 0;
  rows.forEach(row => {
    if (!row.name || !row.name.trim()) return;
    if (existingProducts.some(p => p.name === row.name.trim())) { skipped++; return; }

    let folderId = null;
    if (row.folder && row.folder.trim()) {
      const fn = row.folder.trim();
      if (!folderMap[fn]) {
        const fid = genId();
        upsertFolder(orgId, { id: fid, name: fn, parentId: null });
        folderMap[fn] = fid;
      }
      folderId = folderMap[fn];
    }

    upsertProduct(orgId, {
      id: genId(),
      name: row.name.trim(),
      nomType: row.nomType || "tovar",
      unit: row.unit || "кг",
      price: +row.price || 0,
      packaging: row.packaging || "",
      packPrice: +row.packPrice || 0,
      folderId,
      grossWeight: 0, netWeight: 0,
      linkedCardId: "", description: "", image: "",
      fats: +row.fats || 0, proteins: +row.proteins || 0,
      carbs: +row.carbs || 0, calories: +row.calories || 0,
    });
    imported++;
  });

  res.json({ ok: true, imported, skipped });
});

// Batch update prices
router.post("/batch-prices", (req, res) => {
  const orgId = req.orgId;
  if (!orgId) return res.status(403).json({ error: "Not registered" });

  const { updates } = req.body; // [{id, price, packPrice}]
  if (!updates || !updates.length) return res.status(400).json({ error: "No updates" });

  const products = getProducts(orgId);
  let updated = 0;
  updates.forEach(u => {
    const prod = products.find(p => p.id === u.id);
    if (prod) {
      const upd = { price: +u.price || 0 };
      if (u.packPrice !== undefined) upd.packPrice = +u.packPrice || 0;
      upsertProduct(orgId, Object.assign({}, prod, upd));
      updated++;
    }
  });

  res.json({ ok: true, updated });
});

export default router;
