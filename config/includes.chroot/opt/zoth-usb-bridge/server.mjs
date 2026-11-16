#!/usr/bin/env node
/**
 * Zoth USB & Developer-Mode Bridge Server (127.0.0.1:8153)
 * Zero external npm dependencies — uses native Node http, fs, path, child_process.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.join(__dirname, 'public');

const HOST = '127.0.0.1';
const PORT = parseInt(process.env.PORT || '8153', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
};

async function runCmd(bin, args = [], timeout = 8000) {
  try {
    const { stdout, stderr } = await execFileAsync(bin, args, {
      timeout,
      maxBuffer: 8 * 1024 * 1024,
    });
    return { ok: true, stdout: stdout || '', stderr: stderr || '', code: 0 };
  } catch (err) {
    return {
      ok: false,
      stdout: err.stdout || '',
      stderr: err.stderr || err.message || 'Command failed',
      code: typeof err.code === 'number' ? err.code : 1,
    };
  }
}

async function binExists(name) {
  const res = await runCmd('which', [name], 2000);
  return res.ok && res.stdout.trim().length > 0;
}

function parseAdbDevices(raw) {
  const lines = raw.split(/\r?\n/).slice(1).map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const parts = line.split(/\s+/);
    const serial = parts[0];
    const state = parts[1] || 'unknown';
    const meta = {};
    for (const token of parts.slice(2)) {
      const idx = token.indexOf(':');
      if (idx > 0) meta[token.slice(0, idx)] = token.slice(idx + 1);
    }
    return {
      serial,
      state,
      transport: serial.includes(':') ? 'tcpip' : 'usb',
      product: meta.product || null,
      model: meta.model || null,
      device: meta.device || null,
      transport_id: meta.transport_id || null,
    };
  });
}

function parseLsusb(raw) {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^Bus\s+(\d+)\s+Device\s+(\d+):\s+ID\s+([0-9a-fA-F]{4}:[0-9a-fA-F]{4})\s*(.*)$/);
      if (!m) return { raw: line };
      const name = m[4] || 'USB Device';
      const lower = name.toLowerCase();
      const isMobile =
        lower.includes('google') ||
        lower.includes('pixel') ||
        lower.includes('samsung') ||
        lower.includes('oneplus') ||
        lower.includes('xiaomi') ||
        lower.includes('motorola') ||
        lower.includes('android') ||
        lower.includes('adb') ||
        lower.includes('mtp') ||
        lower.includes('apple') ||
        lower.includes('iphone');
      return {
        bus: m[1],
        device: m[2],
        vid_pid: m[3],
        name,
        likely_mobile: isMobile,
      };
    });
}

async function enrichDevice(dev) {
  if (dev.state !== 'device') return dev;
  const propsRes = await runCmd(
    'adb',
    [
      '-s',
      dev.serial,
      'shell',
      'getprop ro.product.manufacturer && getprop ro.product.model && getprop ro.build.version.release && getprop ro.build.version.sdk && getprop ro.product.cpu.abi',
    ],
    4000
  );
  if (propsRes.ok) {
    const [manufacturer, model, androidVersion, sdk, abi] = propsRes.stdout
      .split(/\r?\n/)
      .map((s) => s.trim());
    dev.manufacturer = manufacturer || null;
    dev.modelName = model || dev.model || null;
    dev.androidVersion = androidVersion || null;
    dev.sdk = sdk || null;
    dev.abi = abi || null;
  }
  const battRes = await runCmd('adb', ['-s', dev.serial, 'shell', 'dumpsys battery | grep -E "level:|status:"'], 3000);
  if (battRes.ok) {
    const levelMatch = battRes.stdout.match(/level:\s*(\d+)/);
    if (levelMatch) dev.battery = `${levelMatch[1]}%`;
  }
  return dev;
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(JSON.stringify(data, null, 2));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function validSerial(s) {
  return typeof s === 'string' && /^[a-zA-Z0-9._:\-]+$/.test(s);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
  const pathname = url.pathname;

  if (req.method === 'GET' && pathname === '/health') {
    const [adb, scrcpy, lsusb, fastboot] = await Promise.all([
      binExists('adb'),
      binExists('scrcpy'),
      binExists('lsusb'),
      binExists('fastboot'),
    ]);
    return sendJson(res, 200, {
      ok: true,
      service: 'zoth-usb-bridge',
      version: '1.0.0',
      port: PORT,
      tools: { adb, scrcpy, lsusb, fastboot },
    });
  }

  if (req.method === 'GET' && pathname === '/api/devices') {
    const [adbRes, lsusbRes] = await Promise.all([
      runCmd('adb', ['devices', '-l'], 5000),
      runCmd('lsusb', [], 4000),
    ]);
    const rawDevices = adbRes.ok ? parseAdbDevices(adbRes.stdout) : [];
    const adbDevices = await Promise.all(rawDevices.map(enrichDevice));
    const usbDevices = lsusbRes.ok ? parseLsusb(lsusbRes.stdout) : [];
    return sendJson(res, 200, {
      ok: true,
      timestamp: new Date().toISOString(),
      adb_available: adbRes.ok,
      adb_error: adbRes.ok ? null : adbRes.stderr,
      adb_devices: adbDevices,
      usb_devices: usbDevices,
    });
  }

  if (req.method === 'POST' && pathname === '/api/adb/pair') {
    try {
      const { endpoint, code } = await readBody(req);
      if (!validSerial(endpoint) || !/^\d{4,8}$/.test(String(code || '').trim())) {
        return sendJson(res, 400, { ok: false, error: 'Provide valid host:port and pairing code.' });
      }
      const r = await runCmd('adb', ['pair', endpoint.trim(), String(code).trim()], 10000);
      return sendJson(res, r.ok ? 200 : 400, r);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/adb/connect') {
    try {
      const { endpoint } = await readBody(req);
      if (!validSerial(endpoint)) {
        return sendJson(res, 400, { ok: false, error: 'Provide valid host:port endpoint.' });
      }
      const r = await runCmd('adb', ['connect', endpoint.trim()], 8000);
      return sendJson(res, r.ok ? 200 : 400, r);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/adb/disconnect') {
    try {
      const { endpoint } = await readBody(req);
      const args = endpoint && validSerial(endpoint) ? ['disconnect', endpoint.trim()] : ['disconnect'];
      const r = await runCmd('adb', args, 5000);
      return sendJson(res, 200, r);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/adb/tcpip') {
    try {
      const { serial, port = 5555 } = await readBody(req);
      if (!validSerial(serial)) return sendJson(res, 400, { ok: false, error: 'Valid device serial required.' });
      const tcpPort = Math.max(1024, Math.min(65535, parseInt(port, 10) || 5555));
      const ipRes = await runCmd('adb', ['-s', serial, 'shell', 'ip -f inet addr show wlan0 | grep inet'], 4000);
      const ipMatch = ipRes.stdout.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
      const r = await runCmd('adb', ['-s', serial, 'tcpip', String(tcpPort)], 6000);
      return sendJson(res, r.ok ? 200 : 400, {
        ...r,
        wifi_ip: ipMatch ? ipMatch[1] : null,
        suggested_connect: ipMatch ? `${ipMatch[1]}:${tcpPort}` : null,
      });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/adb/shell') {
    try {
      const { serial, command } = await readBody(req);
      if (!validSerial(serial)) return sendJson(res, 400, { ok: false, error: 'Valid device serial required.' });
      if (!command || typeof command !== 'string' || !command.trim()) {
        return sendJson(res, 400, { ok: false, error: 'Non-empty shell command required.' });
      }
      const r = await runCmd('adb', ['-s', serial, 'shell', command.trim()], 12000);
      return sendJson(res, 200, r);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/adb/reverse') {
    try {
      const { serial, remotePort = 3000, localPort = 3000 } = await readBody(req);
      if (!validSerial(serial)) return sendJson(res, 400, { ok: false, error: 'Valid device serial required.' });
      const rPort = parseInt(remotePort, 10) || 3000;
      const lPort = parseInt(localPort, 10) || 3000;
      const r = await runCmd('adb', ['-s', serial, 'reverse', `tcp:${rPort}`, `tcp:${lPort}`], 5000);
      return sendJson(res, r.ok ? 200 : 400, r);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/adb/packages') {
    try {
      const { serial } = await readBody(req);
      if (!validSerial(serial)) return sendJson(res, 400, { ok: false, error: 'Valid device serial required.' });
      const r = await runCmd('adb', ['-s', serial, 'shell', 'pm list packages -3'], 8000);
      const packages = r.ok
        ? r.stdout
            .split(/\r?\n/)
            .map((l) => l.replace(/^package:/, '').trim())
            .filter(Boolean)
            .sort()
        : [];
      return sendJson(res, r.ok ? 200 : 400, { ok: r.ok, packages, stderr: r.stderr });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/adb/logcat') {
    try {
      const { serial, lines = 80 } = await readBody(req);
      if (!validSerial(serial)) return sendJson(res, 400, { ok: false, error: 'Valid device serial required.' });
      const count = Math.max(10, Math.min(300, parseInt(lines, 10) || 80));
      const r = await runCmd('adb', ['-s', serial, 'logcat', '-d', '-t', String(count)], 8000);
      return sendJson(res, r.ok ? 200 : 400, r);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  if (req.method === 'POST' && pathname === '/api/adb/screenshot') {
    try {
      const { serial } = await readBody(req);
      if (!validSerial(serial)) return sendJson(res, 400, { ok: false, error: 'Valid device serial required.' });
      const { stdout } = await execFileAsync('adb', ['-s', serial, 'exec-out', 'screencap', '-p'], {
        encoding: 'buffer',
        timeout: 10000,
        maxBuffer: 16 * 1024 * 1024,
      });
      return sendJson(res, 200, {
        ok: true,
        dataUrl: `data:image/png;base64,${stdout.toString('base64')}`,
      });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message || 'Screenshot capture failed' });
    }
  }

  if (req.method === 'POST' && pathname === '/api/scrcpy/launch') {
    try {
      const { serial } = await readBody(req);
      if (!validSerial(serial)) return sendJson(res, 400, { ok: false, error: 'Valid device serial required.' });
      const hasScrcpy = await binExists('scrcpy');
      if (!hasScrcpy) return sendJson(res, 400, { ok: false, error: 'scrcpy binary not found on host.' });
      const child = spawn('scrcpy', ['-s', serial, '--window-title', `Zoth Bridge // ${serial}`], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return sendJson(res, 200, { ok: true, launched: true, pid: child.pid, serial });
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: e.message });
    }
  }

  // Static files
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const fullPath = path.resolve(PUBLIC_DIR, `.${safePath}`);
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    const ext = path.extname(fullPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`zoth-usb-bridge listening on http://${HOST}:${PORT}`);
});
