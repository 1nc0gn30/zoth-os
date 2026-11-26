// AETHER-OBSERVATORY — Flight Recorder: persistent SQLite ring-buffer of telemetry frames.

import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.AETHER_DB || path.join(__dir, '..', 'data', 'aether-flight.db');
const MAX_ROWS = 8640; // 24h @ 10s cadence

let db = null;

export function openDb() {
  if (db) return db;
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
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

export function countSnapshots() {
  const d = openDb();
  const row = d.prepare('SELECT COUNT(*) AS c FROM snapshots').get();
  return row?.c || 0;
}

export function insertSnapshot(payload) {
  const d = openDb();
  const stmt = d.prepare('INSERT INTO snapshots (epoch, ts, payload) VALUES (?, ?, ?)');
  stmt.run(payload.epoch, payload.ts, JSON.stringify(payload));
  const cnt = d.prepare('SELECT COUNT(*) AS c FROM snapshots').get();
  if (cnt.c > MAX_ROWS) {
    d.prepare('DELETE FROM snapshots WHERE id < (SELECT MIN(id) FROM (SELECT id FROM snapshots ORDER BY id DESC LIMIT ?))')
      .run(MAX_ROWS);
  }
  return true;
}

export function listSnapshots(limit = 500) {
  const d = openDb();
  const safeLimit = Number.isInteger(limit) && limit >= 1 ? Math.min(limit, 2000) : 500;
  const rows = d.prepare('SELECT id, epoch, ts, payload FROM snapshots ORDER BY epoch DESC LIMIT ?').all(safeLimit);
  return rows.map(r => {
    let p;
    try { p = JSON.parse(r.payload); } catch { p = {}; }
    return {
      id: r.id,
      epoch: r.epoch,
      ts: r.ts,
      load1: p.load1,
      busyPct: p.busyPct,
      packageC: p.packageC,
      maxZoneC: p.maxZoneC ?? null,
      memUsedPct: p.memUsedPct,
      listeners: p.listeners,
      processes: p.processes,
      ports: p.ports,
    };
  });
}

export function getSnapshot(epoch) {
  const d = openDb();
  const row = d.prepare('SELECT * FROM snapshots ORDER BY ABS(epoch - ?) ASC LIMIT 1').get(epoch);
  if (!row || Math.abs(row.epoch - epoch) > 30000) return null;
  let p;
  try { p = JSON.parse(row.payload); } catch { return null; }
  return p;
}

export function rangeSnapshots(limit = 500) {
  const d = openDb();
  const newest = d.prepare('SELECT epoch FROM snapshots ORDER BY epoch DESC LIMIT 1').get();
  const oldest = d.prepare('SELECT epoch FROM snapshots ORDER BY epoch ASC LIMIT 1').get();
  const count = countSnapshots();
  return {
    count,
    oldest: oldest?.epoch || null,
    newest: newest?.epoch || null,
    snapshots: listSnapshots(limit),
  };
}

// Diff two compact frames: spawned/terminated ports, thermal, load, memory & process deltas
export function diffFrames(a, b) {
  if (!a || !b) return null;
  const pa = new Set(a.ports || []);
  const pb = new Set(b.ports || []);
  const windowSec = Math.round(Math.abs((b.epoch || 0) - (a.epoch || 0)) / 1000);
  const thermalDeltaC = b.packageC != null && a.packageC != null ? +(b.packageC - a.packageC).toFixed(1) : null;
  return {
    t1: { ts: a.ts, epoch: a.epoch },
    t2: { ts: b.ts, epoch: b.epoch },
    windowSec,
    spawnedPorts: [...pb].filter(p => !pa.has(p)).sort((x, y) => x - y),
    terminatedPorts: [...pa].filter(p => !pb.has(p)).sort((x, y) => x - y),
    loadDelta: b.load1 != null && a.load1 != null ? +(b.load1 - a.load1).toFixed(2) : null,
    busyDeltaPct: b.busyPct != null && a.busyPct != null ? +(b.busyPct - a.busyPct).toFixed(1) : null,
    thermalDeltaC,
    thermalSpike: thermalDeltaC != null && thermalDeltaC >= 8,
    memDeltaPct: b.memUsedPct != null && a.memUsedPct != null ? +(b.memUsedPct - a.memUsedPct).toFixed(1) : null,
    listenersDelta: b.listeners != null && a.listeners != null ? b.listeners - a.listeners : null,
    processDelta: b.processes != null && a.processes != null ? b.processes - a.processes : null,
  };
}

export function formatDiffMarkdown(diff, meta = {}) {
  const lines = [
    '# Aether Observatory — Flight Recorder Incident Diff',
    '',
    `- Exported: ${new Date().toISOString()}`,
    `- Service: aether-observatory v${meta.version || '2.0.0'}`,
    `- Window: ${diff.t1?.ts || '—'} → ${diff.t2?.ts || '—'} (${diff.windowSec ?? 0}s)`,
    `- Total Stored Snapshots: ${meta.totalCount ?? '—'}`,
    '',
    '## Telemetry Deltas',
    '',
    '| Metric | Delta |',
    '| :--- | :--- |',
    `| CPU Load (1m) | ${diff.loadDelta != null ? (diff.loadDelta >= 0 ? '+' : '') + diff.loadDelta : '—'} |`,
    `| CPU Busy | ${diff.busyDeltaPct != null ? (diff.busyDeltaPct >= 0 ? '+' : '') + diff.busyDeltaPct + '%' : '—'} |`,
    `| Package Thermal | ${diff.thermalDeltaC != null ? (diff.thermalDeltaC >= 0 ? '+' : '') + diff.thermalDeltaC + '°C' : '—'}${diff.thermalSpike ? ' (SPIKE)' : ''} |`,
    `| Memory Used | ${diff.memDeltaPct != null ? (diff.memDeltaPct >= 0 ? '+' : '') + diff.memDeltaPct + '%' : '—'} |`,
    `| Listening Sockets | ${diff.listenersDelta != null ? (diff.listenersDelta >= 0 ? '+' : '') + diff.listenersDelta : '—'} |`,
    `| Process Count | ${diff.processDelta != null ? (diff.processDelta >= 0 ? '+' : '') + diff.processDelta : '—'} |`,
    '',
    '## Port Changes',
    '',
    `- **Spawned ports:** ${diff.spawnedPorts?.length ? diff.spawnedPorts.map(p => ':' + p).join(', ') : 'none'}`,
    `- **Terminated ports:** ${diff.terminatedPorts?.length ? diff.terminatedPorts.map(p => ':' + p).join(', ') : 'none'}`,
    '',
  ];
  return lines.join('\n');
}

export { DB_PATH, MAX_ROWS };
