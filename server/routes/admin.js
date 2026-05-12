import { Router } from "express";
import { getAllOrgs, getAllUsers, setUserRole, getOrgData } from "../db.js";

const router = Router();

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
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
  setUserRole(req.params.tgId, role);
  res.json({ ok: true });
});

export default router;
