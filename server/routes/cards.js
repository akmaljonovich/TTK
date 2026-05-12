import { Router } from "express";
import { getCards, upsertCard, deleteCard } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getCards(req.orgId));
});

router.post("/", (req, res) => {
  upsertCard(req.orgId, req.body);
  res.json({ ok: true });
});

router.delete("/:id", (req, res) => {
  deleteCard(req.orgId, req.params.id);
  res.json({ ok: true });
});

export default router;
