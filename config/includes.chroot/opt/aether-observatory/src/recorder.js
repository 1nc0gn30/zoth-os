// AETHER-OBSERVATORY — Flight Recorder: persistent SQLite ring-buffer of telemetry frames.

import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AETHER_DB || path.join(__dir, '..', 'data', 'aether-flight.db');
const MAX_ROWS = 8640; // 24h @ 10s cadence

let db = null;

export function openDb() {
  if (db) return db;
  db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      epoch INTEGER NOT NULL,
      ts TEXT NOT NULL,
      payload TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_snap_epoch ON snapshots(epoch DESC);
  `);
  return db;
}

export function insertSnapshot(payload) {
  const d = openDb();
  const stmt = d.prepare('INSERT INTO snapshots (epoch, ts, payload) VALUES (?, ?, ?)');
  stmt.run(payload.epoch, payload.ts, JSON.stringify(payload));
  // Ring-buffer trim (keep N newest)
  const cnt = d.prepare('SELECT COUNT(*) AS c FROM snapshots').get();
  if (cnt.c > MAX_ROWS) {
    d.prepare('DELETE FROM snapshots WHERE id < (SELECT MIN(id) FROM (SELECT id FROM snapshots ORDER BY id DESC LIMIT ?))')
      .run(MAX_ROWS);
  }
  return true;
}

export function listSnapshots(limit = 500) {
  const d = openDb();
  const rows = d.prepare('SELECT epoch, ts, payload FROM snapshots ORDER BY epoch DESC LIMIT ?').all(Math.min(limit, 2000));
  return rows.map(r => {
    let p; try { p = JSON.parse(r.payload); } catch { p = {}; }
    return {
      epoch: r.epoch, ts: r.ts, load1: p.load1, busyPct: p.busyPct,
      packageC: p.packageC, memUsedPct: p.memUsedPct, listeners: p.listeners,
      processes: p.processes, ports: p.ports
    };
  });
}

export function getSnapshot(epoch) {
  const d = openDb();
  // nearest match within 30s
  const row = d.prepare('SELECT * FROM snapshots ORDER BY ABS(epoch - ?) ASC LIMIT 1').get(epoch);
  if (!row || Math.abs(row.epoch - epoch) > 30000) return null;
  let p; try { p = JSON.parse(row.payload); } catch { return null; }
  return p;
}

export function rangeSnapshots(limit = 500) {
  const d = openDb();
  const newest = d.prepare('SELECT epoch FROM snapshots ORDER BY epoch DESC LIMIT 1').get();
  const oldest = d.prepare('SELECT epoch FROM snapshots ORDER BY epoch ASC LIMIT 1').get();
  const count = d.prepare('SELECT COUNT(*) AS c FROM snapshots').get();
  return {
    count: count?.c || 0,
    oldest: oldest?.epoch || null,
    newest: newest?.epoch || null,
    snapshots: listSnapshots(limit)
  };
}

// Diff two compact frames: spawned/terminated ports, thermal & load deltas
export function diffFrames(a, b) {
  if (!a || !b) return null;
  const pa = new Set(a.ports || []), pb = new Set(b.ports || []);
  return {
    t1: { ts: a.ts, epoch: a.epoch }, t2: { ts: b.ts, epoch: b.epoch },
    spawnedPorts: [...pb].filter(p => !pa.has(p)).sort((x, y) => x - y),
    terminatedPorts: [...pa].filter(p => !pb.has(p)).sort((x, y) => x - y),
    loadDelta: b.load1 != null && a.load1 != null ? +(b.load1 - a.load1).toFixed(2) : null,
    busyDeltaPct: b.busyPct != null && a.busyPct != null ? +(b.busyPct - a.busyPct).toFixed(1) : null,
    thermalDeltaC: b.packageC != null && a.packageC != null ? +(b.packageC - a.packageC).toFixed(1) : null,
    thermalSpike: (b.packageC != null && a.packageC != null && (b.packageC - a.packageC) >= 8),
    memDeltaPct: b.memUsedPct != null && a.memUsedPct != null ? +(b.memUsedPct - a.memUsedPct).toFixed(1) : null,
    processDelta: b.processes != null && a.processes != null ? b.processes - a.processes : null
  };
}

export { DB_PATH };
