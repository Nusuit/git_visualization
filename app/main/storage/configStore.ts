import Store from 'electron-store';

interface ConfigSchema {
  lastRepoPath?: string;
  theme?: 'dark' | 'light';
  autoInstallHooks?: boolean;
  recentRepos?: string[];
  maxRecentRepos?: number;
}

const DEFAULT_CONFIG: ConfigSchema = {
  theme: 'dark',
  autoInstallHooks: true,
  recentRepos: [],
  maxRecentRepos: 10,
};

export class ConfigStore {
  private store: Store<ConfigSchema>;

  constructor() {
    this.store = new Store<ConfigSchema>({
      defaults: DEFAULT_CONFIG,
      name: 'git-flow-visualizer-config',
    });
  }

  /**
   * Get the last opened repository path
   */
  getLastRepoPath(): string | undefined {
    return this.store.get('lastRepoPath');
  }

  /**
   * Set the last opened repository path
   */
  setLastRepoPath(path: string): void {
    this.store.set('lastRepoPath', path);
    this.addRecentRepo(path);
  }

  /**
   * Get the theme preference
   */
  getTheme(): 'dark' | 'light' {
    return this.store.get('theme', 'dark');
  }

  /**
   * Set the theme preference
   */
  setTheme(theme: 'dark' | 'light'): void {
    this.store.set('theme', theme);
  }

  /**
   * Get auto install hooks preference
   */
  getAutoInstallHooks(): boolean {
    return this.store.get('autoInstallHooks', true);
  }

  /**
   * Set auto install hooks preference
   */
  setAutoInstallHooks(enabled: boolean): void {
    this.store.set('autoInstallHooks', enabled);
  }

  /**
   * Get recent repositories
   */
  getRecentRepos(): string[] {
    return this.store.get('recentRepos', []);
  }

  /**
   * Add a repository to recent list
   */
  addRecentRepo(repoPath: string): void {
    const recent = this.getRecentRepos();
    const maxRecent = this.store.get('maxRecentRepos', 10);

    // Remove if already exists
    const filtered = recent.filter((path) => path !== repoPath);

    // Add to beginning
    filtered.unshift(repoPath);

    // Limit to max
    const limited = filtered.slice(0, maxRecent);

    this.store.set('recentRepos', limited);
  }

  /**
   * Clear all recent repositories
   */
  clearRecentRepos(): void {
    this.store.set('recentRepos', []);
  }

  /**
   * Get all config
   */
  getAll(): ConfigSchema {
    return this.store.store;
  }

  /**
   * Clear all config
   */
  clear(): void {
    this.store.clear();
  }
}

