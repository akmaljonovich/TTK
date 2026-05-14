import { Router } from "express";
import { getCards, upsertCard, deleteCard } from "../db.js";

const router = Router();

router.get("/", (req, res, next) => {
  try { res.json(getCards(req.orgId)); }
  catch (e) { next(e); }
});

router.post("/", (req, res, next) => {
  try {
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ error: "Card name required" });
    }
    if (!req.body.id) return res.status(400).json({ error: "ID required" });
    upsertCard(req.orgId, req.body);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/:id", (req, res, next) => {
  try {
    deleteCard(req.orgId, req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
