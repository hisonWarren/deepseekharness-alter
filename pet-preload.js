'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dshPet', {
  openMain: () => ipcRenderer.send('pet-open-main'),
  menu: () => ipcRenderer.send('pet-context-menu'),
  poke: () => ipcRenderer.send('pet-poke'),
  getBounds: () => ipcRenderer.invoke('pet-get-bounds'),
  setPosition: (x, y) => ipcRenderer.send('pet-set-position', { x, y }),
  savePosition: (x, y) => ipcRenderer.send('pet-save-position', { x, y }),
  loadPrefs: () => ipcRenderer.invoke('pet-load-prefs'),
  setOpacity: (opacity) => ipcRenderer.send('pet-set-opacity', opacity),
  setSize: (size) => ipcRenderer.send('pet-set-size', size),
  onPrefs: (cb) => {
    const handler = (_e, prefs) => cb(prefs);
    ipcRenderer.on('pet-prefs', handler);
    return () => ipcRenderer.removeListener('pet-prefs', handler);
  },
  onStatus: (cb) => {
    const handler = (_e, status) => cb(status);
    ipcRenderer.on('pet-agent-status', handler);
    return () => ipcRenderer.removeListener('pet-agent-status', handler);
  },
});
