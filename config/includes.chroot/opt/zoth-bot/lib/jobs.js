'use strict';

const store = require('./store');
const tools = require('./tools');
const { Notification } = require('electron');

let timer = null;
let onPulse = null;

function setPulseHandler(fn) {
  onPulse = fn;
}

function notify(title, body) {
  try {
    const n = new Notification({ title, body: String(body || '').slice(0, 220) });
    n.show();
  } catch {
    /* linux may lack libnotify */
  }
}

async function tick() {
  const st = store.loadState();
  const now = Date.now();
  let dirty = false;
  for (const job of st.jobs || []) {
    if (!job.enabled) continue;
    const every = Math.max(60, Number(job.everySec) || 300) * 1000;
    const last = job.lastRun ? Date.parse(job.lastRun) : 0;
    if (now - last < every) continue;
    job.lastRun = new Date().toISOString();
    dirty = true;
    try {
      if (job.kind === 'host_status') {
        const rows = await tools.hostStatus();
        const body = tools.formatStatus(rows);
        job.lastResult = body;
        notify(`${job.botName || 'Zoth'} · pulse`, body.replace(/\n/g, ' · '));
        if (onPulse) onPulse({ job, body });
      }
    } catch (err) {
      job.lastResult = String(err.message || err);
    }
  }
  if (dirty) store.saveState(st);
}

function start() {
  if (timer) return;
  timer = setInterval(() => {
    tick().catch(() => {});
  }, 30000);
  tick().catch(() => {});
}

function stop() {
  if (timer) clearInterval(timer);
  timer = null;
}

function addJob({ botId, botName, kind, everySec, label }) {
  const st = store.loadState();
  st.jobs = st.jobs || [];
  const k = kind || 'host_status';
  const existing = st.jobs.find((j) => {
    if (j.kind !== k) return false;
    if (k === 'host_status') return true;
    return j.botId === botId;
  });
  if (existing) return existing;
  const job = {
    id: 'job-' + Date.now().toString(36),
    botId,
    botName,
    kind: k,
    everySec: Math.max(60, Number(everySec) || 300),
    label: label || 'host pulse',
    enabled: true,
    lastRun: null,
    lastResult: '',
  };
  st.jobs.push(job);
  store.saveState(st);
  return job;
}

module.exports = { start, stop, addJob, setPulseHandler, tick };
