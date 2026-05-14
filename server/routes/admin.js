import { Router } from "express";
import { getAllOrgs, getAllUsers, setUserRole, getOrgData } from "../db.js";

const router = Router();

function requireAdmin(req, res, next) {
  // Check global role (users table), not org-level role (user_orgs)
  // Only the first registered user or manually promoted admins can access
  if (!req.user || req.user.globalRole !== "admin") {
    return res.status(403).json({ error: "Admin only" });
  }
  next();
}

router.use(requireAdmin);

router.get("/orgs", (req, res) => {
  res.json(getAllOrgs());
});

router.get("/users", (req, res) => {
  res.json(getAllUsers());
});

router.get("/orgs/:id", (req, res) => {
  res.json(getOrgData(req.params.id));
});

router.post("/users/:tgId/role", (req, res) => {
  const { role } = req.body;
  if (!["user", "technolog", "admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }
  setUserRole(req.params.tgId, role);
  res.json({ ok: true });
});

export default router;
