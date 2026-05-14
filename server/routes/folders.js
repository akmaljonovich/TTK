import { Router } from "express";
import { getFolders, upsertFolder, deleteFolder } from "../db.js";

const router = Router();

router.get("/", (req, res, next) => {
  try { res.json(getFolders(req.orgId)); }
  catch (e) { next(e); }
});

router.post("/", (req, res, next) => {
  try {
    if (!req.body.name || !req.body.name.trim()) {
      return res.status(400).json({ error: "Folder name required" });
    }
    if (!req.body.id) return res.status(400).json({ error: "ID required" });
    upsertFolder(req.orgId, req.body);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/:id", (req, res, next) => {
  try {
    deleteFolder(req.orgId, req.params.id);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
