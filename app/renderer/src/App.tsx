import { useState, useEffect, useCallback, useRef } from "react";
import RepoPicker from "./components/RepoPicker";
import GraphView from "./components/GraphView";
import Timeline from "./components/Timeline";
import EventToast from "./components/EventToast";
import { socketClient } from "./lib/socket";
import {
  CommitNode,
  InitialGraphPayload,
  GitEventPayload,
  ToastPayload,
  ToastItem,
} from "./types";

function App() {
  const [repoPath, setRepoPath] = useState<string | null>(null);
  const [commits, setCommits] = useState<CommitNode[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hooksInstalled, setHooksInstalled] = useState(false);
  const [isReplaying, setIsReplaying] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const stopReplayRef = useRef(false);

  useEffect(() => {
    // Connect to socket server
    socketClient
      .connect()
      .then(() => {
        console.log("[App] Socket connected");
      })
      .catch((error) => {
        console.error("[App] Socket connection failed:", error);
        addToast({
          type: "error",
          message: "Failed to connect to backend server",
        });
      });

    // Setup socket event listeners
    socketClient.on("initial_graph", handleInitialGraph);
    socketClient.on("git_event", handleGitEvent);
    socketClient.on("toast", handleToast);
    socketClient.on("error", handleError);

    return () => {
      socketClient.off("initial_graph", handleInitialGraph);
      socketClient.off("git_event", handleGitEvent);
      socketClient.off("toast", handleToast);
      socketClient.off("error", handleError);
      socketClient.disconnect();
    };
  }, []);

  const handleInitialGraph = useCallback((data: InitialGraphPayload) => {
    console.log(
      "[App] Received initial graph:",
      data.commits.length,
      "commits"
    );
    setCommits(data.commits);
    setLoading(false);
  }, []);

  const handleGitEvent = useCallback((data: GitEventPayload) => {
    console.log("[App] Received git event:", data.type);

    if (data.commit) {
      setCommits((prev) => {
        // Check if commit already exists
        if (prev.some((c) => c.id === data.commit!.id)) {
          return prev;
        }
        // Add new commit to the end (most recent)
        return [...prev, data.commit!];
      });
    }
  }, []);

  const handleToast = useCallback((data: ToastPayload) => {
    addToast(data);
  }, []);

  const handleError = useCallback((data: { message: string }) => {
    addToast({
      type: "error",
      message: data.message,
    });
  }, []);

  const addToast = (toast: ToastPayload) => {
    const newToast: ToastItem = {
      ...toast,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleRepoSelected = async (selectedRepoPath: string) => {
    setLoading(true);
    setRepoPath(selectedRepoPath);

    try {
      const result = await window.electronAPI.loadRepo(selectedRepoPath);
      if (result.success) {
        // Wait for initial graph from socket
        console.log("[App] Repository loaded successfully");
      } else {
        addToast({
          type: "error",
          message: result.error || "Failed to load repository",
        });
        setRepoPath(null);
        setLoading(false);
      }
    } catch (error) {
      console.error("[App] Error loading repo:", error);
      addToast({
        type: "error",
        message: "Failed to load repository",
      });
      setRepoPath(null);
      setLoading(false);
    }
  };

  const handleInstallHooks = async () => {
    if (!repoPath) return;

    try {
      const result = await window.electronAPI.installHooks(repoPath);
      if (result.success) {
        setHooksInstalled(true);
        addToast({
          type: "success",
          message: "Git hooks installed successfully",
        });
      } else {
        addToast({
          type: "error",
          message: result.error || "Failed to install hooks",
        });
      }
    } catch (error) {
      console.error("[App] Error installing hooks:", error);
      addToast({
        type: "error",
        message: "Failed to install hooks",
      });
    }
  };

  const handleReplay = async () => {
    if (commits.length === 0) return;

    setIsReplaying(true);
    stopReplayRef.current = false;

    addToast({
      type: "info",
      message: "Starting replay mode - replaying chronologically",
    });

    // Sort commits by date (oldest first)
    const sortedCommits = [...commits].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Clear commits and replay them one by one
    setCommits([]);

    // Wait a bit before starting
    await new Promise((resolve) => setTimeout(resolve, 500));

    for (let i = 0; i < sortedCommits.length; i++) {
      // Check if user stopped replay
      if (stopReplayRef.current) {
        addToast({
          type: "warning",
          message: `Replay stopped at ${i} / ${sortedCommits.length} commits`,
        });
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      setCommits((prev) => [...prev, sortedCommits[i]]);

      // Show progress toast every 10 commits
      if ((i + 1) % 10 === 0 || i === sortedCommits.length - 1) {
        addToast({
          type: "info",
          message: `Replaying: ${i + 1} / ${sortedCommits.length} commits`,
        });
      }
    }

    setIsReplaying(false);

    if (!stopReplayRef.current) {
      addToast({
        type: "success",
        message: `Replay complete! Showed ${sortedCommits.length} commits`,
      });
    }
  };

  const handleStopReplay = () => {
    stopReplayRef.current = true;
    setIsReplaying(false);
    addToast({
      type: "info",
      message: "Stopping replay...",
    });
  };

  if (!repoPath) {
    return (
      <>
        <RepoPicker onRepoSelected={handleRepoSelected} />
        <EventToast toasts={toasts} onRemove={removeToast} />
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark-100">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-500 mx-auto mb-4"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="text-white text-lg">Loading repository...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-dark-100">
      <Timeline
        commits={commits}
        repoPath={repoPath}
        onReplayClick={handleReplay}
        onStopReplay={handleStopReplay}
        isReplaying={isReplaying}
        onAuthorFilterChange={setSelectedAuthor}
        onInstallHooks={handleInstallHooks}
        hooksInstalled={hooksInstalled}
      />
      <div className="flex-1 overflow-hidden">
        <GraphView
          commits={commits}
          repoPath={repoPath}
          onInstallHooks={handleInstallHooks}
          hooksInstalled={hooksInstalled}
          selectedAuthor={selectedAuthor}
          isReplaying={isReplaying}
        />
      </div>
      <EventToast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}

export default App;
