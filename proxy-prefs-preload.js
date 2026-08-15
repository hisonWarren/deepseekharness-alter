'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dshProxyPrefs', {
  load: () => ipcRenderer.invoke('proxy-prefs-load'),
  save: (proxyUrl) => ipcRenderer.invoke('proxy-prefs-save', proxyUrl),
  cancel: () => ipcRenderer.send('proxy-prefs-cancel'),
});
