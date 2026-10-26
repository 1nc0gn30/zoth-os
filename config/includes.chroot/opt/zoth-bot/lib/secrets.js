'use strict';

// API keys: environment first, then the OS keyring via Electron safeStorage
// (libsecret / KWallet). Only ciphertext ever touches disk; never state.json.
const fs = require('fs');
const path = require('path');

function safeStorage() {
  try {
    const e = require('electron');
    return e && typeof e === 'object' && e.safeStorage ? e.safeStorage : null;
  } catch {
    return null;
  }
}

function vaultPath(root) {
  return path.join(root, 'keys.enc.json');
}

function readVault(root) {
  try {
    return JSON.parse(fs.readFileSync(vaultPath(root), 'utf8'));
  } catch {
    return {};
  }
}

function keyringAvailable() {
  const ss = safeStorage();
  try {
    return !!(ss && ss.isEncryptionAvailable());
  } catch {
    return false;
  }
}

function getKey(root, envNames, providerId, env = process.env) {
  for (const n of envNames || []) if (env[n]) return { value: env[n], source: 'env:' + n };
  const blob = readVault(root)[providerId];
  const ss = safeStorage();
  if (blob && ss && keyringAvailable()) {
    try {
      return { value: ss.decryptString(Buffer.from(blob, 'base64')), source: 'keyring' };
    } catch {
      /* unreadable */
    }
  }
  return { value: null, source: null };
}

function setKey(root, providerId, value) {
  const ss = safeStorage();
  if (!ss || !keyringAvailable()) throw new Error('OS keyring (libsecret/KWallet) unavailable; set the env var instead');
  const vault = readVault(root);
  if (value) vault[providerId] = ss.encryptString(String(value)).toString('base64');
  else delete vault[providerId];
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(vaultPath(root), JSON.stringify(vault, null, 2) + '\n', { mode: 0o600 });
  return true;
}

module.exports = { getKey, setKey, keyringAvailable };
