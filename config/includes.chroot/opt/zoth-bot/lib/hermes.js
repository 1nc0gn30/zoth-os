'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const computer = require('./computer');

function hermesBin() {
  const local = path.join(os.homedir(), '.local', 'bin', 'hermes');
  if (fs.existsSync(local)) return local;
  return 'hermes';
}

function available() {
  try {
    return fs.existsSync(hermesBin());
  } catch {
    return false;
  }
}

function parseLine(line, handlers) {
  let obj;
  try {
    obj = JSON.parse(line);
  } catch {
    return;
  }
  const type = obj.type;
  if (type === 'text' && obj.text) handlers.onToken(obj.text);
  else if (type === 'tool_use') {
    handlers.onTool({
      phase: 'use',
      name: obj.name,
      input: obj.input,
    });
  } else if (type === 'tool_result') {
    handlers.onTool({
      phase: 'result',
      name: obj.name,
      output: obj.output,
      isError: obj.is_error,
    });
  } else if (type === 'system' && obj.subtype === 'init') {
    handlers.onInit({ model: obj.model, session: obj.session_id });
  } else if (type === 'result') {
    handlers.onResult(obj);
  }
}

function runQuery({ prompt, onToken, onTool, onInit, onResult, maxTurns = 12, model, provider }) {
  const workspace = computer.ensureWorkspace();
  const tmp = path.join(os.tmpdir(), 'zoth-bot-q-' + process.pid + '-' + Date.now() + '.txt');
  fs.writeFileSync(tmp, prompt, { mode: 0o600 });
  const bin = hermesBin();
  const args = [
    'chat',
    '--query-file',
    tmp,
    '--format',
    'stream-json',
    '--oneshot',
    '--in',
    workspace,
    '--max-turns',
    String(maxTurns),
  ];
  if (provider) args.push('--provider', String(provider));
  if (model) args.push('-m', String(model));
  const handlers = {
    onToken: onToken || (() => {}),
    onTool: onTool || (() => {}),
    onInit: onInit || (() => {}),
    onResult: onResult || (() => {}),
  };

  return new Promise((resolve, reject) => {
    const child = spawn(bin, args, {
      cwd: workspace,
      env: { ...process.env, PATH: process.env.PATH || '~/.local/bin:/usr/bin' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let buf = '';
    let stderr = '';
    let finalText = '';
    let model = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      buf += chunk;
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      for (const line of lines) {
        if (!line.trim()) continue;
        parseLine(line, {
          ...handlers,
          onResult: (obj) => {
            if (obj.text) finalText = obj.text;
            handlers.onResult(obj);
          },
          onInit: (info) => {
            model = info.model || model;
            handlers.onInit(info);
          },
          onToken: (t) => {
            if (!finalText || !finalText.endsWith(t)) finalText += t;
            handlers.onToken(t);
          },
        });
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
      if (buf.trim()) parseLine(buf.trim(), handlers);
      if (code && !finalText) {
        reject(new Error(stderr.trim().slice(0, 800) || 'hermes exit ' + code));
        return;
      }
      resolve({ text: finalText, model: model || 'hermes', stderr, code: code || 0 });
    });
  });
}

module.exports = { available, runQuery, hermesBin };
