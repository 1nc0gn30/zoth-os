/**
 * VAELOR (◈ VLR) — 1-Line Merchant POS SDK & Payment URI / QR Engine
 * =========================================================================
 * Feeless Account-Lattice DAG • Protected-Pay Escrow • Pull-Pull Subscriptions
 *
 * 1-Line Embed Usage:
 * <script src="https://vaelor-network.netlify.app/vaelor-pay.js"
 *   data-merchant="@sprig"
 *   data-amount="19.00"
 *   data-escrow-hours="24"
 *   data-memo="Lunch Special">
 * </script>
 *
 * Programmatic Usage:
 * window.VaelorPay.openCheckoutModal({
 *   to: '@sprig',
 *   amount: 19.00,
 *   memo: 'Order #757-101',
 *   protectedHours: 24
 * });
 *
 * Engineered by Neal Frazier Tech (@1nc0gn30) • NullAI Platform
 */

(function () {
  'use strict';

  // --- Pure JS QR Code SVG Generator (Zero Dependencies) ---
  function generateQrSvg(text, size = 200) {
    const exp = new Uint8Array(512), log = new Uint8Array(256);
    let x = 1;
    for (let i = 0; i < 255; i++) {
      exp[i] = x; exp[i + 255] = x; log[x] = i;
      x = (x << 1) ^ (x >= 128 ? 0x11d : 0);
    }
    const mul = (a, b) => (!a || !b ? 0 : exp[log[a] + log[b]]);
    const polyMul = (p1, p2) => {
      const r = new Uint8Array(p1.length + p2.length - 1);
      for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) r[i + j] ^= mul(p1[i], p2[j]);
      }
      return r;
    };
    const rsGen = (n) => {
      let g = new Uint8Array([1]);
      for (let i = 0; i < n; i++) g = polyMul(g, new Uint8Array([1, exp[i]]));
      return g;
    };

    const encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : { encode: (s) => Buffer.from(s, 'utf8') };
    const utf8 = encoder.encode(text);
    const ver = utf8.length <= 32 ? 2 : (utf8.length <= 62 ? 4 : 6);
    const VER_TABLE = {
      2: { size: 25, dataBytes: 34, eccBytes: 10, align: [6, 18] },
      4: { size: 33, dataBytes: 80, eccBytes: 20, align: [6, 26] },
      6: { size: 41, dataBytes: 136, eccBytes: 28, align: [6, 22, 38] }
    };
    const cfg = VER_TABLE[ver] || VER_TABLE[4];
    const N = cfg.size;

    const bits = [];
    const addBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    };
    addBits(0b0100, 4);
    addBits(utf8.length, 8);
    for (let i = 0; i < utf8.length; i++) addBits(utf8[i], 8);
    addBits(0, Math.min(4, cfg.dataBytes * 8 - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    const bytes = new Uint8Array(cfg.dataBytes);
    for (let i = 0; i < bits.length / 8; i++) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | bits[i * 8 + j];
      bytes[i] = b;
    }
    const pad = [0xec, 0x11];
    let pIdx = 0;
    for (let i = bits.length / 8; i < cfg.dataBytes; i++) {
      bytes[i] = pad[pIdx++ % 2];
    }

    const gen = rsGen(cfg.eccBytes);
    const full = new Uint8Array(cfg.dataBytes + cfg.eccBytes);
    full.set(bytes);
    for (let i = 0; i < cfg.dataBytes; i++) {
      const factor = full[i];
      if (factor !== 0) {
        for (let j = 0; j < gen.length; j++) full[i + j] ^= mul(gen[j], factor);
      }
    }
    const ecc = full.slice(cfg.dataBytes);

    const mat = Array.from({ length: N }, () => new Int8Array(N).fill(-1));
    const isFunc = Array.from({ length: N }, () => new Uint8Array(N));

    const setFinder = (r, c) => {
      for (let dr = -1; dr <= 7; dr++) {
        for (let dc = -1; dc <= 7; dc++) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < N && nc >= 0 && nc < N) {
            isFunc[nr][nc] = 1;
            const inOuter = (dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6);
            const inBorder = (dr === 0 || dr === 6 || dc === 0 || dc === 6);
            const inCenter = (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4);
            mat[nr][nc] = inOuter ? (inBorder || inCenter ? 1 : 0) : 0;
          }
        }
      }
    };
    setFinder(0, 0);
    setFinder(0, N - 7);
    setFinder(N - 7, 0);

    for (let i = 8; i < N - 8; i++) {
      if (!isFunc[6][i]) { isFunc[6][i] = 1; mat[6][i] = i % 2 === 0 ? 1 : 0; }
      if (!isFunc[i][6]) { isFunc[i][6] = 1; mat[i][6] = i % 2 === 0 ? 1 : 0; }
    }

    const aligns = cfg.align;
    for (let r of aligns) {
      for (let c of aligns) {
        if (isFunc[r][c]) continue;
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            isFunc[r + dr][c + dc] = 1;
            const isEdge = Math.abs(dr) === 2 || Math.abs(dc) === 2;
            const isMid = dr === 0 && dc === 0;
            mat[r + dr][c + dc] = isEdge || isMid ? 1 : 0;
          }
        }
      }
    }

    if (4 * ver + 9 < N) {
      isFunc[4 * ver + 9][8] = 1;
      mat[4 * ver + 9][8] = 1;
    }

    for (let i = 0; i < 9; i++) {
      if (i < N) { isFunc[8][i] = 1; isFunc[i][8] = 1; }
      if (N - 1 - i >= 0) { isFunc[8][N - 1 - i] = 1; isFunc[N - 1 - i][8] = 1; }
    }

    const allCodewords = new Uint8Array(cfg.dataBytes + cfg.eccBytes);
    allCodewords.set(bytes);
    allCodewords.set(ecc, cfg.dataBytes);

    let bitIdx = 0;
    const totalBits = allCodewords.length * 8;
    let dir = -1, row = N - 1, col = N - 1;

    while (col > 0) {
      if (col === 6) col--;
      for (let c = 0; c < 2; c++) {
        const curCol = col - c;
        if (!isFunc[row][curCol]) {
          let bit = 0;
          if (bitIdx < totalBits) {
            const byteVal = allCodewords[Math.floor(bitIdx / 8)];
            bit = (byteVal >>> (7 - (bitIdx % 8))) & 1;
            bitIdx++;
          }
          const mask = ((row + curCol) % 2) === 0 ? 1 : 0;
          mat[row][curCol] = bit ^ mask;
        }
      }
      row += dir;
      if (row < 0 || row >= N) {
        dir = -dir;
        row += dir;
        col -= 2;
      }
    }

    const formatBits = 0x23d6;
    const fBits = [];
    for (let i = 14; i >= 0; i--) fBits.push((formatBits >>> i) & 1);

    for (let i = 0; i <= 5; i++) mat[8][i] = fBits[i];
    mat[8][7] = fBits[6];
    mat[8][8] = fBits[7];
    mat[7][8] = fBits[8];
    for (let i = 9; i <= 14; i++) mat[14 - i][8] = fBits[i];

    for (let i = 0; i <= 7; i++) mat[N - 1 - i][8] = fBits[i];
    for (let i = 8; i <= 14; i++) mat[8][N - 15 + i] = fBits[i];

    const padModules = 3;
    const totalMod = N + padModules * 2;
    const modSize = (size / totalMod).toFixed(2);

    let paths = '';
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (mat[r][c] === 1) {
          const px = (c + padModules) * modSize;
          const py = (r + padModules) * modSize;
          paths += `<rect x="${px}" y="${py}" width="${modSize}" height="${modSize}" fill="#f5c542" />`;
        }
      }
    }

    const centerSize = Math.max(30, Math.floor(size * 0.22));
    const centerPos = (size - centerSize) / 2;

    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="background:#05060b;border-radius:12px;border:1px solid rgba(245,197,66,0.35);display:block;margin:0 auto;box-shadow:0 8px 24px rgba(0,0,0,0.6);">
      <rect width="${size}" height="${size}" fill="#05060b" rx="12"/>
      ${paths}
      <rect x="${centerPos}" y="${centerPos}" width="${centerSize}" height="${centerSize}" rx="8" fill="#0c101d" stroke="#f5c542" stroke-width="2"/>
      <text x="${size / 2}" y="${size / 2 + 6}" font-family="sans-serif" font-weight="900" font-size="${Math.floor(centerSize * 0.62)}" fill="#f5c542" text-anchor="middle">◈</text>
    </svg>`;
  }

  // --- Vaelor POS Engine Object ---
  const VaelorPay = {
    version: '1.2.0',

    normalizeHandle(handle) {
      if (!handle) return '';
      let clean = String(handle).trim().toLowerCase();
      if (clean.startsWith('vlr1_')) return clean;
      clean = clean.replace(/^@+/, '').replace(/[^a-z0-9_.-]/g, '');
      return clean ? `@${clean}` : '';
    },

    createPaymentUri({ to, amount, memo = '', protectedHours = 24, invoiceId = null, allowanceId = null }) {
      const normTo = this.normalizeHandle(to);
      const amt = Number(amount) || 0;
      const params = new URLSearchParams();
      params.set('to', normTo);
      params.set('amount', amt.toFixed(2));
      if (memo) params.set('memo', memo);
      if (protectedHours > 0) params.set('protected', `${protectedHours}h`);
      if (invoiceId) params.set('invoice', invoiceId);
      if (allowanceId) params.set('allowance', allowanceId);

      const qs = params.toString();
      const origin = (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'https://vaelor-network.netlify.app';
      return {
        uri: `vaelor://pay?${qs}`,
        webUrl: `${origin}/?${qs}`,
        embedSnippet: `<script src="${origin}/vaelor-pay.js" data-merchant="${normTo}" data-amount="${amt.toFixed(2)}" data-escrow-hours="${protectedHours}"${invoiceId ? ` data-invoice="${invoiceId}"` : ''}${memo ? ` data-memo="${memo.replace(/"/g, '&quot;')}"` : ''}></script>`
      };
    },

    parsePaymentUri(uriString) {
      if (!uriString) return null;
      let q = uriString.includes('?') ? uriString.slice(uriString.indexOf('?') + 1) : uriString;
      const params = new URLSearchParams(q);
      const to = this.normalizeHandle(params.get('to') || params.get('merchant') || '');
      const amount = parseFloat(params.get('amount') || '0') || 0;
      const memo = params.get('memo') || '';
      let protectedHours = 0;
      const prot = (params.get('protected') || '').toLowerCase();
      if (prot) {
        const m = prot.match(/^(\d+)(h|hours|d|days)?$/);
        if (m) protectedHours = (m[2] === 'd' || m[2] === 'days') ? parseInt(m[1], 10) * 24 : parseInt(m[1], 10);
        else if (prot === 'true' || prot === 'yes') protectedHours = 24;
      }
      return {
        to,
        amount,
        memo: decodeURIComponent(memo),
        protectedHours,
        invoiceId: params.get('invoice') || null,
        allowanceId: params.get('allowance') || null
      };
    },

    generateQrSvg,

    openCheckoutModal(opts = {}) {
      const merchant = this.normalizeHandle(opts.to || opts.merchant || '@neal');
      const amount = Number(opts.amount || 19.0).toFixed(2);
      const memo = opts.memo || 'Vaelor Protected Checkout';
      const hours = parseInt(opts.protectedHours || opts.escrowHours || 24, 10);
      const invoiceId = opts.invoiceId || opts.invoice || null;
      const isSubscription = opts.mode === 'subscription' || Boolean(opts.allowanceCap);

      const uriInfo = this.createPaymentUri({
        to: merchant,
        amount,
        memo,
        protectedHours: hours,
        invoiceId
      });

      // Remove existing modal if present
      const old = document.getElementById('vaelorPayCheckoutModal');
      if (old) old.remove();

      const modal = document.createElement('div');
      modal.id = 'vaelorPayCheckoutModal';
      modal.style.cssText = 'position:fixed;inset:0;background:rgba(5,6,11,0.85);backdrop-filter:blur(10px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:-apple-system,BlinkMacSystemFont,"Space Grotesk",Roboto,sans-serif;color:#f8fafc;';

      const qrSvg = generateQrSvg(uriInfo.uri, 210);

      const protectionBadge = isSubscription
        ? `<div style="background:rgba(168,85,247,0.15);border:1px solid rgba(168,85,247,0.4);border-radius:8px;padding:8px 12px;font-size:12px;color:#c084fc;margin:12px 0;">🔄 <strong>Guarded Subscription Allowance:</strong> Capped at ${amount} ◈/mo. You can revoke this permit in 1 click at any time.</div>`
        : `<div style="background:rgba(16,185,129,0.14);border:1px solid rgba(16,185,129,0.4);border-radius:8px;padding:8px 12px;font-size:12px;color:#34d399;margin:12px 0;">🛡️ <strong>${hours}h Protected-Pay Escrow Active:</strong> Funds locked until delivery confirmed or 1-click buyer refund. Zero gas fees ($0.00).</div>`;

      modal.innerHTML = `
        <div style="max-width:440px;width:100%;background:#0c101d;border:1px solid #f5c542;border-radius:20px;padding:26px;box-shadow:0 24px 64px rgba(0,0,0,0.9);text-align:center;position:relative;">
          <button id="vaelorCloseModalBtn" type="button" style="position:absolute;top:16px;right:18px;background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;">&times;</button>
          
          <div style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border-radius:12px;background:linear-gradient(135deg,#f5c542,#b45309);font-weight:900;font-size:22px;color:#05060b;margin-bottom:10px;">◈</div>
          <h3 style="margin:0 0 4px;font-size:20px;font-weight:800;">${isSubscription ? 'Subscribe with Vaelor' : 'Pay with Vaelor'}</h3>
          <div style="color:#94a3b8;font-size:13px;">Merchant: <strong style="color:#f5c542;">${merchant}</strong></div>
          <div style="font-size:28px;font-weight:800;color:#f5c542;margin:10px 0 4px;font-family:monospace;">${amount} ◈ VLR</div>
          <div style="font-size:12px;color:#cbd5e1;margin-bottom:12px;">"${memo}"</div>

          ${protectionBadge}

          <div style="margin:16px 0;">
            ${qrSvg}
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;margin-top:16px;">
            <a href="${uriInfo.uri}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:linear-gradient(135deg,#f5c542,#d97706);color:#05060b;font-weight:800;text-decoration:none;font-size:14px;box-shadow:0 4px 18px rgba(245,197,66,0.35);">⚡ Open in Vaelor Wallet (App / Passkey)</a>
            <a href="${uriInfo.webUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 16px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(245,197,66,0.3);color:#f8fafc;font-weight:600;text-decoration:none;font-size:13px;">🌐 Pay via Web Portal</a>
          </div>

          <div style="margin-top:14px;font-size:11px;color:#64748b;font-family:monospace;">
            Zero Gas • Sub-20ms DAG Settlement • 0% Merchant Interchange
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      modal.querySelector('#vaelorCloseModalBtn').addEventListener('click', () => modal.remove());
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    },

    rpcEndpoint: (typeof window !== 'undefined' && window.location && window.location.origin) ? window.location.origin : 'http://127.0.0.1:8140',

    setRpcEndpoint(endpoint) {
      if (endpoint) this.rpcEndpoint = endpoint.replace(/\/+$/, '');
    },

    levenshtein(a, b) {
      if (a === b) return 0;
      if (!a.length) return b.length;
      if (!b.length) return a.length;
      const matrix = [];
      for (let i = 0; i <= b.length; i++) matrix[i] = [i];
      for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
      for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
          if (b.charAt(i - 1) === a.charAt(j - 1)) {
            matrix[i][j] = matrix[i - 1][j - 1];
          } else {
            matrix[i][j] = Math.min(
              matrix[i - 1][j - 1] + 1,
              matrix[i][j - 1] + 1,
              matrix[i - 1][j] + 1
            );
          }
        }
      }
      return matrix[b.length][a.length];
    },

    normalizeHomoglyphs(str) {
      if (!str) return '';
      let s = str.toLowerCase();
      s = s.replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/cl/g, 'd');
      const map = {
        '0': 'o', '1': 'l', '!': 'l', '|': 'l', 'i': 'l',
        '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's',
        '8': 'b', '9': 'g', 'q': 'g', 'u': 'v'
      };
      let out = '';
      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        out += map[ch] !== undefined ? map[ch] : ch;
      }
      return out;
    },

    async verifyHandle(handle, rpcEndpoint = null) {
      const clean = this.normalizeHandle(handle);
      if (!clean) throw new Error('Handle cannot be empty');
      const endpoint = (rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');

      try {
        const res = await fetch(`${endpoint}/api/directory/check/${encodeURIComponent(clean)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.safety) {
            return {
              ok: data.ok,
              handle: data.handle || clean,
              safe: data.safety.safe,
              isVerified: data.safety.isVerified,
              riskLevel: data.safety.riskLevel,
              warning: data.safety.warning || null,
              suggestedHandle: data.safety.suggestedHandle || null,
              displayName: data.safety.name,
              domain: data.safety.domain,
              trustScore: data.safety.trustScore,
              safety: data.safety,
              snapshot: data.snapshot
            };
          }
          return data;
        }
      } catch (e) {
        // Fallback to offline verification against known verified registry
      }

      // Offline Homoglyph & Levenshtein Fallback
      const KNOWN_VERIFIED = [
        { handle: '@neal', name: 'Neal Frazier Tech (@1nc0gn30)', domain: 'nealfrazier.tech', trustScore: 99 },
        { handle: '@zoth', name: 'Zoth Studio & ZothOS AI Engine', domain: 'zoth.nullai.tech', trustScore: 99 },
        { handle: '@sprig', name: 'Sprig Kitchen • 757 Local Merchant', domain: 'sprig.757tech.pro', trustScore: 97 },
        { handle: '@treasury', name: 'Vaelor Sovereign Treasury Reserve', domain: 'vaelor.nullai.tech', trustScore: 100 },
        { handle: '@citizen', name: 'Verified Citizen Testbed', domain: 'demo.vaelor.nullai.tech', trustScore: 92 }
      ];

      const sTarget = clean.replace(/^@+/, '');
      const hTarget = this.normalizeHomoglyphs(sTarget);

      const exact = KNOWN_VERIFIED.find((d) => d.handle.toLowerCase() === clean.toLowerCase());
      if (exact) {
        return {
          ok: true,
          safe: true,
          isVerified: true,
          riskLevel: 'VERIFIED_SAFE',
          handle: exact.handle,
          displayName: exact.name,
          domain: exact.domain,
          trustScore: exact.trustScore,
          message: `Verified sovereign entity bound to official domain ${exact.domain}`
        };
      }

      for (const d of KNOWN_VERIFIED) {
        const sVer = d.handle.replace(/^@+/, '').toLowerCase();
        const hVer = this.normalizeHomoglyphs(sVer);
        const isHomoglyphMatch = (hTarget === hVer);
        const rawDist = this.levenshtein(sTarget, sVer);
        const homoDist = this.levenshtein(hTarget, hVer);

        if (isHomoglyphMatch || rawDist === 1 || (homoDist === 1 && sTarget.length >= 3)) {
          return {
            ok: true,
            safe: false,
            isVerified: false,
            riskLevel: 'HIGH_LOOKALIKE_RISK',
            warning: `Lookalike handle detected! Did you mean verified handle ${d.handle}?`,
            suggestedHandle: d.handle,
            suggestedName: d.name,
            suggestedDomain: d.domain,
            attackType: isHomoglyphMatch ? 'HOMOGLYPH_SUBSTITUTION' : 'TYPOSQUAT_DISTANCE_1',
            trustScore: 10
          };
        }
      }

      return {
        ok: true,
        safe: true,
        isVerified: false,
        riskLevel: 'UNVERIFIED_COMMUNITY',
        handle: clean,
        warning: 'Handle is not in the verified merchant registry, but no lookalike risk detected.',
        trustScore: 70
      };
    },

    async createSmartReceipt(options = {}) {
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const payload = {
        buyer: this.normalizeHandle(options.buyer || '@citizen'),
        merchant: this.normalizeHandle(options.merchant || options.seller || '@sprig'),
        items: Array.isArray(options.items) && options.items.length ? options.items : [{ name: options.itemName || 'Product Order', qty: 1, unitPrice: Number(options.amount || 19.0) }],
        category: options.category || 'Retail & POS',
        warrantyDays: options.warrantyDays !== undefined ? options.warrantyDays : 365,
        memo: options.memo || 'Vaelor Smart POS Receipt (Instant Cashback & Cryptographic Attestation)',
        cashbackBps: options.cashbackBps !== undefined ? options.cashbackBps : 250
      };

      const res = await fetch(`${endpoint}/api/receipts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to generate Smart Receipt');
      }
      return data;
    },

    async checkoutBnpl(options = {}) {
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const payload = {
        handle: this.normalizeHandle(options.handle || options.buyer || '@citizen'),
        amount: Number(options.amount || 25.0),
        recipient: this.normalizeHandle(options.recipient || options.merchant || '@sprig'),
        memo: options.memo || '30-Day 0% APR Buy-Now-Pay-Later Checkout'
      };

      const res = await fetch(`${endpoint}/api/credit/draw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to process 0% APR BNPL checkout');
      }
      return data;
    },

    async createStream(options = {}) {
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const payload = {
        sender: this.normalizeHandle(options.sender || '@citizen'),
        recipient: this.normalizeHandle(options.recipient || '@zoth'),
        totalAmount: Number(options.totalAmount || options.amount || 50.0),
        durationSeconds: Number(options.durationSeconds || options.duration || 3600),
        memo: options.memo || 'Continuous Per-Second Inference Streaming Meter'
      };

      const res = await fetch(`${endpoint}/api/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to open real-time payment stream');
      }
      return data;
    },

    setLocalNode(node) {
      this.localNode = node;
      return this;
    },

    async sendCreatorTip(options = {}) {
      const from = this.normalizeHandle(options.from || '@citizen');
      const creator = this.normalizeHandle(options.creator || '@sprig');
      const amount = Number(options.amountVlr !== undefined ? options.amountVlr : (options.amount || 10.0));
      const message = options.message || 'Supporting sovereign open-source computing!';
      const projectSlug = options.projectSlug || 'zoth-os';

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.sendCreatorTip({ from, creator, amount, message, projectSlug });
        return { ok: true, ...res, snapshot: node.getNetworkSnapshot() };
      }

      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/tips/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, creator, amount, message, projectSlug })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to send creator tip');
      }
      return data;
    },

    async checkoutMerchantFx(options = {}) {
      const buyer = this.normalizeHandle(options.buyer || options.from || '@citizen');
      const merchant = this.normalizeHandle(options.merchant || options.to || '@sprig');
      const amount = Number(options.amountVlr !== undefined ? options.amountVlr : (options.amount || 25.0));
      const memo = options.memo || 'Multi-Currency Merchant FX Checkout';

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.executeMerchantFxCheckout(buyer, merchant, amount, memo);
        return { ok: true, ...res, snapshot: node.getNetworkSnapshot() };
      }

      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/merchant-fx/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer, merchant, amount, memo })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to execute merchant FX checkout');
      }
      return data;
    },

    async createProtectedEscrow(options = {}) {
      const buyer = this.normalizeHandle(options.buyer || options.from || '@citizen');
      const merchant = this.normalizeHandle(options.merchant || options.to || '@sprig');
      const amountVlr = Number(options.amountVlr !== undefined ? options.amountVlr : (options.amount || 25.0));
      const itemTitle = options.itemTitle || options.title || options.memo || 'Hardware Order';
      const autoReleaseHours = Number(options.autoReleaseHours || options.protectionHours || 72);

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.createProtectedEscrow(buyer, merchant, amountVlr, itemTitle, autoReleaseHours);
        return { ok: true, ...res, snapshot: node.getNetworkSnapshot() };
      }

      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/escrows/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyer, merchant, amountVlr, itemTitle, autoReleaseHours })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create protected escrow');
      }
      return data;
    },

    async resolveProtectedEscrow(options = {}) {
      const escrowId = String(options.escrowId || options.id || '').trim();
      const resolutionType = String(options.resolutionType || options.action || 'RELEASE').toUpperCase();
      const refundPct = Number(options.refundPct !== undefined ? options.refundPct : (resolutionType === 'REFUND' ? 100 : resolutionType === 'SPLIT' ? 50 : 0));

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.resolveProtectedEscrow(escrowId, resolutionType, refundPct);
        return { ok: true, ...res, snapshot: node.getNetworkSnapshot() };
      }

      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/escrows/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escrowId, resolutionType, refundPct })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to resolve protected escrow');
      }
      return data;
    },

    async getLoyaltyProfile(handle = '@citizen', options = {}) {
      const clean = this.normalizeHandle(handle || '@citizen');

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const profile = node.getLoyaltyProfile(clean);
        return { ok: true, handle: clean, profile, snapshot: node.getNetworkSnapshot() };
      }

      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/loyalty/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Failed to fetch loyalty profile for ${clean}`);
      }
      return data;
    },

    async callMcpTool(tool, args = {}, options = {}) {
      const toolName = typeof tool === 'object' ? (tool.tool || tool.name) : tool;
      const toolArgs = typeof tool === 'object' ? (tool.arguments || tool.args || args) : args;

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        if (typeof require !== 'undefined') {
          const path = require('path');
          const mcpModule = require(path.join(__dirname, '..', 'src', 'mcp', 'vaelor_mcp'));
          const toolResult = mcpModule.executeTool(node, toolName, toolArgs);
          return { ok: true, tool: toolName, result: toolResult, snapshot: node.getNetworkSnapshot() };
        }
      }

      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/mcp/call`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: toolName, arguments: toolArgs })
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `Failed to execute MCP tool "${toolName}"`);
      }
      return data;
    },

    async getTaxReport(handle = '@citizen', options = {}) {
      const clean = this.normalizeHandle(handle || '@citizen');
      const year = options.taxYear || options.year || 2026;
      const format = (options.format || 'json').toLowerCase();

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const report = node.getTaxReport(clean, year);
        if (format === 'csv') {
          return { ok: true, format: 'csv', handle: clean, taxYear: year, csvReport: report.csvReport };
        }
        return { ok: true, ...report, snapshot: node.getNetworkSnapshot() };
      }

      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/tax-report/${encodeURIComponent(clean)}?year=${year}&format=${format}`);
      if (format === 'csv') {
        const text = await res.text();
        return { ok: true, format: 'csv', handle: clean, taxYear: year, csvReport: text };
      }
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `Failed to fetch tax report for ${clean}`);
      }
      return data;
    },

    async getCommPeers(options = {}) {
      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const peers = node.getCommPeers();
        return { ok: true, peers, count: peers.length, snapshot: node.getNetworkSnapshot() };
      }
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/comm/peers`);
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to fetch comm peers');
      }
      return data;
    },

    async requestCommHandshake({ from, to, passphrase, introNote = '' }, options = {}) {
      const cleanFrom = this.normalizeHandle(from || '@neal');
      const cleanTo = this.normalizeHandle(to || '@zoth-rig2');

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.requestCommHandshake(cleanFrom, cleanTo, passphrase, introNote);
        return { ok: true, ...res, snapshot: node.getNetworkSnapshot() };
      }
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/comm/handshake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: cleanFrom, to: cleanTo, passphrase, introNote })
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to authorize comm handshake');
      }
      return data;
    },

    async sendCommMessage({ from, to, passphrase, message, attachedVlr = 0, aiTaskPrompt = '' }, options = {}) {
      const cleanFrom = this.normalizeHandle(from || '@neal');
      const cleanTo = this.normalizeHandle(to || '@zoth-rig2');
      const amt = Number(attachedVlr || 0);

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.sendCommMessage({
          from: cleanFrom,
          to: cleanTo,
          passphrase,
          message,
          attachedVlr: amt,
          aiTaskPrompt
        });
        return { ok: true, ...res, snapshot: node.getNetworkSnapshot() };
      }
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/comm/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: cleanFrom, to: cleanTo, passphrase, message, attachedVlr: amt, aiTaskPrompt })
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to dispatch encrypted comm message');
      }
      return data;
    },

    async readCommInbox(handle, passphrase, options = {}) {
      const clean = this.normalizeHandle(handle || '@citizen');

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.readCommInbox(clean, passphrase);
        return { ok: true, ...res, snapshot: node.getNetworkSnapshot() };
      }
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/comm/inbox`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle: clean, passphrase })
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || `Failed to read comm inbox for ${clean}`);
      }
      return data;
    },

    async verifyChainIntegrity(options = {}) {
      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.verifyFullChainIntegrity();
        return { ok: true, verified: true, ...res, snapshot: node.getNetworkSnapshot() };
      }
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/ledger/verify-integrity`);
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to verify ledger integrity');
      }
      return data;
    },

    async getP2pPeers(options = {}) {
      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const peers = node.getP2pPeers();
        return { ok: true, peers, clusterPeers: peers, snapshot: node.getNetworkSnapshot() };
      }
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/p2p/peers`);
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to fetch P2P peers');
      }
      return data;
    },

    async connectP2pPeer(options = {}) {
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const peerUrl = options.endpoint || options.peerUrl || 'http://127.0.0.1:8140';
      const handle = this.normalizeHandle(options.handle || '@peer');
      const role = options.role || 'AI_WORKER';
      const region = options.region || 'local-edge';

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.connectPeerNode({ endpoint: peerUrl, handle, role, region });
        return { ok: true, ...res, snapshot: node.getNetworkSnapshot() };
      }

      const res = await fetch(`${endpoint}/api/p2p/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: peerUrl, handle, role, region })
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to connect peer node');
      }
      return data;
    },

    async getP2pDelta(options = {}) {
      const since = options.since || 0;
      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.getPeerDelta(since);
        return { ok: true, ...res, snapshot: node.getNetworkSnapshot() };
      }
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/p2p/delta?since=${since}`);
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to fetch P2P delta');
      }
      return data;
    },

    async getMultisigVaults(options = {}) {
      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const vaults = node.getMultisigVaults();
        const proposals = node.getMultisigProposals();
        return { ok: true, vaults, vault: vaults[0] || null, proposals, snapshot: node.getNetworkSnapshot() };
      }
      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/multisig`);
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to fetch multi-sig vaults');
      }
      return data;
    },

    async proposeMultisigTx(options = {}) {
      const vaultId = options.vaultId || 'msig_zoth_foundation';
      const proposer = this.normalizeHandle(options.proposer || '@neal');
      const to = this.normalizeHandle(options.to || options.recipient || '@sprig');
      const amountVlr = Number(options.amountVlr !== undefined ? options.amountVlr : (options.amount || 100));
      const memo = options.memo || 'Corporate treasury allocation';

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.proposeMultisigTx({ vaultId, proposer, to, amountVlr, memo });
        return { ok: true, ...res, snapshot: node.getNetworkSnapshot() };
      }

      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/multisig/propose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaultId, proposer, to, amountVlr, memo })
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to propose multi-sig transfer');
      }
      return data;
    },

    async approveMultisigTx(options = {}) {
      const proposalId = options.proposalId || options.id;
      const signer = this.normalizeHandle(options.signer || options.handle || '@zoth');

      if (options.localNode || this.localNode) {
        const node = options.localNode || this.localNode;
        const res = node.approveMultisigTx({ proposalId, signer });
        return { ok: true, ...res, snapshot: node.getNetworkSnapshot() };
      }

      const endpoint = (options.rpcEndpoint || this.rpcEndpoint || 'http://127.0.0.1:8140').replace(/\/+$/, '');
      const res = await fetch(`${endpoint}/api/multisig/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId, signer })
      });
      const data = await res.json();
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || 'Failed to approve multi-sig proposal');
      }
      return data;
    }
  };

  // Expose global
  if (typeof window !== 'undefined') {
    window.VaelorPay = VaelorPay;
  }

  // --- Auto-initialize 1-Line Drop-in Script Tag ---
  function initAutoScripts() {
    const scripts = document.querySelectorAll('script[data-merchant]');
    scripts.forEach((script) => {
      if (script.getAttribute('data-vaelor-initialized')) return;
      script.setAttribute('data-vaelor-initialized', 'true');

      const merchant = script.getAttribute('data-merchant') || '@neal';
      const amount = script.getAttribute('data-amount') || '19.00';
      const memo = script.getAttribute('data-memo') || 'Order Checkout';
      const hours = script.getAttribute('data-escrow-hours') || '24';
      const invoiceId = script.getAttribute('data-invoice') || null;
      const mode = script.getAttribute('data-mode') || 'button';
      const cap = script.getAttribute('data-allowance-cap') || null;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.style.cssText = 'display:inline-flex;align-items:center;gap:8px;background:linear-gradient(135deg,#f5c542,#10b981);color:#05060b;font-family:-apple-system,BlinkMacSystemFont,"Space Grotesk",sans-serif;font-weight:800;font-size:14px;padding:12px 20px;border-radius:10px;border:none;cursor:pointer;box-shadow:0 4px 18px rgba(245,197,66,0.35);transition:transform 0.15s ease;';
      btn.innerHTML = mode === 'subscription' || cap
        ? `<span>◈</span> Subscribe ${amount} VLR/mo (${merchant} • Guarded Allowance)`
        : `<span>◈</span> Pay ${amount} VLR to ${merchant} (${hours}h Escrow • $0 Gas)`;

      btn.addEventListener('mouseenter', () => (btn.style.transform = 'translateY(-1px)'));
      btn.addEventListener('mouseleave', () => (btn.style.transform = 'none'));

      btn.addEventListener('click', () => {
        VaelorPay.openCheckoutModal({
          to: merchant,
          amount,
          memo,
          protectedHours: hours,
          invoiceId,
          mode: mode === 'subscription' || cap ? 'subscription' : 'pay'
        });
      });

      script.parentNode.insertBefore(btn, script.nextSibling);
    });
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initAutoScripts);
    } else {
      initAutoScripts();
    }
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = VaelorPay;
  }
})();
