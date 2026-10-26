'use strict';

// Direct-provider agent loop: Vercel AI SDK streamText with tools mapped
// onto the existing host tools. Command execution always needs approval.
// Host modules load lazily so this file can be unit-tested outside Electron.
const lazy = (m) => new Proxy({}, { get: (_t, k) => require(m)[k] });
const tools = lazy('./tools');
const computer = lazy('./computer');
const providers = require('./providers');

function buildTools(ai, { requestApproval, audit, botId }) {
  const { tool, jsonSchema } = ai;
  const log = (action, detail) => { try { audit && audit('agent:' + botId, action, detail); } catch { /* ignore */ } };
  const obj = (properties, required = []) => jsonSchema({ type: 'object', properties, required, additionalProperties: false });
  return {
    host_status: tool({
      description: 'Probe local Zoth OS services, ring state and CPU/RAM vitals.',
      inputSchema: obj({}),
      execute: async () => { log('tool:host_status'); return tools.formatStatus(await tools.hostStatus()); },
    }),
    screenshot: tool({
      description: 'Capture a desktop screenshot into the pocket workspace. Returns the file path.',
      inputSchema: obj({}),
      execute: async () => { log('tool:screenshot'); const r = await tools.captureDesktopScreenshot(); return JSON.stringify(r); },
    }),
    clipboard_read: tool({
      description: 'Read the text on the system clipboard.',
      inputSchema: obj({}),
      execute: async () => { log('tool:clipboard_read'); const { clipboard } = require('electron'); return clipboard.readText().slice(0, 8000); },
    }),
    clipboard_write: tool({
      description: 'Put text on the system clipboard.',
      inputSchema: obj({ text: { type: 'string' } }, ['text']),
      execute: async ({ text }) => { log('tool:clipboard_write', { chars: String(text).length }); const { clipboard } = require('electron'); clipboard.writeText(String(text)); return 'ok'; },
    }),
    run_command: tool({
      description: 'Run a shell command in the pocket workspace. The operator must approve each command.',
      inputSchema: obj({ command: { type: 'string' } }, ['command']),
      execute: async ({ command }) => {
        const ok = requestApproval ? await requestApproval(command) : false;
        log(ok ? 'tool:run_command:approved' : 'tool:run_command:denied', { command });
        if (!ok) return 'operator denied';
        return String(await computer.runInWorkspace(command)).slice(0, 8000);
      },
    }),
    list_files: tool({
      description: 'List files in the pocket workspace (relative path).',
      inputSchema: obj({ path: { type: 'string' } }),
      execute: async ({ path: rel }) => { log('tool:list_files', { rel }); return String(computer.listDir(rel || '.')); },
    }),
    read_file: tool({
      description: 'Read a text file from the pocket workspace (relative path).',
      inputSchema: obj({ path: { type: 'string' } }, ['path']),
      execute: async ({ path: rel }) => { log('tool:read_file', { rel }); return String(computer.readFile(rel)).slice(0, 16000); },
    }),
    write_file: tool({
      description: 'Write a text file in the pocket workspace (relative path).',
      inputSchema: obj({ path: { type: 'string' }, content: { type: 'string' } }, ['path', 'content']),
      execute: async ({ path: rel, content }) => { log('tool:write_file', { rel, bytes: String(content).length }); computer.writeFile(rel, content); return 'written ' + rel; },
    }),
  };
}

async function run({ providerId, model, apiKey, system, history = [], user, onToken, onTool, requestApproval, audit, botId, languageModel }) {
  const ai = await import('ai');
  const lm = languageModel || (await providers.createModel(providerId, model, apiKey));
  const messages = [...history, { role: 'user', content: user }];
  const result = ai.streamText({
    model: lm,
    system,
    messages,
    tools: buildTools(ai, { requestApproval, audit, botId }),
    stopWhen: ai.stepCountIs(8),
  });
  let text = '';
  for await (const part of result.fullStream) {
    if (part.type === 'text-delta') {
      const piece = part.text ?? part.delta ?? '';
      text += piece;
      if (onToken && piece) onToken(piece);
    } else if (part.type === 'tool-call') {
      if (onTool) onTool({ phase: 'use', name: part.toolName, input: JSON.stringify(part.input ?? {}).slice(0, 300) });
    } else if (part.type === 'tool-result') {
      if (onTool) onTool({ phase: 'result', name: part.toolName, output: String(part.output ?? '').slice(0, 500) });
    } else if (part.type === 'error') {
      throw part.error instanceof Error ? part.error : new Error(String(part.error));
    }
  }
  return { text, model: model || providers.get(providerId).defaultModel, engine: 'sdk', provider: providerId };
}

module.exports = { run, buildTools };
