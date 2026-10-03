import { translateError } from "./i18n";

const TOKEN_KEY = "geberewu_token";
const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export function assetUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = "GET", body, isForm } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (!isForm) headers["Content-Type"] = "application/json";
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: isForm ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = data.error || "Request failed";
    const err = new Error(translateError(localStorage.getItem("geberewu_lang"), message));
    err.code = data.code;
    err.extra = data;
    throw err;
  }
  return data;
}
