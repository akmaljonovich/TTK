import { Router } from "express";
import { getFolders, upsertFolder, deleteFolder } from "../db.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getFolders(req.orgId));
});

router.post("/", (req, res) => {
  upsertFolder(req.orgId, req.body);
  res.json({ ok: true });
});

router.delete("/:id", (req, res) => {
  deleteFolder(req.orgId, req.params.id);
  res.json({ ok: true });
});

export default router;
