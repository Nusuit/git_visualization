/// <reference types="vite/client" />

interface Window {
  electronAPI: {
    selectRepo: () => Promise<string | null>;
    loadRepo: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
    installHooks: (repoPath: string) => Promise<{ success: boolean; error?: string }>;
    getConfig: () => Promise<any>;
    updateConfig: (key: string, value: any) => Promise<{ success: boolean }>;
    getRecentRepos: () => Promise<string[]>;
  };
}

