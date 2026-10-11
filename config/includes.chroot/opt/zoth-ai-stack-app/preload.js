// Preload bridge (contextIsolation). The page gets only these IPC channels,
// no require(), no Node globals. Regenerate if the renderer adds channels.
const { contextBridge, ipcRenderer } = require('electron');

const SEND = new Set(["get-ai-tools","install-ai-tool","launch-ai-tool"]);
const INVOKE = new Set([]);
const RECEIVE = new Set(["ai-tools-list","install-complete"]);
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
