'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const auth = require('../lib/portalAuth');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'zb-auth-'));

test('token is generated once, persisted 0600 and reused', () => {
  const a = auth.loadOrCreateToken(root);
  const b = auth.loadOrCreateToken(root);
  assert.strictEqual(a, b);
  assert.ok(a.length >= 24);
  assert.strictEqual(fs.statSync(auth.tokenPath(root)).mode & 0o777, 0o600);
});

test('checkRequest accepts query, header and cookie; rejects others', () => {
  const t = auth.loadOrCreateToken(root);
  assert.deepStrictEqual(auth.checkRequest({ url: '/pixel?t=' + t, headers: {} }, t), { ok: true, via: 'query' });
  assert.strictEqual(auth.checkRequest({ url: '/api/state', headers: { 'x-zoth-token': t } }, t).via, 'header');
  assert.strictEqual(auth.checkRequest({ url: '/events', headers: { cookie: 'a=1; zoth_portal=' + t } }, t).via, 'cookie');
  assert.strictEqual(auth.checkRequest({ url: '/pixel', headers: {} }, t).ok, false);
  assert.strictEqual(auth.checkRequest({ url: '/pixel?t=wrong', headers: {} }, t).ok, false);
  assert.strictEqual(auth.checkRequest({ url: '/pixel?t=' + t.slice(0, -1), headers: {} }, t).ok, false);
});

test('bind host prefers tailscale, else loopback, env overrides', () => {
  assert.strictEqual(auth.pickBindHost({ tailscaleIp: '100.1.2.3' }, {}), '100.1.2.3');
  assert.strictEqual(auth.pickBindHost({ tailscaleIp: null }, {}), '127.0.0.1');
  assert.strictEqual(auth.pickBindHost({ tailscaleIp: '100.1.2.3' }, { ZOTH_PORTAL_HOST: '0.0.0.0' }), '0.0.0.0');
});
