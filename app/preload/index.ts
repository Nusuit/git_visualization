import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  selectRepo: () => ipcRenderer.invoke('select-repo'),
  loadRepo: (repoPath: string) => ipcRenderer.invoke('load-repo', repoPath),
  installHooks: (repoPath: string) => ipcRenderer.invoke('install-hooks', repoPath),
  getConfig: () => ipcRenderer.invoke('get-config'),
  updateConfig: (key: string, value: any) => ipcRenderer.invoke('update-config', key, value),
  getRecentRepos: () => ipcRenderer.invoke('get-recent-repos'),
});

// Type definitions for TypeScript
export interface ElectronAPI {
  selectRepo: () => Promise<string | null>;
  loadRepo: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
  installHooks: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
  getConfig: () => Promise<any>;
  updateConfig: (key: string, value: any) => Promise<{ success: boolean }>;
  getRecentRepos: () => Promise<string[]>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

