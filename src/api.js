function getInitData() {
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      return window.Telegram.WebApp.initData || "";
    }
  } catch {}
  return "";
}

function getToken() {
  try { return localStorage.getItem("auth_token") || ""; } catch { return ""; }
}

function setToken(token) {
  try { if (token) localStorage.setItem("auth_token", token); else localStorage.removeItem("auth_token"); } catch {}
}

async function request(method, path, body) {
  const headers = { "Content-Type": "application/json" };
  const initData = getInitData();
  const token = getToken();

  if (initData) headers["X-Telegram-Init-Data"] = initData;
  else if (token) headers["Authorization"] = "Bearer " + token;
  else headers["X-Dev-User"] = "dev_user";

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error("API error " + res.status);
  return res.json();
}

export const api = {
  getProfile:   ()     => request("GET", "/api/auth/profile"),
  register:     (data) => request("POST", "/api/auth/register", data),
  setTheme:     (theme)=> request("POST", "/api/auth/theme", { theme }),

  login: async (login, password) => {
    const res = await request("POST", "/api/auth/login", { login, password });
    if (res.token) setToken(res.token);
    return res;
  },
  logout: async () => {
    await request("POST", "/api/auth/logout");
    setToken(null);
  },
  getToken,
  setToken,

  resetPassword:    (login, newPassword) => request("POST", "/api/auth/reset-password", { login, newPassword }),
  getAdminContact:  ()     => request("GET", "/api/auth/admin-contact"),
  updateProfile:    (data) => request("POST", "/api/auth/profile-update", data),
  changePassword:   (oldPassword, newPassword) => request("POST", "/api/auth/change-password", { oldPassword, newPassword }),
  changeLogin:      (login) => request("POST", "/api/auth/change-login", { login }),
  uploadAvatar:     (avatar) => request("POST", "/api/auth/avatar", { avatar }),
  deleteData:       ()     => request("DELETE", "/api/auth/data"),
  deleteAccount:    ()     => request("DELETE", "/api/auth/account"),

  getProducts:  ()     => request("GET", "/api/products"),
  saveProduct:  (p)    => request("POST", "/api/products", p),
  deleteProduct:(id)   => request("DELETE", "/api/products/" + id),

  getCards:     ()     => request("GET", "/api/cards"),
  saveCard:     (c)    => request("POST", "/api/cards", c),
  deleteCard:   (id)   => request("DELETE", "/api/cards/" + id),

  getFolders:   ()     => request("GET", "/api/folders"),
  saveFolder:   (f)    => request("POST", "/api/folders", f),
  deleteFolder: (id)   => request("DELETE", "/api/folders/" + id),

  uploadImage:  (data, filename) => request("POST", "/api/upload", { data, filename }),

  catalogProducts: ()     => request("GET", "/api/catalog/products"),
  catalogDishes:   ()     => request("GET", "/api/catalog/dishes"),
  importProducts:  (items)=> request("POST", "/api/catalog/import-products", { items }),
  importDish:      (dish) => request("POST", "/api/catalog/import-dish", { dish }),
  importExcel:     (rows) => request("POST", "/api/catalog/import-excel", { rows }),
  batchPrices:     (updates) => request("POST", "/api/catalog/batch-prices", { updates }),

  adminGetOrgs:  ()       => request("GET", "/api/admin/orgs"),
  adminGetUsers: ()       => request("GET", "/api/admin/users"),
  adminGetOrg:   (id)     => request("GET", "/api/admin/orgs/" + id),
  adminSetRole:  (tgId, role) => request("POST", "/api/admin/users/" + tgId + "/role", { role }),
};
