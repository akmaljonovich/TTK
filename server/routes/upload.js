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
  const ext = (filename.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const allowed = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  if (!allowed.includes(ext)) {
    return res.status(400).json({ error: "File type not allowed" });
  }
  const base64 = data.replace(/^data:[^;]+;base64,/, "");
  const buf = Buffer.from(base64, "base64");
  if (buf.length > 5 * 1024 * 1024) {
    return res.status(400).json({ error: "File too large (max 5MB)" });
  }
  const name = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  writeFileSync(join(uploadsDir, name), buf);
  res.json({ url: `/api/uploads/${name}` });
});

export default router;
