'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const computer = require('./computer');

const GROK_MODELS = [
  'grok-4.7',
  'grok-4.7-build-fast',
  'grok-4.6',
  'grok-4.5',
];

function grokBin() {
  const candidates = [
    path.join(os.homedir(), '.grok', 'bin', 'grok'),
    path.join(os.homedir(), '.local', 'bin', 'grok'),
    '/usr/local/bin/grok',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return 'grok';
}

function available() {
  try {
    return fs.existsSync(grokBin());
  } catch {
    return false;
  }
}

function parseLine(line, handlers, state) {
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    return;
  }
  const type = obj.type;
  if (type === 'text' && typeof obj.data === 'string') {
    if (state && state.justUsedTool && state.finalText && !state.finalText.endsWith('\n')) {
      handlers.onToken('\n\n');
    }
    if (state) state.justUsedTool = false;
    handlers.onToken(obj.data);
  } else if (type === 'tool_use' || type === 'tool_call') {
    if (state) state.justUsedTool = true;
    const d = (obj && typeof obj.data === 'object' && obj.data) || obj;
    const toolName =
      d.title ||
      d.name ||
      d.tool_name ||
      d.tool ||
      obj.title ||
      obj.name ||
      obj.tool ||
      'grok_tool';
    handlers.onTool({
      phase: 'use',
      name: String(toolName),
      input: d.input || d.args || d.command || '',
    });
  } else if (type === 'tool_result' || type === 'tool_call_update') {
    const d = (obj && typeof obj.data === 'object' && obj.data) || obj;
    if (type === 'tool_call_update' && d.status && d.status !== 'completed') return;
    const toolName =
      d.title ||
      d.name ||
      d.tool_name ||
      d.tool ||
      obj.title ||
      obj.name ||
      obj.tool ||
      'grok_tool';
    const out = d.output || d.result || d.content || '';
    if (out) {
      handlers.onTool({
        phase: 'result',
        name: String(toolName),
        output: typeof out === 'string' ? out : JSON.stringify(out).slice(0, 200),
        isError: Boolean(d.is_error || d.error || obj.is_error),
      });
    }
  } else if (type === 'end') {
    handlers.onResult(obj);
  }
}

function runQuery({ prompt, onToken, onTool, onInit, onResult, maxTurns = 12, model }) {
  const workspace = computer.ensureWorkspace();
  const tmp = path.join(os.tmpdir(), 'zoth-bot-grok-' + process.pid + '-' + Date.now() + '.txt');
  fs.writeFileSync(tmp, prompt, { mode: 0o600 });
  const bin = grokBin();
  const chosenModel = model && !model.includes('/') && !model.includes(':') ? model : 'grok-4.7';
  const args = [
    '--prompt-file',
    tmp,
    '--output-format',
    'streaming-json',
    '--cwd',
    workspace,
    '--max-turns',
    String(maxTurns),
    '-m',
    chosenModel,
  ];

  const handlers = {
    onToken: onToken || (() => {}),
    onTool: onTool || (() => {}),
    onInit: onInit || (() => {}),
    onResult: onResult || (() => {}),
  };

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: workspace,
      env: {
        ...process.env,
        PATH: `${path.join(os.homedir(), '.grok', 'bin')}:${path.join(os.homedir(), '.local', 'bin')}:${process.env.PATH || '/usr/local/bin:/usr/bin:/bin'}`,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let buf = '';
    let stderr = '';
    const streamState = { finalText: '', justUsedTool: false };

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      buf += chunk;
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        parseLine(
          line,
          {
            ...handlers,
            onToken: (piece) => {
              streamState.finalText += piece;
              handlers.onToken(piece);
            },
          },
          streamState
        );
      }
    });

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (c) => {
      stderr += c;
      if (stderr.length > 8000) stderr = stderr.slice(-8000);
    });

    child.on('error', (err) => {
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* ignore */
      }
      reject(err);
    });

    child.on('close', (code) => {
      try {
        fs.unlinkSync(tmp);
      } catch {
        /* ignore */
      }
      if (buf.trim()) {
        parseLine(
          buf.trim(),
          {
            ...handlers,
            onToken: (piece) => {
              streamState.finalText += piece;
              handlers.onToken(piece);
            },
          },
          streamState
        );
      }
      if (code && !streamState.finalText) {
        reject(new Error(stderr.trim().slice(0, 800) || 'grok exit ' + code));
        return;
      }
      resolve({
        text: streamState.finalText.trim(),
        model: chosenModel,
        engine: 'grok',
        provider: 'grok',
        stderr,
        code: code || 0,
      });
    });
  });
}

module.exports = { GROK_MODELS, available, runQuery, grokBin };
