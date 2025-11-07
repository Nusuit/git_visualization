import React, { useEffect, useRef, useState } from "react";
import { CommitNode } from "../types";
import { GitGraphRenderer } from "../lib/gitGraph";
import CommitDetailModal from "./CommitDetailModal";
import { useTheme } from "../contexts/ThemeContext";

interface GraphViewProps {
  commits: CommitNode[];
  repoPath: string;
  onInstallHooks: () => void;
  hooksInstalled: boolean;
  selectedAuthor?: string;
  isReplaying?: boolean;
}

const GraphView: React.FC<GraphViewProps> = ({
  commits,
  selectedAuthor = "all",
  isReplaying = false,
}) => {
  const { theme } = useTheme();
  const graphContainerRef = useRef<HTMLDivElement>(null);
  const gitGraphRef = useRef<GitGraphRenderer | null>(null);
  const [zoom, setZoom] = useState(1);
  const [selectedCommit, setSelectedCommit] = useState<CommitNode | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (graphContainerRef.current && commits.length > 0) {
      // During replay, only add new commits incrementally
      if (isReplaying && gitGraphRef.current && commits.length > 0) {
        // Just render all commits (gitgraph will handle the diff)
        gitGraphRef.current.destroy();
        gitGraphRef.current = new GitGraphRenderer(graphContainerRef.current, {
          orientation: "horizontal-reverse", // Try horizontal-reverse
          mode: "compact",
          theme: theme,
        });
        gitGraphRef.current.renderCommits(commits);
        console.log(
          "[GraphView] Replay: Re-rendered with",
          commits.length,
          "commits"
        );
      } else {
        // Normal mode: recreate graph
        if (gitGraphRef.current) {
          gitGraphRef.current.destroy();
          gitGraphRef.current = null;
        }

        gitGraphRef.current = new GitGraphRenderer(graphContainerRef.current, {
          orientation: "horizontal-reverse", // Try horizontal-reverse
          mode: "compact",
          theme: theme,
        });
        gitGraphRef.current.renderCommits(commits);
        console.log("[GraphView] Normal: Rendered", commits.length, "commits");
      }

      // Add click handlers to commit dots after rendering
      setTimeout(() => {
        const commitDots =
          graphContainerRef.current?.querySelectorAll("circle");
        let firstMatchingDot: SVGCircleElement | null = null;

        commitDots?.forEach((dot, index) => {
          const svgDot = dot as SVGCircleElement;
          svgDot.style.cursor = "pointer";
          svgDot.addEventListener("click", (e) => {
            e.stopPropagation();
            // Find commit by index (gitgraph renders in order)
            if (commits[index]) {
              setSelectedCommit(commits[index]);
            }
          });

          // Add highlight class for matching author
          if (commits[index]) {
            if (
              selectedAuthor !== "all" &&
              commits[index].author === selectedAuthor
            ) {
              svgDot.classList.add("highlight-commit");
              if (!firstMatchingDot) {
                firstMatchingDot = svgDot as SVGCircleElement;
              }
            } else {
              svgDot.classList.remove("highlight-commit");
            }
          }
        });

        // Zoom to first matching commit (when filtering)
        if (firstMatchingDot && selectedAuthor !== "all") {
          // Get SVG coordinates of the commit dot
          const matchingDot = firstMatchingDot as SVGCircleElement;
          const cx = parseFloat(matchingDot.getAttribute("cx") || "0");
          const cy = parseFloat(matchingDot.getAttribute("cy") || "0");

          // Get container dimensions
          const container = graphContainerRef.current?.parentElement;
          if (container) {
            const containerWidth = container.clientWidth;
            const containerHeight = container.clientHeight;

            // Calculate center of viewport
            const centerX = containerWidth / 2;
            const centerY = containerHeight / 2;

            // Calculate offset to center the dot
            const targetZoom = 1.8;
            const offsetX = centerX - cx * targetZoom;
            const offsetY = centerY - cy * targetZoom;

            // Apply zoom and pan with smooth transition
            setZoom(targetZoom);
            setPanOffset({ x: offsetX, y: offsetY });
          }
        } else if (selectedAuthor === "all" && !isReplaying) {
          // Reset zoom when no filter and not replaying
          setZoom(1);
          setPanOffset({ x: 0, y: 0 });
        }
      }, 100);
    }

    return () => {
      // Don't destroy on every render, only on unmount
    };
  }, [commits, theme, selectedAuthor, isReplaying]);

  // Separate effect to handle camera tracking during replay
  useEffect(() => {
    if (!isReplaying || commits.length === 0) return;

    console.log("[GraphView] Camera tracking for", commits.length, "commits");

    // SOLUTION: Don't track node position (it's always the same after re-render)
    // Instead, calculate camera position based on NUMBER of commits
    // Each commit adds approximately 50px in height (COMMIT_SPACING from gitGraph config)

    const timeoutId = setTimeout(() => {
      const COMMIT_SPACING = 50; // From gitGraph.ts
      const INITIAL_OFFSET = 14; // First commit position

      // Calculate expected position of the latest commit
      // In horizontal-reverse, commits stack vertically downward
      const expectedY = INITIAL_OFFSET + (commits.length - 1) * COMMIT_SPACING;
      const expectedX = 14; // X stays constant in horizontal mode

      console.log("[GraphView] Expected latest commit position:", {
        x: expectedX,
        y: expectedY,
      });

      const container = graphContainerRef.current?.parentElement;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const centerX = containerWidth / 2;
        const centerY = containerHeight / 2;

        const targetZoom = 1.0; // 100% zoom - no zoom in during replay

        // Center camera on the expected position
        const offsetX = centerX - expectedX * targetZoom;
        const offsetY = centerY - expectedY * targetZoom;

        console.log(
          "[GraphView] Camera move to:",
          `X:${Math.round(offsetX)} Y:${Math.round(
            offsetY
          )} (expectedY=${expectedY})`
        );

        setZoom(targetZoom);
        setPanOffset({ x: offsetX, y: offsetY });
      }
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [commits.length, isReplaying]);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (gitGraphRef.current) {
        gitGraphRef.current.destroy();
        gitGraphRef.current = null;
      }
    };
  }, []);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.3));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Disable panning during replay to avoid conflicts
    if (isReplaying) return;

    if (e.button === 0) {
      // Left mouse button
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleMouseLeave = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Disable manual zoom during replay
    if (isReplaying) return;

    e.preventDefault();
    e.stopPropagation(); // Prevent scroll from affecting page
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.3, Math.min(3, prev + delta)));
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-100">
      {/* Header removed - moved to Timeline */}

      {/* Graph Controls */}
      <div className="bg-gray-100 dark:bg-dark-200 border-b border-gray-300 dark:border-dark-300 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
              🔍 Zoom:
            </span>
            <button
              onClick={handleZoomOut}
              className="w-8 h-8 bg-gray-200 dark:bg-dark-300 hover:bg-gray-300 dark:hover:bg-dark-400 rounded flex items-center justify-center text-gray-900 dark:text-white text-lg font-bold transition-colors"
              title="Zoom Out"
            >
              −
            </button>
            <span className="text-gray-900 dark:text-white text-sm min-w-[4rem] text-center font-mono bg-gray-200 dark:bg-dark-300 px-3 py-1 rounded">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="w-8 h-8 bg-gray-200 dark:bg-dark-300 hover:bg-gray-300 dark:hover:bg-dark-400 rounded flex items-center justify-center text-gray-900 dark:text-white text-lg font-bold transition-colors"
              title="Zoom In"
            >
              +
            </button>
            <button
              onClick={handleResetZoom}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors"
              title="Reset View"
            >
              Reset View
            </button>
          </div>

          {/* Instructions */}
          <div className="border-l border-gray-300 dark:border-dark-400 pl-4 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <span>
              🖱️ <strong>Drag</strong> to pan
            </span>
            <span>
              🖲️ <strong>Scroll</strong> to zoom
            </span>
            <span>
              🖱️ <strong>Click commit</strong> for details
            </span>
          </div>
        </div>

        <div className="text-gray-600 dark:text-gray-400 text-sm">
          <span className="font-semibold text-gray-900 dark:text-white">
            {commits.length}
          </span>{" "}
          commit{commits.length !== 1 ? "s" : ""} loaded
        </div>
      </div>

      {/* Graph Canvas */}
      <div
        className={`flex-1 overflow-hidden relative bg-white dark:bg-dark-100 ${
          selectedAuthor !== "all" ? "filtered-view" : ""
        }`}
      >
        {commits.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-400 text-lg">No commits to display</p>
            </div>
          </div>
        ) : (
          <div
            className="w-full min-h-full flex items-start justify-center py-8"
            style={{
              cursor: isPanning ? "grabbing" : "grab",
              backgroundColor: theme === "dark" ? "#1e1e1e" : "#ffffff",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
          >
            <div
              className="graph-container inline-block"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                transformOrigin: "top center",
                transition: isReplaying
                  ? "transform 0.3s ease-out"
                  : isPanning
                  ? "none"
                  : "transform 0.1s ease-out",
                minHeight: "fit-content",
                backgroundColor: theme === "dark" ? "#1e1e1e" : "#ffffff",
              }}
            >
              <div
                ref={graphContainerRef}
                className="graph-canvas"
                style={{
                  minHeight: "100%",
                  display: "inline-block",
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Commit Details Modal */}
      <CommitDetailModal
        commit={selectedCommit}
        onClose={() => setSelectedCommit(null)}
      />
    </div>
  );
};

export default GraphView;
