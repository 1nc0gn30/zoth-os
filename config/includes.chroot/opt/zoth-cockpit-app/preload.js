// Preload bridge (contextIsolation). The page gets only these IPC channels,
// no require(), no Node globals. Regenerate if the renderer adds channels.
const { contextBridge, ipcRenderer } = require('electron');

const SEND = new Set(["window-close","window-maximize","window-minimize"]);
const INVOKE = new Set(["daemon-action","dispatch-agent-prompt","get-daemon-logs","get-full-state","kill-process","launch-tool","switch-reality-mode"]);
const RECEIVE = new Set(["telemetry-update"]);
const fakeEvent = Object.freeze({ sender: null });
const wrap = (cb) => (_event, ...args) => cb(fakeEvent, ...args);

contextBridge.exposeInMainWorld('zothIpc', {
  send(channel, ...args) {
    if (SEND.has(channel)) ipcRenderer.send(channel, ...args);
    else console.warn('[preload] blocked send on', channel);
  },
  invoke(channel, ...args) {
    if (INVOKE.has(channel)) return ipcRenderer.invoke(channel, ...args);
    return Promise.reject(new Error('blocked channel ' + channel));
  },
  on(channel, cb) {
    if (RECEIVE.has(channel) && typeof cb === 'function') ipcRenderer.on(channel, wrap(cb));
  },
  once(channel, cb) {
    if (RECEIVE.has(channel) && typeof cb === 'function') ipcRenderer.once(channel, wrap(cb));
  },
});
