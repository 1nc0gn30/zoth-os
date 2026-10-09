const assert = require('assert');
const measure = require('./measure');

console.log('--- Testing measure.js ---');

// 1. shannonBits
assert.strictEqual(measure.shannonBits({}, 0), null, 'Zero total should return null');
const uniformH = measure.shannonBits({ a: 1, b: 1, c: 1, d: 1 }, 4);
assert.strictEqual(+uniformH.toFixed(4), 2.0000, 'Uniform distribution of 4 elements has H=2');

// 2. measureText
const emptyText = measure.measureText('');
assert.strictEqual(emptyText.chars, 0);
assert.strictEqual(emptyText.bitsPerChar, null);

const repetitiveText = measure.measureText('AAAAAAAAAAAAAAAAAAAA');
assert.strictEqual(repetitiveText.chars, 20);
assert.strictEqual(repetitiveText.bitsPerChar, 0); // single symbol has 0 bits entropy
assert.strictEqual(repetitiveText.uniqueRatio, 0.05);

const normalText = measure.measureText('The quick brown fox jumps over the lazy dog.');
assert(normalText.chars > 40);
assert(normalText.bitsPerChar > 3.0 && normalText.bitsPerChar < 5.0, `Expected normal entropy, got ${normalText.bitsPerChar}`);
assert(normalText.perplexity > 0);
console.log('[✓] measureText tests passed. Sample H =', normalText.bitsPerChar, 'PPL =', normalText.perplexity);

// 3. tokenRate
assert.strictEqual(measure.tokenRate(100, 2), 50.0);
assert.strictEqual(measure.tokenRate(0, 1), 0.0);
assert.strictEqual(measure.tokenRate(100, 0), null);
assert.strictEqual(measure.tokenRate(-5, 2), null);
console.log('[✓] tokenRate tests passed');

// 4. kvBytesMb
// total = 2 * layers * kvHeads * headDim * tokens * bytes
// For 32 layers, 8 kvHeads, 128 headDim, 2048 tokens, 2 bytes:
// total = 2 * 32 * 8 * 128 * 2048 * 2 = 268,435,456 bytes = 256.00 MB
const mb = measure.kvBytesMb(2048, { layers: 32, kvHeads: 8, headDim: 128, bytes: 2 });
assert.strictEqual(mb, 256.0);
assert.strictEqual(measure.kvBytesMb(2048, null), null);
console.log('[✓] kvBytesMb tests passed. 2048 tok =', mb, 'MB');

// 5. shapeFromOllamaInfo
const mockOllamaInfo = {
  'llama.block_count': 32,
  'llama.attention.head_count': 32,
  'llama.attention.head_count_kv': 8,
  'llama.embedding_length': 4096,
  'llama.attention.key_length': 128
};
const shape = measure.shapeFromOllamaInfo(mockOllamaInfo);
assert.deepStrictEqual(shape, {
  layers: 32,
  kvHeads: 8,
  headDim: 128,
  bytes: 2,
  embed: 4096
});
console.log('[✓] shapeFromOllamaInfo tests passed');

// 6. toolDistribution
const tools = ['read_file', 'replace_file_content', 'read_file', 'run_command'];
const dist = measure.toolDistribution(tools);
assert.strictEqual(dist.n, 4);
assert.strictEqual(dist.counts['read_file'], 2);
assert.strictEqual(dist.probs['read_file'], 0.5);
assert.strictEqual(dist.probs['run_command'], 0.25);
console.log('[✓] toolDistribution tests passed');

console.log('ALL MEASURE TESTS PASSED SUCCESFULLY!');
