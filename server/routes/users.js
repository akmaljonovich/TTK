import { Router } from "express";
import { getUser, getAdminContact, registerUser, updateTheme, loginUser, loginExists, createSession, deleteSession, updateUserProfile, changePassword, resetPassword, changeLogin, updateAvatar, deleteOrgData, deleteUserAccount, linkTelegramId } from "../db.js";

const router = Router();

router.get("/profile", (req, res) => {
  if (!req.tgId) {
    // Bearer token already resolved user in middleware
    if (req.user) return res.json({ registered: true, ...req.user });
    return res.json({ registered: false });
  }
  const user = req.user || getUser(req.tgId);
  if (!user) return res.json({ registered: false });
  // Only create session if client doesn't already have one (no Bearer token)
  const authHeader = req.headers["authorization"] || "";
  if (authHeader.startsWith("Bearer ")) {
    return res.json({ registered: true, ...user });
  }
  const token = createSession(user.id);
  res.json({ registered: true, ...user, token });
});

router.post("/register", (req, res) => {
  let tgId = req.tgId;
  // If no Telegram auth, allow register with login/password (generate a unique ID)
  if (!tgId) {
    if (!req.body.login || !req.body.password) {
      return res.status(400).json({ error: "Login and password required" });
    }
    if (loginExists(req.body.login)) {
      return res.status(400).json({ error: "Login already taken" });
    }
    tgId = "web_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  }
  const user = registerUser(tgId, req.body);
  // Always create session token so user stays logged in
  if (user) {
    const token = createSession(user.id);
    return res.json({ ...user, token });
  }
  res.json(user);
});

router.get("/admin-contact", (req, res) => {
  const admin = getAdminContact();
  if (!admin) return res.json({ name: "Admin", tgId: "" });
  res.json(admin);
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

  let user = loginUser(login, password);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  // If user logged in from Telegram, link their Telegram ID to this account
  // This replaces web_* tgId with real Telegram numeric ID
  if (req.tgId && req.tgId !== user.tgId && !req.tgId.startsWith("web_")) {
    linkTelegramId(user.tgId, req.tgId);
    user = getUser(req.tgId); // refresh with new tgId
  }

  const token = createSession(user.id);
  res.json({ ok: true, token, user });
});

router.post("/reset-password", (req, res) => {
  const { login, newPassword } = req.body;
  if (!login || !newPassword) return res.status(400).json({ error: "Missing data" });
  if (newPassword.length < 4) return res.status(400).json({ error: "Password too short" });
  const result = resetPassword(login, newPassword);
  if (!result.ok) return res.status(404).json({ error: result.error });
  res.json({ ok: true });
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
