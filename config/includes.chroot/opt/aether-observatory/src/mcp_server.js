#!/usr/bin/env node
// AETHER-OBSERVATORY — Zero-dependency stdio JSON-RPC 2.0 MCP Server
// Exposes live Linux telemetry, 3D constellation socket inventory, flight recorder diffs, and snapshots.

import readline from 'node:readline';
import { liveFrame, compactFrame, readListenersAsync, zothRegistry, procUptime, procCmdline } from './telemetry.js';
import { insertSnapshot, listSnapshots, countSnapshots, getSnapshot, diffFrames } from './recorder.js';

const SERVER_INFO = { name: 'aether-observatory', version: '2.0.0' };
const PROTOCOL_VERSION = '2024-11-05';

const TOOLS = [
  {
    name: 'aether_observatory_telemetry',
    description: 'Read live machine telemetry, the port/process constellation, record a snapshot, or compute historical frame diffs as structured JSON.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['status', 'constellation', 'snapshot', 'diff'], description: 'Telemetry action to execute' },
        t1: { type: 'number', description: 'Epoch-ms lower bound for a diff' },
        t2: { type: 'number', description: 'Epoch-ms upper bound for a diff' },
      },
      required: ['action'],
    },
  },
  {
    name: 'aether_constellation_nodes',
    description: 'Return all currently listening TCP sockets joined with the Zoth Studio tool registry and redacted cmdlines.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'aether_timeline_diff',
    description: 'Diff two recorded SQLite telemetry snapshots by epoch-ms timestamps (t1, t2) to surface spawned/terminated ports and thermal/load deltas.',
    inputSchema: {
      type: 'object',
      properties: {
        t1: { type: 'number', description: 'Epoch-ms start timestamp' },
        t2: { type: 'number', description: 'Epoch-ms end timestamp' },
      },
      required: ['t1', 't2'],
    },
  },
  {
    name: 'aether_snapshot_now',
    description: 'Sample live host telemetry immediately and persist a compact frame into the SQLite flight recorder.',
    inputSchema: { type: 'object', properties: {} },
  },
];

async function buildNodes() {
  const listeners = await readListenersAsync();
  const registry = zothRegistry();
  const byPort = new Map(registry.map(t => [t.localPort, t]));
  return listeners.slice(0, 64).map(l => {
    const reg = byPort.get(l.port);
    return {
      port: l.port,
      proto: l.proto,
      addr: l.localAddr,
      pid: l.pid,
      processName: l.processName,
      name: reg ? reg.name : (l.processName ? `${l.processName} (system)` : `daemon :${l.port}`),
      category: reg ? reg.category : 'System',
      zothTool: !!reg,
      uptimeSec: procUptime(l.pid),
      cmdline: procCmdline(l.pid),
    };
  });
}

async function runDiff(t1, t2) {
  let a = t1 ? getSnapshot(Number(t1)) : null;
  let b = t2 ? getSnapshot(Number(t2)) : null;
  if (!a || !b) {
    const recent = listSnapshots(10);
    if (recent.length >= 2) {
      a = a || getSnapshot(recent[recent.length - 1].epoch);
      b = b || getSnapshot(recent[0].epoch);
    }
  }
  if (!a || !b) return { error: 'insufficient snapshots near requested timestamps' };
  return diffFrames(a, b);
}

async function callTool(name, args = {}) {
  if (name === 'aether_observatory_telemetry') {
    const action = args.action || 'status';
    if (action === 'constellation') {
      const nodes = await buildNodes();
      return { action, count: nodes.length, nodes };
    }
    if (action === 'snapshot') {
      const frame = await liveFrame(true);
      insertSnapshot(compactFrame(frame));
      return { action, recorded: true, ts: frame.ts, epoch: frame.epoch, totalSnapshots: countSnapshots() };
    }
    if (action === 'diff') {
      return { action, diff: await runDiff(args.t1, args.t2) };
    }
    const frame = await liveFrame();
    return {
      action: 'status',
      hostname: frame.hostname,
      platform: frame.platform,
      uptimeSec: frame.uptimeSec,
      cpu: frame.cpu,
      thermals: frame.thermals,
      memory: frame.memory,
      listeners: frame.listening.count,
      processCount: frame.processCount,
      totalSnapshots: countSnapshots(),
    };
  }

  if (name === 'aether_constellation_nodes') {
    const nodes = await buildNodes();
    return { ts: new Date().toISOString(), count: nodes.length, nodes };
  }

  if (name === 'aether_timeline_diff') {
    if (!args.t1 || !args.t2) return { error: 't1 and t2 epoch-ms timestamps are required' };
    return await runDiff(args.t1, args.t2);
  }

  if (name === 'aether_snapshot_now') {
    const frame = await liveFrame(true);
    insertSnapshot(compactFrame(frame));
    return { recorded: true, ts: frame.ts, epoch: frame.epoch, totalSnapshots: countSnapshots() };
  }

  throw new Error(`Unknown MCP tool: ${name}`);
}

export async function handleJsonRpc(msg) {
  const { id, method, params } = msg || {};
  if (!method) return null;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      },
    };
  }
  if (method === 'notifications/initialized') return null;
  if (method === 'ping') return { jsonrpc: '2.0', id, result: {} };
  if (method === 'tools/list') {
    return { jsonrpc: '2.0', id, result: { tools: TOOLS } };
  }
  if (method === 'tools/call') {
    try {
      const data = await callTool(params?.name, params?.arguments || {});
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
          isError: Boolean(data?.error),
        },
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: JSON.stringify({ error: err.message }) }],
          isError: true,
        },
      };
    }
  }
  if (id === undefined) return null;
  return { jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } };
}

export function startMcpStdio() {
  process.stdout.on('error', (err) => {
    if (err && err.code === 'EPIPE') process.exit(0);
  });
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let msg;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }) + '\n');
      return;
    }
    const resp = await handleJsonRpc(msg);
    if (resp) process.stdout.write(JSON.stringify(resp) + '\n');
  });
}

if (process.argv[1] && process.argv[1].endsWith('mcp_server.js')) {
  startMcpStdio();
}
