'use strict';

// SQLite store for conversations, messages, jobs and an audit log.
const path = require('path');
const fs = require('fs');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot_id TEXT NOT NULL,
  title TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('system','user','assistant','tool')),
  content TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id);
CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  bot_id TEXT,
  kind TEXT NOT NULL,
  label TEXT,
  schedule TEXT,
  payload TEXT,
  enabled INTEGER NOT NULL DEFAULT 1,
  last_run TEXT,
  last_result TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TABLE IF NOT EXISTS audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  actor TEXT,
  action TEXT NOT NULL,
  detail TEXT
);
`;

function open(file) {
  const Database = require('better-sqlite3');
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return wrap(db);
}

function wrap(db) {
  const q = {
    newConv: db.prepare('INSERT INTO conversations (bot_id, title) VALUES (?, ?)'),
    latestConv: db.prepare('SELECT * FROM conversations WHERE bot_id = ? ORDER BY updated_at DESC, id DESC LIMIT 1'),
    touchConv: db.prepare("UPDATE conversations SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?"),
    addMsg: db.prepare('INSERT INTO messages (conversation_id, role, content, provider, model) VALUES (?, ?, ?, ?, ?)'),
    listMsgs: db.prepare('SELECT * FROM (SELECT * FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT ?) ORDER BY id ASC'),
    addJob: db.prepare('INSERT INTO jobs (bot_id, kind, label, schedule, payload, enabled) VALUES (?, ?, ?, ?, ?, ?)'),
    listJobs: db.prepare('SELECT * FROM jobs ORDER BY id'),
    jobRan: db.prepare('UPDATE jobs SET last_run = ?, last_result = ? WHERE id = ?'),
    setJobEnabled: db.prepare('UPDATE jobs SET enabled = ? WHERE id = ?'),
    audit: db.prepare('INSERT INTO audit (actor, action, detail) VALUES (?, ?, ?)'),
    listAudit: db.prepare('SELECT * FROM audit ORDER BY id DESC LIMIT ?'),
  };
  const api = {
    raw: db,
    createConversation(botId, title = null) {
      return Number(q.newConv.run(String(botId), title).lastInsertRowid);
    },
    currentConversation(botId) {
      const row = q.latestConv.get(String(botId));
      return row ? row.id : api.createConversation(botId);
    },
    addMessage(conversationId, role, content, meta = {}) {
      const id = Number(q.addMsg.run(conversationId, role, String(content ?? ''), meta.provider || null, meta.model || null).lastInsertRowid);
      q.touchConv.run(conversationId);
      return id;
    },
    listMessages(conversationId, limit = 50) {
      return q.listMsgs.all(conversationId, limit);
    },
    addJob({ botId = null, kind, label = null, schedule = null, payload = null, enabled = true }) {
      if (!kind) throw new Error('job kind required');
      return Number(q.addJob.run(botId, kind, label, schedule, payload == null ? null : JSON.stringify(payload), enabled ? 1 : 0).lastInsertRowid);
    },
    listJobs() {
      return q.listJobs.all().map((j) => ({ ...j, enabled: !!j.enabled, payload: j.payload ? JSON.parse(j.payload) : null }));
    },
    markJobRun(id, result, when = new Date().toISOString()) {
      q.jobRan.run(when, result == null ? null : String(result).slice(0, 4000), id);
    },
    setJobEnabled(id, on) {
      q.setJobEnabled.run(on ? 1 : 0, id);
    },
    audit(actor, action, detail) {
      const d = detail == null ? null : typeof detail === 'string' ? detail : JSON.stringify(detail);
      return Number(q.audit.run(actor || null, action, d ? d.slice(0, 4000) : null).lastInsertRowid);
    },
    listAudit(limit = 50) {
      return q.listAudit.all(limit);
    },
    close() {
      db.close();
    },
  };
  return api;
}

let shared = null;
function get(root) {
  if (!shared) shared = open(path.join(root, 'zoth-bot.db'));
  return shared;
}

module.exports = { open, get, SCHEMA };
