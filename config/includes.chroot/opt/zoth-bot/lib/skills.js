'use strict';

const fs = require('fs');
const path = require('path');
const store = require('./store');

const DIR = path.join(store.ROOT, 'skills');

const POCKET = `# Zoth Bot — god in your pocket

You are Zoth, the desk companion on this Zoth OS laptop. The laptop is the computer.
There is no cloud VM. Hermes-class tools (files, terminal, web) run here.

Act. Do not narrate a plan instead of working. Short sentences. Gold, not glitter.
Ask before: deploy, git push, send mail, spend money, or anything outside the pocket workspace.
Never invent a buyer. Never pretend to be Grok Bot, Muse, or a Dot.

Pocket workspace: ~/.config/zothos/zoth-bot/workspace
Memory lives beside each teammate. Write lasting facts there.
`;

function seed() {
  fs.mkdirSync(DIR, { recursive: true });
  const target = path.join(DIR, 'pocket.md');
  if (!fs.existsSync(target)) fs.writeFileSync(target, POCKET, { mode: 0o644 });
}

function loadAll() {
  seed();
  let out = '';
  let names;
  try {
    names = fs.readdirSync(DIR).filter((n) => n.endsWith('.md'));
  } catch {
    return POCKET;
  }
  for (const name of names) {
    try {
      out += fs.readFileSync(path.join(DIR, name), 'utf8').trim() + '\n\n';
    } catch {
      /* skip */
    }
  }
  return out.trim() || POCKET;
}

module.exports = { DIR, seed, loadAll, POCKET };
