import { Router } from "express";
import { getUserOrgs, createOrg, switchOrg, updateOrg, deleteOrg, getUser } from "../db.js";

const router = Router();

// List user's organizations
router.get("/", (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const orgs = getUserOrgs(req.user.id);
    res.json(orgs);
  } catch (e) { next(e); }
});

// Create a new organization
router.post("/", (req, res, next) => { try {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { name, type } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "Name required" });
  if (name.trim().length > 100) return res.status(400).json({ error: "Name too long" });
  const orgs = getUserOrgs(req.user.id);
  if (orgs.length >= 10) return res.status(400).json({ error: "Max 10 organizations" });
  const org = createOrg(req.user.id, name.trim(), type || "food");
  const user = getUser(req.tgId);
  res.json({ ok: true, org, user });
} catch (e) { next(e); } });

// Switch active organization
router.post("/switch", (req, res, next) => { try {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { orgId } = req.body;
  if (!orgId) return res.status(400).json({ error: "orgId required" });
  const ok = switchOrg(req.user.id, orgId);
  if (!ok) return res.status(403).json({ error: "Not a member" });
  const user = getUser(req.tgId);
  res.json({ ok: true, user });
} catch (e) { next(e); } });

// Update org name/type — only admin of that org
router.put("/:id", (req, res, next) => { try {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const orgs = getUserOrgs(req.user.id);
  const membership = orgs.find(o => o.id === req.params.id);
  if (!membership || membership.role !== "admin") {
    return res.status(403).json({ error: "Only org admin can update" });
  }
  const { name, type } = req.body;
  if (name && name.trim().length > 100) return res.status(400).json({ error: "Name too long" });
  updateOrg(req.params.id, name ? name.trim() : null, type);
  res.json({ ok: true });
} catch (e) { next(e); } });

// Delete an organization
router.delete("/:id", (req, res, next) => { try {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const ok = deleteOrg(req.user.id, req.params.id);
  if (!ok) return res.status(403).json({ error: "Not admin or not member" });
  const user = getUser(req.tgId);
  res.json({ ok: true, user });
} catch (e) { next(e); } });

export default router;
