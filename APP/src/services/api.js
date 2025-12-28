// src/services/api.js
// 後端 API 連線設定（HTTP）
//
// ✅ 最重要：API_BASE_URL 請指到「後端 /api」前綴
//   - 真機（手機）請填你電腦的「區網 IP」：例如 http://192.168.0.193:3000/api
//   - Android 模擬器：     http://10.0.2.2:3000/api   （連到電腦）
//   - iOS 模擬器：         http://localhost:3000/api
//
// 你也可以用環境變數覆蓋：EXPO_PUBLIC_API_BASE_URL


import { Platform } from 'react-native';

function defaultBaseUrl() {
  // 預設值：沿用你原本的區網 IP（你可以改成自己的）
  const LAN_IP = '192.168.20.104';
  const port = 3000;

  // 如果你在跑模擬器，這兩個會比較常用
  const emulatorHost = Platform.select({
    android: '10.0.2.2',
    ios: 'localhost',
    default: 'localhost',
  });

  // 你想優先走模擬器就把 PREFER_EMULATOR 改成 true
  const PREFER_EMULATOR = false;
  const host = PREFER_EMULATOR ? emulatorHost : LAN_IP;

  return `http://${host}:${port}/api`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || defaultBaseUrl();

function joinUrl(base, path) {
  const b = String(base || '').replace(/\/+$/, '');
  const p = String(path || '').startsWith('/') ? String(path) : `/${path}`;
  return `${b}${p}`;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function parseMaybeJson(res) {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function apiGet(path) {
  const url = joinUrl(API_BASE_URL, path);
  const res = await fetchWithTimeout(url, { method: 'GET' });
  if (!res.ok) {
    const body = await parseMaybeJson(res);
    throw new Error(`GET ${path} failed: ${res.status} ${typeof body === 'string' ? body : JSON.stringify(body)}`);
  }
  return res.json();
}

export async function apiPost(path, body) {
  const url = joinUrl(API_BASE_URL, path);
  const res = await fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const bodyText = await parseMaybeJson(res);
    throw new Error(`POST ${path} failed: ${res.status} ${typeof bodyText === 'string' ? bodyText : JSON.stringify(bodyText)}`);
  }
  // 有些端點可能回空字串，保險起見
  const out = await parseMaybeJson(res);
  return out;
}

export async function apiPut(path, body) {
  const url = joinUrl(API_BASE_URL, path);
  const res = await fetchWithTimeout(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const bodyText = await parseMaybeJson(res);
    throw new Error(`PUT ${path} failed: ${res.status} ${typeof bodyText === 'string' ? bodyText : JSON.stringify(bodyText)}`);
  }
  const out = await parseMaybeJson(res);
  return out;
}

// WebSocket 連接管理
export function createWebSocketConnection() {
  // 從 HTTP URL 轉換為 WebSocket URL
  const wsUrl = API_BASE_URL.replace(/^http/, 'ws').replace('/api', '');
  
  return new WebSocket(wsUrl);
}
