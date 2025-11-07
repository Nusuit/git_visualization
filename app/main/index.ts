import { app, BrowserWindow, dialog, ipcMain } from "electron";
import * as path from "path";
import { GitService } from "./git/gitService";
import { HookServer } from "./git/hookServer";
import { GitWatcher } from "./git/watcher";
import { SocketServer } from "./ipc/socket";
import { ConfigStore } from "./storage/configStore";
import { HookEventRequest, GitEventPayload } from "./types";
import { findGitExecutable, isGitAvailable } from "./utils/gitHelper";
import * as fs from "fs";

class GitFlowVisualizerApp {
  private mainWindow: BrowserWindow | null = null;
  private socketServer: SocketServer;
  private hookServer: HookServer;
  private gitWatcher: GitWatcher | null = null;
  private gitService: GitService | null = null;
  private configStore: ConfigStore;
  private currentRepoPath: string | null = null;

  constructor() {
    this.socketServer = new SocketServer();
    this.hookServer = new HookServer();
    this.configStore = new ConfigStore();
  }

  async initialize(): Promise<void> {
    await this.createWindow();
    await this.startServers();
    this.setupIpcHandlers();
    this.setupHookServerCallback();
  }

  private async createWindow(): Promise<void> {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1000,
      minHeight: 600,
      backgroundColor: "#1e1e1e",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, "../preload/index.js"),
      },
      show: false,
    });

    // Show window when ready
    this.mainWindow.once("ready-to-show", () => {
      this.mainWindow?.show();
    });

    // Load the app
    if (process.env.NODE_ENV === "development") {
      // Try port 5173 first, then 5174 if that fails
      const port = process.env.VITE_PORT || "5173";
      let loaded = false;

      for (const tryPort of [port, "5173", "5174"]) {
        try {
          await this.mainWindow.loadURL(`http://localhost:${tryPort}`);
          console.log(`[Main] Loaded from http://localhost:${tryPort}`);
          loaded = true;
          break;
        } catch (error) {
          console.log(`[Main] Port ${tryPort} not available, trying next...`);
        }
      }

      if (!loaded) {
        console.error("[Main] Could not load from any Vite port!");
      }

      this.mainWindow.webContents.openDevTools();
    } else {
      await this.mainWindow.loadFile(
        path.join(__dirname, "../renderer/index.html")
      );
    }

    // Handle window close
    this.mainWindow.on("closed", () => {
      this.mainWindow = null;
    });
  }

  private async startServers(): Promise<void> {
    try {
      await this.socketServer.start();
      await this.hookServer.start();
    } catch (error) {
      console.error("Failed to start servers:", error);
      dialog.showErrorBox(
        "Server Error",
        "Failed to start internal servers. The app may not function correctly."
      );
    }
  }

  private setupIpcHandlers(): void {
    // Handle repo selection
    ipcMain.handle("select-repo", async () => {
      const result = await dialog.showOpenDialog({
        properties: ["openDirectory"],
        title: "Select Git Repository",
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      const repoPath = result.filePaths[0];

      if (!GitService.isGitRepo(repoPath)) {
        dialog.showErrorBox(
          "Invalid Repository",
          "The selected directory is not a valid Git repository."
        );
        return null;
      }

      return repoPath;
    });

    // Handle repo loading
    ipcMain.handle("load-repo", async (_event, repoPath: string) => {
      try {
        return await this.loadRepository(repoPath);
      } catch (error) {
        console.error("Failed to load repository:", error);
        return { success: false, error: String(error) };
      }
    });

    // Handle hook installation
    ipcMain.handle("install-hooks", async (_event, repoPath: string) => {
      try {
        return await this.installHooks(repoPath);
      } catch (error) {
        console.error("Failed to install hooks:", error);
        return { success: false, error: String(error) };
      }
    });

    // Get config
    ipcMain.handle("get-config", () => {
      return this.configStore.getAll();
    });

    // Update config
    ipcMain.handle("update-config", (_event, key: string, value: any) => {
      (this.configStore as any)[
        `set${key.charAt(0).toUpperCase() + key.slice(1)}`
      ]?.(value);
      return { success: true };
    });

    // Get recent repos
    ipcMain.handle("get-recent-repos", () => {
      return this.configStore.getRecentRepos();
    });
  }

  private setupHookServerCallback(): void {
    this.hookServer.onEvent(async (event: HookEventRequest) => {
      try {
        await this.handleHookEvent(event);
      } catch (error) {
        console.error("Error handling hook event:", error);
      }
    });
  }

  private async loadRepository(
    repoPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("[Main] Loading repository:", repoPath);

      // Stop existing watcher if any
      if (this.gitWatcher) {
        await this.gitWatcher.stop();
        this.gitWatcher = null;
      }

      // Create new git service
      this.gitService = new GitService(repoPath);
      this.currentRepoPath = repoPath;

      // Get full commit log
      const commits = await this.gitService.getFullLog();

      // Emit to renderer
      this.socketServer.emitInitialGraph({
        repoPath,
        commits,
      });

      // Start file watcher
      this.gitWatcher = new GitWatcher(repoPath);
      this.gitWatcher.onEvent(async (watcherEvent) => {
        if (watcherEvent.hash && this.gitService) {
          try {
            const commit = await this.gitService.getCommit(watcherEvent.hash);
            const gitEvent: GitEventPayload = {
              type:
                watcherEvent.type === "unknown" ? "commit" : watcherEvent.type,
              commit,
              ref: watcherEvent.ref,
              commitId: watcherEvent.hash,
            };
            this.socketServer.emitGitEvent(gitEvent);
            this.socketServer.emitToast({
              type: "info",
              message: `Detected ${watcherEvent.type}: ${commit.message}`,
            });
          } catch (error) {
            console.error("Error processing watcher event:", error);
          }
        }
      });
      this.gitWatcher.start();

      // Save to config
      this.configStore.setLastRepoPath(repoPath);

      this.socketServer.emitToast({
        type: "success",
        message: `Loaded repository: ${path.basename(repoPath)}`,
      });

      return { success: true };
    } catch (error) {
      console.error("[Main] Error loading repository:", error);
      return { success: false, error: String(error) };
    }
  }

  private async handleHookEvent(event: HookEventRequest): Promise<void> {
    console.log("[Main] Handling hook event:", event);

    // Verify it's for the current repo
    if (this.currentRepoPath && event.repo !== this.currentRepoPath) {
      // Try to normalize paths for comparison
      const normalizedCurrent = path.normalize(this.currentRepoPath);
      const normalizedEvent = path.normalize(event.repo);

      if (normalizedCurrent !== normalizedEvent) {
        console.log("[Main] Event is for different repo, ignoring");
        return;
      }
    }

    if (!this.gitService) {
      console.warn("[Main] No git service available");
      return;
    }

    try {
      let gitEvent: GitEventPayload;

      switch (event.event) {
        case "commit":
        case "merge":
          if (event.hash) {
            const commit = await this.gitService.getCommit(event.hash);
            gitEvent = {
              type: event.event,
              commit,
            };
            this.socketServer.emitGitEvent(gitEvent);
            this.socketServer.emitToast({
              type: "success",
              message: `${event.event === "merge" ? "Merge" : "Commit"}: ${
                event.message || commit.message
              }`,
            });
          }
          break;

        case "checkout":
          if (event.hash && event.ref) {
            const commit = await this.gitService.getCommit(event.hash);
            gitEvent = {
              type: "checkout",
              commit,
              ref: event.ref,
              commitId: event.hash,
            };
            this.socketServer.emitGitEvent(gitEvent);
            this.socketServer.emitToast({
              type: "info",
              message: `Checked out: ${event.ref}`,
            });
          }
          break;

        case "push":
          gitEvent = {
            type: "push",
            remote: event.remote,
            branch: event.branch,
          };
          this.socketServer.emitGitEvent(gitEvent);
          this.socketServer.emitToast({
            type: "info",
            message: `Pushed to ${event.remote}/${event.branch}`,
          });
          break;
      }
    } catch (error) {
      console.error("[Main] Error processing hook event:", error);
      this.socketServer.emitToast({
        type: "error",
        message: "Error processing git event",
      });
    }
  }

  private async installHooks(
    repoPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const hooksDir = path.join(repoPath, ".git", "hooks");

      // Ensure hooks directory exists
      if (!fs.existsSync(hooksDir)) {
        fs.mkdirSync(hooksDir, { recursive: true });
      }

      // Get hook scripts from resources
      const hookNames = [
        "post-commit",
        "post-merge",
        "post-checkout",
        "pre-push",
      ];
      const sourceDir = path.join(__dirname, "../../scripts/hooks");

      for (const hookName of hookNames) {
        const sourcePath = path.join(sourceDir, hookName);
        const targetPath = path.join(hooksDir, hookName);

        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, targetPath);

          // Make executable (Unix-like systems)
          if (process.platform !== "win32") {
            fs.chmodSync(targetPath, "755");
          }
        }
      }

      this.socketServer.emitToast({
        type: "success",
        message: "Git hooks installed successfully",
      });

      return { success: true };
    } catch (error) {
      console.error("[Main] Error installing hooks:", error);
      return { success: false, error: String(error) };
    }
  }

  async cleanup(): Promise<void> {
    console.log("[Main] Cleaning up...");

    if (this.gitWatcher) {
      await this.gitWatcher.stop();
    }

    await this.hookServer.stop();
    await this.socketServer.stop();
  }
}

// Create app instance
const gitFlowApp = new GitFlowVisualizerApp();

// App lifecycle
app.whenReady().then(() => {
  // Check if Git is available before starting the app
  if (!isGitAvailable()) {
    dialog.showErrorBox(
      "Git Not Found",
      "Git is not installed or not found in your system PATH.\n\n" +
        "Please install Git from https://git-scm.com/downloads and restart the application.\n\n" +
        "Common installation paths:\n" +
        "• C:\\Program Files\\Git\\cmd\\git.exe\n" +
        "• C:\\Program Files (x86)\\Git\\cmd\\git.exe"
    );
    app.quit();
    return;
  }

  console.log("[Main] Git found at:", findGitExecutable());
  gitFlowApp.initialize();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      gitFlowApp.initialize();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  await gitFlowApp.cleanup();
});
