// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    loadUrl: (url) => ipcRenderer.send('load-url', url),
    onLoadCachedContent: (callback) => ipcRenderer.on('load-cached-content', (event, data) => callback(data)),
    onLoadUrl: (callback) => ipcRenderer.on('load-url', (event, url) => callback(url)),
});
