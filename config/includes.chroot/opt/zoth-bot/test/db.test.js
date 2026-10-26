'use strict';
const test = require('node:test');
const assert = require('node:assert');
const dbmod = require('../lib/db');

test('conversations and messages round-trip in order', () => {
  const db = dbmod.open(':memory:');
  const c = db.currentConversation('zoth');
  assert.strictEqual(db.currentConversation('zoth'), c);
  db.addMessage(c, 'user', 'hi', { provider: 'xai' });
  db.addMessage(c, 'assistant', 'hello', { provider: 'xai', model: 'grok-4' });
  const msgs = db.listMessages(c);
  assert.deepStrictEqual(msgs.map((m) => [m.role, m.content]), [['user', 'hi'], ['assistant', 'hello']]);
  assert.strictEqual(msgs[1].model, 'grok-4');
  assert.throws(() => db.addMessage(c, 'bogus', 'x'));
  for (let i = 0; i < 30; i++) db.addMessage(c, 'user', 'm' + i);
  const last = db.listMessages(c, 5);
  assert.strictEqual(last.length, 5);
  assert.strictEqual(last[4].content, 'm29');
  db.close();
});

test('jobs and audit log', () => {
  const db = dbmod.open(':memory:');
  const id = db.addJob({ botId: 'zoth', kind: 'host_status', schedule: '*/5 * * * *', payload: { a: 1 } });
  db.markJobRun(id, 'ok', '2026-10-18T00:00:00Z');
  db.setJobEnabled(id, false);
  const [j] = db.listJobs();
  assert.deepStrictEqual([j.kind, j.enabled, j.payload.a, j.last_result], ['host_status', false, 1, 'ok']);
  assert.throws(() => db.addJob({}), /kind/);
  db.audit('operator', 'provider:set', { provider: 'xai' });
  db.audit('agent:zoth', 'tool:run_command:denied', 'rm -rf x');
  const a = db.listAudit(10);
  assert.strictEqual(a.length, 2);
  assert.strictEqual(a[0].action, 'tool:run_command:denied');
  assert.strictEqual(JSON.parse(a[1].detail).provider, 'xai');
  db.close();
});
