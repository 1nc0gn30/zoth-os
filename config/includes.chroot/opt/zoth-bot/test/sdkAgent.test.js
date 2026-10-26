'use strict';
const test = require('node:test');
const assert = require('node:assert');
const sdkAgent = require('../lib/sdkAgent');

test('sdk agent streams tokens from a mock model', async () => {
  const { MockLanguageModelV3 } = await import('ai/test');
  const { simulateReadableStream } = await import('ai');
  const model = new MockLanguageModelV3({
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: 'text-start', id: 't' },
          { type: 'text-delta', id: 't', delta: 'Gold, ' },
          { type: 'text-delta', id: 't', delta: 'not glitter.' },
          { type: 'text-end', id: 't' },
          { type: 'finish', finishReason: 'stop', usage: { inputTokens: 1, outputTokens: 2, totalTokens: 3 } },
        ],
      }),
    }),
  });
  const pieces = [];
  const r = await sdkAgent.run({ providerId: 'xai', model: 'grok-4', languageModel: model, system: 's', user: 'u', onToken: (p) => pieces.push(p), botId: 'zoth' });
  assert.strictEqual(r.text, 'Gold, not glitter.');
  assert.strictEqual(pieces.length, 2);
});
