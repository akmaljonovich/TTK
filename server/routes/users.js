import { Router } from "express";
import { getUser, getAdminContact, registerUser, updateTheme, loginUser, loginExists, createSession, deleteSession, updateUserProfile, changePassword, resetPassword, changeLogin, updateAvatar, deleteOrgData, deleteUserAccount, linkTelegramId } from "../db.js";

const router = Router();

router.get("/profile", (req, res, next) => {
  try {
    if (!req.tgId) {
      if (req.user) return res.json({ registered: true, ...req.user });
      return res.json({ registered: false });
    }
    const user = req.user || getUser(req.tgId);
    if (!user) return res.json({ registered: false });
    const authHeader = req.headers["authorization"] || "";
    if (authHeader.startsWith("Bearer ")) {
      return res.json({ registered: true, ...user });
    }
    const token = createSession(user.id);
    res.json({ registered: true, ...user, token });
  } catch (e) { next(e); }
});

router.post("/register", (req, res, next) => {
  try {
    let tgId = req.tgId;
    if (!tgId) {
      if (!req.body.login || !req.body.password) {
        return res.status(400).json({ error: "Login and password required" });
      }
      if (req.body.password.length < 4) {
        return res.status(400).json({ error: "Password too short (min 4)" });
      }
      if (loginExists(req.body.login)) {
        return res.status(400).json({ error: "Login already taken" });
      }
      tgId = "web_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    }
    const user = registerUser(tgId, req.body);
    if (user) {
      const token = createSession(user.id);
      return res.json({ ...user, token });
    }
    res.status(500).json({ error: "Registration failed" });
  } catch (e) { next(e); }
});

router.get("/admin-contact", (req, res, next) => {
  try {
    const admin = getAdminContact();
    if (!admin) return res.json({ name: "Admin", tgId: "" });
    res.json(admin);
  } catch (e) { next(e); }
});

router.post("/theme", (req, res, next) => {
  try {
    const { theme } = req.body;
    if (!theme || !["dark", "light"].includes(theme)) {
      return res.status(400).json({ error: "Invalid theme" });
    }
    updateTheme(req.tgId, theme);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post("/login", (req, res, next) => {
  try {
    const { login, password } = req.body;
    if (!login || !password) return res.status(400).json({ error: "Missing credentials" });

    let user = loginUser(login, password);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    if (req.tgId && req.tgId !== user.tgId && !req.tgId.startsWith("web_")) {
      linkTelegramId(user.tgId, req.tgId);
      user = getUser(req.tgId);
    }

    const token = createSession(user.id);
    res.json({ ok: true, token, user });
  } catch (e) { next(e); }
});

router.post("/reset-password", (req, res, next) => {
  try {
    const { login, newPassword } = req.body;
    if (!login || !newPassword) return res.status(400).json({ error: "Missing data" });
    if (newPassword.length < 4) return res.status(400).json({ error: "Password too short" });
    // Only global admin can reset any password; user can reset their own
    if (req.user && (req.user.globalRole === "admin" || req.user.login === login)) {
      const result = resetPassword(login, newPassword);
      if (!result.ok) return res.status(404).json({ error: result.error });
      return res.json({ ok: true });
    }
    return res.status(403).json({ error: "Not authorized" });
  } catch (e) { next(e); }
});

router.post("/logout", (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"] || "";
    if (authHeader.startsWith("Bearer ")) {
      deleteSession(authHeader.slice(7));
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post("/profile-update", (req, res, next) => {
  try {
    if (!req.tgId) return res.status(401).json({ error: "Unauthorized" });
    const user = updateUserProfile(req.tgId, req.body);
    res.json(user);
  } catch (e) { next(e); }
});

router.post("/change-password", (req, res, next) => {
  try {
    if (!req.tgId) return res.status(401).json({ error: "Unauthorized" });
    const { oldPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 4) return res.status(400).json({ error: "Password too short" });
    const result = changePassword(req.tgId, oldPassword || "", newPassword);
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post("/change-login", (req, res, next) => {
  try {
    if (!req.tgId) return res.status(401).json({ error: "Unauthorized" });
    const { login } = req.body;
    if (!login || login.trim().length < 3) return res.status(400).json({ error: "Login too short" });
    const result = changeLogin(req.tgId, login.trim());
    if (!result.ok) return res.status(400).json({ error: result.error });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post("/avatar", (req, res, next) => {
  try {
    if (!req.tgId) return res.status(401).json({ error: "Unauthorized" });
    const { avatar } = req.body;
    updateAvatar(req.tgId, avatar || "");
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/data", (req, res, next) => {
  try {
    if (!req.orgId) return res.status(403).json({ error: "Not registered" });
    deleteOrgData(req.orgId);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.delete("/account", (req, res, next) => {
  try {
    if (!req.tgId) return res.status(401).json({ error: "Unauthorized" });
    deleteUserAccount(req.tgId);
    const authHeader = req.headers["authorization"] || "";
    if (authHeader.startsWith("Bearer ")) deleteSession(authHeader.slice(7));
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
