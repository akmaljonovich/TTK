import { Router } from "express";
import { getUserOrgs, createOrg, switchOrg, updateOrg, deleteOrg, getUser } from "../db.js";

const router = Router();

// List user's organizations
router.get("/", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const orgs = getUserOrgs(req.user.id);
  res.json(orgs);
});

// Create a new organization
router.post("/", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { name, type } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Name required" });
  const org = createOrg(req.user.id, name.trim(), type || "food");
  const user = getUser(req.tgId);
  res.json({ ok: true, org, user });
});

// Switch active organization
router.post("/switch", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { orgId } = req.body;
  if (!orgId) return res.status(400).json({ error: "orgId required" });
  const ok = switchOrg(req.user.id, orgId);
  if (!ok) return res.status(403).json({ error: "Not a member" });
  const user = getUser(req.tgId);
  res.json({ ok: true, user });
});

// Update org name/type
router.put("/:id", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { name, type } = req.body;
  updateOrg(req.params.id, name, type);
  res.json({ ok: true });
});

// Delete an organization
router.delete("/:id", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const ok = deleteOrg(req.user.id, req.params.id);
  if (!ok) return res.status(403).json({ error: "Not admin or not member" });
  const user = getUser(req.tgId);
  res.json({ ok: true, user });
});

export default router;
