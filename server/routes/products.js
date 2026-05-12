import { Router } from "express";
import { getProducts, upsertProduct, deleteProduct } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getProducts(req.orgId));
});

router.post("/", (req, res) => {
  upsertProduct(req.orgId, req.body);
  res.json({ ok: true });
});

router.delete("/:id", (req, res) => {
  deleteProduct(req.orgId, req.params.id);
  res.json({ ok: true });
});

export default router;
