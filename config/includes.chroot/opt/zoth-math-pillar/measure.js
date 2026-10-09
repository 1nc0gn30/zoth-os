/**
 * Measurements the HUD can actually compute from text, clocks, and token counts.
 * Attention weights, loss gradients, and Bayesian tool posteriors are not observed here.
 */

function shannonBits(counts, total) {
  if (!total) return null;
  let h = 0;
  for (const count of Object.values(counts)) {
    if (!count) continue;
    const p = count / total;
    h -= p * Math.log2(p);
  }
  return h;
}

function measureText(text) {
  const raw = String(text || '');
  const n = raw.length;
  if (n < 2) {
    return {
      chars: n,
      bitsPerChar: null,
      bigramBits: null,
      estTokens: 0,
      uniqueRatio: null,
      perplexity: null
    };
  }
  const uni = {};
  for (const ch of raw) uni[ch] = (uni[ch] || 0) + 1;
  const bi = {};
  for (let i = 0; i < n - 1; i += 1) {
    const bg = raw.slice(i, i + 2);
    bi[bg] = (bi[bg] || 0) + 1;
  }
  const bitsPerChar = shannonBits(uni, n);
  const bigramBits = shannonBits(bi, n - 1);
  const unique = Object.keys(uni).length;
  return {
    chars: n,
    bitsPerChar: +bitsPerChar.toFixed(3),
    bigramBits: +bigramBits.toFixed(3),
    estTokens: Math.max(1, Math.round(n / 4)),
    uniqueRatio: +(unique / n).toFixed(3),
    perplexity: +Math.pow(2, bitsPerChar).toFixed(3)
  };
}

function tokenRate(tokens, dtSec) {
  if (!(dtSec > 0) || typeof tokens !== 'number' || tokens < 0) return null;
  return +(tokens / dtSec).toFixed(2);
}

function kvBytesMb(tokens, shape) {
  if (!shape || !shape.layers || !shape.kvHeads || !shape.headDim || !(tokens >= 0)) return null;
  const bytes = shape.bytes || 2;
  const total = 2 * shape.layers * shape.kvHeads * shape.headDim * tokens * bytes;
  return +(total / (1024 * 1024)).toFixed(2);
}

function shapeFromOllamaInfo(info) {
  if (!info || typeof info !== 'object') return null;
  const entries = Object.entries(info);
  const pick = (suffix) => {
    const hit = entries.find(([key]) => key.endsWith(suffix));
    return hit ? Number(hit[1]) : null;
  };
  const layers = pick('block_count');
  const heads = pick('attention.head_count');
  const kvHeads = pick('attention.head_count_kv') || heads;
  const embed = pick('embedding_length');
  const keyLen = pick('attention.key_length');
  const headDim = keyLen || (embed && heads ? Math.round(embed / heads) : null);
  if (!layers || !kvHeads || !headDim) return null;
  return { layers, kvHeads, headDim, bytes: 2, embed: embed || null };
}

function toolDistribution(names) {
  const counts = {};
  let n = 0;
  for (const name of names || []) {
    if (!name) continue;
    counts[name] = (counts[name] || 0) + 1;
    n += 1;
  }
  const probs = {};
  for (const [name, count] of Object.entries(counts)) probs[name] = +(count / n).toFixed(3);
  return { n, counts, probs };
}

module.exports = {
  shannonBits,
  measureText,
  tokenRate,
  kvBytesMb,
  shapeFromOllamaInfo,
  toolDistribution
};
