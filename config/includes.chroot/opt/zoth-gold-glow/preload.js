// Preload bridge (contextIsolation). The page gets only these IPC channels,
// no require(), no Node globals. Regenerate if the renderer adds channels.
const { contextBridge, ipcRenderer } = require('electron');

const SEND = new Set([]);
const INVOKE = new Set(["glow-mouse-location"]);
const RECEIVE = new Set(["aura-color","aura-state"]);
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
