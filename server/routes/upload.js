import { Router } from "express";
import { writeFileSync } from "fs";
import { join } from "path";
import { uploadsDir } from "../db.js";

const router = Router();

router.post("/", (req, res) => {
  if (!req.user || !req.user.registered) {
    return res.status(403).json({ error: "Not registered" });
  }
  const { data, filename } = req.body;
  if (!data || !filename) {
    return res.status(400).json({ error: "Missing data or filename" });
  }
  const ext = filename.split(".").pop() || "jpg";
  const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const base64 = data.replace(/^data:[^;]+;base64,/, "");
  writeFileSync(join(uploadsDir, name), Buffer.from(base64, "base64"));
  res.json({ url: `/api/uploads/${name}` });
});

export default router;
