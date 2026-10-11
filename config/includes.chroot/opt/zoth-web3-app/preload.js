// Preload bridge (contextIsolation). The page gets only these IPC channels,
// no require(), no Node globals. Regenerate if the renderer adds channels.
const { contextBridge, ipcRenderer } = require('electron');

const SEND = new Set(["call-contract-method","check-rpc-nodes","generate-keypair","get-crypto-metrics","get-gas-tracker","get-wallet-state","run-web3-cmd"]);
const INVOKE = new Set([]);
const RECEIVE = new Set(["contract-call-result","crypto-metrics-update","gas-tracker-update","keypair-generated","rpc-nodes-update","wallet-state-update","web3-cmd-output"]);
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
