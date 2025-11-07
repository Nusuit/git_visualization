import * as chokidar from 'chokidar';
import * as fs from 'fs';
import * as path from 'path';
import { FILE_WATCHER_DEBOUNCE_MS } from '../../shared/constants';

export interface WatcherEvent {
  type: 'commit' | 'checkout' | 'merge' | 'unknown';
  hash?: string;
  ref?: string;
}

export class GitWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private eventCallback: ((event: WatcherEvent) => void) | null = null;
  private lastProcessedLine: string | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(private repoPath: string) {
    // Constructor only stores repoPath
  }

  /**
   * Start watching the .git/logs/HEAD file
   */
  start(): void {
    const headLogPath = path.join(this.repoPath, '.git', 'logs', 'HEAD');

    if (!fs.existsSync(headLogPath)) {
      console.warn('[GitWatcher] HEAD log file does not exist:', headLogPath);
      return;
    }

    console.log('[GitWatcher] Starting file watcher on:', headLogPath);

    // Initialize with the last line to avoid false positives
    this.lastProcessedLine = this.getLastLine(headLogPath);

    this.watcher = chokidar.watch(headLogPath, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 50,
      },
    });

    this.watcher.on('change', () => {
      this.handleFileChange(headLogPath);
    });

    this.watcher.on('error', (error) => {
      console.error('[GitWatcher] Watcher error:', error);
    });
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
      console.log('[GitWatcher] Stopped watching');
    }
  }

  /**
   * Register a callback for watcher events
   */
  onEvent(callback: (event: WatcherEvent) => void): void {
    this.eventCallback = callback;
  }

  /**
   * Handle file change with debouncing
   */
  private handleFileChange(filePath: string): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processFileChange(filePath);
    }, FILE_WATCHER_DEBOUNCE_MS);
  }

  /**
   * Process the file change and determine the event type
   */
  private processFileChange(filePath: string): void {
    try {
      const lastLine = this.getLastLine(filePath);

      if (!lastLine || lastLine === this.lastProcessedLine) {
        return; // No new changes
      }

      this.lastProcessedLine = lastLine;

      const event = this.parseLogLine(lastLine);

      if (event && this.eventCallback) {
        console.log('[GitWatcher] Detected event:', event);
        this.eventCallback(event);
      }
    } catch (error) {
      console.error('[GitWatcher] Error processing file change:', error);
    }
  }

  /**
   * Get the last line from a file
   */
  private getLastLine(filePath: string): string | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.trim().split('\n');
      return lines[lines.length - 1] || null;
    } catch (error) {
      console.error('[GitWatcher] Error reading file:', error);
      return null;
    }
  }

  /**
   * Parse a line from .git/logs/HEAD
   * Format: <old-hash> <new-hash> <author> <email> <timestamp> <tz> <action>: <message>
   */
  private parseLogLine(line: string): WatcherEvent | null {
    try {
      const parts = line.split('\t');
      if (parts.length < 2) return null;

      const headerParts = parts[0].split(' ');
      if (headerParts.length < 3) return null;

      const newHash = headerParts[1];
      const action = parts[1].toLowerCase();

      // Determine event type based on action
      if (action.includes('commit')) {
        if (action.includes('merge')) {
          return { type: 'merge', hash: newHash };
        }
        return { type: 'commit', hash: newHash };
      } else if (action.includes('checkout')) {
        const refMatch = action.match(/checkout: moving from .+ to (.+)/);
        const ref = refMatch ? refMatch[1] : undefined;
        return { type: 'checkout', hash: newHash, ref };
      } else if (action.includes('merge')) {
        return { type: 'merge', hash: newHash };
      }

      return { type: 'unknown', hash: newHash };
    } catch (error) {
      console.error('[GitWatcher] Error parsing log line:', error);
      return null;
    }
  }

  /**
   * Check if watcher is active
   */
  isWatching(): boolean {
    return this.watcher !== null;
  }
}

