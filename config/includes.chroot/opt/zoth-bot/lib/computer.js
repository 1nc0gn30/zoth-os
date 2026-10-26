'use strict';

const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { shell } = require('electron');
const store = require('./store');

const WORKSPACE = path.join(store.ROOT, 'workspace');
const MAX_FILE = 200 * 1024;

function ensureWorkspace() {
  fs.mkdirSync(WORKSPACE, { recursive: true });
  const readme = path.join(WORKSPACE, 'README.md');
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(
      readme,
      '# Zoth pocket computer\n\nThis folder is the laptop-side computer for Zoth Bot.\nHermes Agent and local tools work here by default.\n'
    );
  }
  return WORKSPACE;
}

function resolveInWorkspace(rel) {
  ensureWorkspace();
  const raw = String(rel || '.').trim() || '.';
  const abs = path.resolve(WORKSPACE, raw);
  const root = path.resolve(WORKSPACE);
  if (abs !== root && !abs.startsWith(root + path.sep)) {
    throw new Error('path stays inside the pocket workspace');
  }
  return abs;
}

function listDir(rel) {
  const abs = resolveInWorkspace(rel);
  const names = fs.readdirSync(abs);
  return names
    .map((name) => {
      const p = path.join(abs, name);
      let kind = 'file';
      try {
        kind = fs.statSync(p).isDirectory() ? 'dir' : 'file';
      } catch {
        kind = 'file';
      }
      return `${kind === 'dir' ? 'd' : 'f'} ${name}`;
    })
    .join('\n') || '(empty)';
}

function readFile(rel) {
  const abs = resolveInWorkspace(rel);
  const st = fs.statSync(abs);
  if (st.size > MAX_FILE) throw new Error('file too large for pocket read');
  return fs.readFileSync(abs, 'utf8').slice(0, MAX_FILE);
}

function writeFile(rel, content) {
  const abs = resolveInWorkspace(rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, String(content ?? ''), { mode: 0o600 });
  return 'wrote ' + path.relative(WORKSPACE, abs);
}

function fetchUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('bad url');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('only http(s)');
  }
  const lib = parsed.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.request(
      parsed,
      { method: 'GET', timeout: 12000, headers: { 'User-Agent': 'ZothBot/0.2' } },
      (res) => {
        const chunks = [];
        let n = 0;
        res.on('data', (c) => {
          n += c.length;
          if (n > MAX_FILE) {
            req.destroy();
            reject(new Error('response too large'));
            return;
          }
          chunks.push(c);
        });
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve(`HTTP ${res.statusCode}\n${body.slice(0, 8000)}`);
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('fetch timeout'));
    });
    req.end();
  });
}

function openPath(target) {
  const t = String(target || '').trim();
  if (/^https?:\/\//i.test(t)) {
    const u = new URL(t);
    if (u.hostname !== '127.0.0.1' && u.hostname !== 'localhost') {
      throw new Error('only localhost urls without approval');
    }
    return shell.openExternal(u.toString());
  }
  const abs = resolveInWorkspace(t);
  return shell.openPath(abs);
}

function which(bin) {
  const name = String(bin || '').trim();
  if (!name || name.includes('/') || name.includes('..')) return null;
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    const p = path.join(dir, name);
    try {
      if (fs.existsSync(p) && fs.statSync(p).isFile()) return p;
    } catch {
      /* skip */
    }
  }
  return null;
}

function runInWorkspace(cmd) {
  const trimmed = String(cmd || '').trim();
  if (!trimmed || trimmed.length > 400) throw new Error('command empty or too long');
  if (/[;&|`$<>\n]/.test(trimmed)) throw new Error('refusing a shell metacharacter');
  const parts = trimmed.split(/\s+/);
  const resolved = which(parts[0]) || parts[0];
  return new Promise((resolve, reject) => {
    execFile(
      resolved,
      parts.slice(1),
      {
        cwd: ensureWorkspace(),
        timeout: 20000,
        maxBuffer: 128 * 1024,
        env: { ...process.env, HOME: os.homedir() },
      },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error((stderr || err.message || 'failed').slice(0, 1200)));
          return;
        }
        resolve((stdout || '').slice(0, 8000) || '(no output)');
      }
    );
  });
}

module.exports = {
  WORKSPACE,
  ensureWorkspace,
  resolveInWorkspace,
  listDir,
  readFile,
  writeFile,
  fetchUrl,
  openPath,
  runInWorkspace,
};
