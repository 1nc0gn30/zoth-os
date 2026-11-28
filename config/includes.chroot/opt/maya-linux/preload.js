const { contextBridge, ipcRenderer } = require('electron');

const api = Object.freeze({
  isDesktopApp: true,
  checkSystemDeps: () => ipcRenderer.invoke('check-system-deps'),
  downloadYouTubeAudio: (url) => ipcRenderer.invoke('download-youtube-audio', url),
  downloadYouTubeAudioInTerminal: (url) => ipcRenderer.invoke('download-youtube-audio-terminal', url),
  updateYtdlp: () => ipcRenderer.invoke('update-ytdlp'),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  startNativeExport: (config) => ipcRenderer.invoke('start-native-export', config),
  feedNativeExportFrame: (buffer) => ipcRenderer.invoke('feed-native-export-frame', buffer),
  finishNativeExport: () => ipcRenderer.invoke('finish-native-export'),
  cancelNativeExport: () => ipcRenderer.invoke('cancel-native-export'),
  exportCapCutDraft: (data) => ipcRenderer.invoke('export-capcut-draft', data),
  generateNeuralTTS: (params) => ipcRenderer.invoke('generate-neural-tts', params),
  listNeuralVoices: () => ipcRenderer.invoke('list-neural-voices'),
  getCliVideoPath: () => ipcRenderer.invoke('get-cli-video-path'),
  renderMayaMotionPreset: (params) => ipcRenderer.invoke('render-maya-motion-preset', params),
});

contextBridge.exposeInMainWorld('electronAPI', api);
