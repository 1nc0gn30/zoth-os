'use strict';

// Portal access token: generated once, stored 0600 in the config root,
// required on every Portal HTTP/SSE/WebSocket request.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const COOKIE = 'zoth_portal';

function tokenPath(root) {
  return path.join(root, 'portal-token');
}

function loadOrCreateToken(root) {
  const file = tokenPath(root);
  try {
    const t = fs.readFileSync(file, 'utf8').trim();
    if (/^[A-Za-z0-9_-]{24,}$/.test(t)) return t;
  } catch {
    /* create below */
  }
  const t = crypto.randomBytes(24).toString('base64url');
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(file, t + '\n', { mode: 0o600 });
  return t;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  if (!x.length || x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

// Returns { ok, via } where via is 'query' | 'header' | 'cookie'.
function checkRequest(req, token) {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  if (safeEqual(url.searchParams.get('t'), token)) return { ok: true, via: 'query' };
  if (safeEqual(req.headers && req.headers['x-zoth-token'], token)) return { ok: true, via: 'header' };
  if (safeEqual(parseCookies(req.headers && req.headers.cookie)[COOKIE], token)) return { ok: true, via: 'cookie' };
  return { ok: false, via: null };
}

function cookieHeader(token) {
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`;
}

// Default bind: Tailscale IP if present, else loopback. ZOTH_PORTAL_HOST overrides.
function pickBindHost(addrs, env = process.env) {
  if (env.ZOTH_PORTAL_HOST) return env.ZOTH_PORTAL_HOST;
  return (addrs && addrs.tailscaleIp) || '127.0.0.1';
}

module.exports = { COOKIE, loadOrCreateToken, checkRequest, cookieHeader, pickBindHost, safeEqual, tokenPath };
