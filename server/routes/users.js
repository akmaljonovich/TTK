import { Router } from "express";
import { getUser, registerUser, updateTheme, loginUser, loginExists, createSession, deleteSession, updateUserProfile, changePassword, changeLogin, updateAvatar, deleteOrgData, deleteUserAccount } from "../db.js";

const router = Router();

router.get("/profile", (req, res) => {
  const user = getUser(req.tgId);
  if (!user) return res.json({ registered: false });
  res.json({ registered: true, ...user });
});

router.post("/register", (req, res) => {
  const user = registerUser(req.tgId, req.body);
  res.json(user);
});

router.post("/theme", (req, res) => {
  const { theme } = req.body;
  if (!theme || !["dark", "light"].includes(theme)) {
    return res.status(400).json({ error: "Invalid theme" });
  }
  updateTheme(req.tgId, theme);
  res.json({ ok: true });
});

router.post("/login", (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) return res.status(400).json({ error: "Missing credentials" });

  const user = loginUser(login, password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const token = createSession(user.id);
  res.json({ ok: true, token, user });
});

router.post("/logout", (req, res) => {
  const authHeader = req.headers["authorization"] || "";
  if (authHeader.startsWith("Bearer ")) {
    deleteSession(authHeader.slice(7));
  }
  res.json({ ok: true });
});

router.post("/profile-update", (req, res) => {
  if (!req.tgId) return res.status(401).json({ error: "Unauthorized" });
  const user = updateUserProfile(req.tgId, req.body);
  res.json(user);
});

router.post("/change-password", (req, res) => {
  if (!req.tgId) return res.status(401).json({ error: "Unauthorized" });
  const { oldPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: "Password too short" });
  const result = changePassword(req.tgId, oldPassword || "", newPassword);
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ ok: true });
});

router.post("/change-login", (req, res) => {
  if (!req.tgId) return res.status(401).json({ error: "Unauthorized" });
  const { login } = req.body;
  if (!login || login.trim().length < 3) return res.status(400).json({ error: "Login too short" });
  const result = changeLogin(req.tgId, login.trim());
  if (!result.ok) return res.status(400).json({ error: result.error });
  res.json({ ok: true });
});

router.post("/avatar", (req, res) => {
  if (!req.tgId) return res.status(401).json({ error: "Unauthorized" });
  const { avatar } = req.body;
  updateAvatar(req.tgId, avatar || "");
  res.json({ ok: true });
});

router.delete("/data", (req, res) => {
  if (!req.orgId) return res.status(403).json({ error: "Not registered" });
  deleteOrgData(req.orgId);
  res.json({ ok: true });
});

router.delete("/account", (req, res) => {
  if (!req.tgId) return res.status(401).json({ error: "Unauthorized" });
  deleteUserAccount(req.tgId);
  const authHeader = req.headers["authorization"] || "";
  if (authHeader.startsWith("Bearer ")) deleteSession(authHeader.slice(7));
  res.json({ ok: true });
});

export default router;
