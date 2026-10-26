'use strict';
const test = require('node:test');
const assert = require('node:assert');
const providers = require('../lib/providers');

test('normalize handles ids and aliases', () => {
  assert.strictEqual(providers.normalize('XAI'), 'xai');
  assert.strictEqual(providers.normalize('claude'), 'anthropic');
  assert.strictEqual(providers.normalize('gemini'), 'google');
  assert.strictEqual(providers.normalize('grok-cli'), 'grok');
  assert.strictEqual(providers.normalize('nope'), null);
});

test('select falls back to nous for unknown provider', () => {
  const s = providers.select({ provider: 'bogus' });
  assert.strictEqual(s.id, 'nous');
  assert.strictEqual(s.kind, 'cli');
  assert.strictEqual(s.ready, true);
});

test('sdk provider not ready without key, ready with key', () => {
  const none = providers.select({ provider: 'openai' }, () => null);
  assert.strictEqual(none.ready, false);
  assert.match(none.reason, /OPENAI_API_KEY/);
  const yes = providers.select({ provider: 'openai' }, (id) => (id === 'openai' ? 'k' : null));
  assert.strictEqual(yes.ready, true);
  assert.strictEqual(yes.model, 'gpt-5');
});

test('select keeps fitting model, replaces mismatched one', () => {
  assert.strictEqual(providers.select({ provider: 'anthropic', model: 'claude-opus-4' }, () => 'k').model, 'claude-opus-4');
  assert.strictEqual(providers.select({ provider: 'anthropic', model: 'gpt-5' }, () => 'k').model, 'claude-sonnet-4-5');
});

test('ollama-sdk is keyless', () => {
  assert.strictEqual(providers.select({ provider: 'ollama-sdk' }).ready, true);
});

test('createModel builds an SDK model without network', async () => {
  const m = await providers.createModel('xai', 'grok-4', 'test-key');
  assert.strictEqual(m.modelId, 'grok-4');
  await assert.rejects(providers.createModel('grok', 'x'), /not an SDK provider/);
});
