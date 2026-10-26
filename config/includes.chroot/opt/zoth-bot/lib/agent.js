'use strict';

const brain = require('./brain');
const tools = require('./tools');
const store = require('./store');
const skills = require('./skills');
const hermes = require('./hermes');
const grok = require('./grok');
const computer = require('./computer');
const sdkAgent = require('./sdkAgent');
const providers = require('./providers');

const MAX_TURNS = 8;

function composePrompt(bot, user, mem, hostBrief) {
  const skill = skills.loadAll();
  return [
    skill,
    `Teammate: ${bot.name}. Job: ${bot.job}.`,
    bot.description || '',
    hostBrief ? 'Host:\n' + hostBrief : '',
    mem ? 'Memory:\n' + mem.slice(0, 1600) : '',
    'Operator:\n' + user,
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function runHermes({ bot, user, mem, hostBrief, onToken, onTool, onInit, model, provider }) {
  const prompt = composePrompt(bot, user, mem, hostBrief);
  return hermes.runQuery({
    prompt,
    maxTurns: 12,
    onToken,
    onTool,
    onInit,
    model,
    provider,
  });
}

async function runGrok({ bot, user, mem, hostBrief, onToken, onTool, onInit, model }) {
  const prompt = composePrompt(bot, user, mem, hostBrief);
  return grok.runQuery({
    prompt,
    maxTurns: 12,
    onToken,
    onTool,
    onInit,
    model,
  });
}

async function runNative({ bot, user, mem, hostBrief, model, onToken, onTool, requestApproval }) {
  const messages = [
    { role: 'system', content: brain.systemPrompt(bot, mem, hostBrief) },
    { role: 'user', content: user },
  ];
  let last = '';
  for (let turn = 0; turn < MAX_TURNS; turn++) {
    let full = '';
    full = await brain.chatStream({
      model,
      messages,
      onToken: (p) => {
        full += p;
        if (onToken) onToken(p);
      },
    });
    last = full;
    const found = brain.parseTools(full);
    if (!found.length) return { text: last, model, engine: 'ollama' };
    messages.push({ role: 'assistant', content: full });
    const notes = [];
    for (const t of found) {
      if (onTool) onTool({ phase: 'use', name: t.name, input: t.arg });
      let result;
      try {
        if (t.name === 'run' || t.name === 'run_command') {
          const ok = requestApproval ? await requestApproval(t.arg) : false;
          if (!ok) result = 'operator denied';
          else result = await computer.runInWorkspace(t.arg);
        } else {
          const dispatched = await tools.dispatch(bot.id, t);
          if (dispatched && dispatched.needsApproval) {
            const ok = requestApproval ? await requestApproval(dispatched.command) : false;
            result = ok ? await computer.runInWorkspace(dispatched.command) : 'operator denied';
          } else {
            result = dispatched;
          }
        }
      } catch (err) {
        result = String(err.message || err);
      }
      notes.push(String(result).slice(0, 4000));
      if (onTool) onTool({ phase: 'result', name: t.name, output: String(result).slice(0, 500) });
    }
    messages.push({
      role: 'user',
      content: 'Tool results:\n' + notes.join('\n---\n') + '\nContinue. If the job is done, answer the operator with no TOOL line.',
    });
  }
  return { text: last, model, engine: 'ollama' };
}

async function run(opts) {
  computer.ensureWorkspace();
  skills.seed();
  const sdk = opts.sdkProvider && providers.get(opts.sdkProvider);
  if (sdk && sdk.kind === 'sdk') {
    return sdkAgent.run({
      providerId: sdk.id,
      model: opts.model,
      apiKey: opts.apiKey,
      system: composePrompt(opts.bot, '(see conversation)', opts.mem, opts.hostBrief),
      history: opts.history || [],
      user: opts.user,
      onToken: opts.onToken,
      onTool: opts.onTool,
      requestApproval: opts.requestApproval,
      audit: opts.audit,
      botId: opts.bot && opts.bot.id,
    });
  }
  const prefer = opts.engine || 'hermes';
  if ((prefer === 'grok' || opts.provider === 'grok') && grok.available()) {
    try {
      const r = await runGrok(opts);
      return { ...r, engine: 'grok', provider: 'grok' };
    } catch (err) {
      if (opts.onTool) {
        opts.onTool({
          phase: 'result',
          name: 'grok',
          output: 'Grok CLI quiet (' + err.message + '). Falling back to local Ollama.',
          isError: true,
        });
      }
    }
  }
  if (prefer === 'hermes' && hermes.available() && opts.provider !== 'grok') {
    try {
      const r = await runHermes(opts);
      return { ...r, engine: 'hermes', provider: opts.provider || 'nous' };
    } catch (err) {
      if (opts.onTool) {
        opts.onTool({
          phase: 'result',
          name: 'hermes',
          output: 'Hermes quiet (' + err.message + '). Falling back to local Ollama.',
          isError: true,
        });
      }
    }
  }
  const picked = await brain.pickModel(opts.model || opts.bot.model);
  return runNative({ ...opts, model: picked.model });
}

module.exports = { run, composePrompt };
