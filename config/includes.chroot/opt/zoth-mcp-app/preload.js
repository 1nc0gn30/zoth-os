// Preload bridge (contextIsolation). The page gets only these IPC channels,
// no require(), no Node globals. Regenerate if the renderer adds channels.
const { contextBridge, ipcRenderer } = require('electron');

const SEND = new Set(["execute-tool-prompt","get-mcp-config","health-mcp-check","save-mcp-config","start-all-daemons","stop-all-daemons","sync-mcp-config"]);
const INVOKE = new Set([]);
const RECEIVE = new Set(["daemon-action-result","health-mcp-result","mcp-config-data","save-mcp-config-result","sync-mcp-config-result","tool-prompt-result"]);
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
