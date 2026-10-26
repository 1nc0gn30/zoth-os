'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('zothBot', {
  invoke: (channel, payload) => ipcRenderer.invoke(channel, payload),
  send: (channel, payload) => ipcRenderer.send(channel, payload),
  on: (channel, cb) => {
    const wrap = (_e, data) => cb(data);
    ipcRenderer.on(channel, wrap);
    return () => ipcRenderer.removeListener(channel, wrap);
  },
});
