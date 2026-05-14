import { Router } from "express";
import { getProducts, upsertProduct, deleteProduct } from "../db.js";

const router = Router();

router.get("/", (req, res, next) => {
  try { res.json(getProducts(req.orgId)); }
  catch (e) { next(e); }
});

router.post("/", (req, res, next) => {
  try {
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ error: "Product name required" });
    }
    if (!req.body.id) return res.status(400).json({ error: "ID required" });
    upsertProduct(req.orgId, req.body);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/:id", (req, res, next) => {
  try {
    deleteProduct(req.orgId, req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
