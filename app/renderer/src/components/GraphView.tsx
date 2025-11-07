import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CommitNode } from '../types';
import { GitGraphRenderer } from '../lib/gitGraph';
import CommitDetailModal from './CommitDetailModal';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../contexts/ThemeContext';

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
  repoPath,
  onInstallHooks,
  hooksInstalled,
  selectedAuthor = 'all',
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
      // Always recreate graph to ensure fresh render
      if (gitGraphRef.current) {
        gitGraphRef.current.destroy();
        gitGraphRef.current = null;
      }

      gitGraphRef.current = new GitGraphRenderer(graphContainerRef.current, {
        orientation: 'vertical-reverse',
        mode: 'compact',
        theme: theme,
      });

      gitGraphRef.current.renderCommits(commits);

      // Add click handlers to commit dots after rendering
      setTimeout(() => {
        const commitDots = graphContainerRef.current?.querySelectorAll('circle');
        let firstMatchingDot: HTMLElement | null = null;
        
        commitDots?.forEach((dot, index) => {
          const htmlDot = dot as HTMLElement;
          htmlDot.style.cursor = 'pointer';
          htmlDot.addEventListener('click', (e) => {
            e.stopPropagation();
            // Find commit by index (gitgraph renders in order)
            if (commits[index]) {
              setSelectedCommit(commits[index]);
            }
          });
          
          // Add highlight class for matching author
          if (commits[index]) {
            if (selectedAuthor !== 'all' && commits[index].author === selectedAuthor) {
              htmlDot.classList.add('highlight-commit');
              if (!firstMatchingDot) {
                firstMatchingDot = htmlDot;
              }
            } else {
              htmlDot.classList.remove('highlight-commit');
            }
          }
        });
        
        // Zoom to first matching commit (when filtering)
        if (firstMatchingDot && selectedAuthor !== 'all') {
          // Get SVG coordinates of the commit dot
          const cx = parseFloat(firstMatchingDot.getAttribute('cx') || '0');
          const cy = parseFloat(firstMatchingDot.getAttribute('cy') || '0');
          
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
            const offsetX = centerX - (cx * targetZoom);
            const offsetY = centerY - (cy * targetZoom);
            
            // Apply zoom and pan with smooth transition
            setZoom(targetZoom);
            setPanOffset({ x: offsetX, y: offsetY });
          }
        } else if (selectedAuthor === 'all' && !isReplaying) {
          // Reset zoom when no filter and not replaying
          setZoom(1);
          setPanOffset({ x: 0, y: 0 });
        }
        
        // Auto zoom to latest commit when replaying
        if (isReplaying && commitDots && commitDots.length > 0) {
          const lastDot = commitDots[commitDots.length - 1] as HTMLElement;
          if (lastDot) {
            const cx = parseFloat(lastDot.getAttribute('cx') || '0');
            const cy = parseFloat(lastDot.getAttribute('cy') || '0');
            
            const container = graphContainerRef.current?.parentElement;
            if (container) {
              const containerWidth = container.clientWidth;
              const containerHeight = container.clientHeight;
              
              const centerX = containerWidth / 2;
              const centerY = containerHeight / 2;
              
              const targetZoom = 1.5;
              const offsetX = centerX - (cx * targetZoom);
              const offsetY = centerY - (cy * targetZoom);
              
              setZoom(targetZoom);
              setPanOffset({ x: offsetX, y: offsetY });
            }
          }
        }
      }, 100);
    }

    return () => {
      // Don't destroy on every render, only on unmount
    };
  }, [commits, theme, selectedAuthor, isReplaying]);

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
    if (e.button === 0) { // Left mouse button
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
    e.preventDefault();
    e.stopPropagation(); // Prevent scroll from affecting page
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.3, Math.min(3, prev + delta)));
  };

  const getRepoName = (path: string) => {
    const parts = path.split(/[\\/]/);
    return parts[parts.length - 1];
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-dark-100">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-dark-200 border-b border-gray-300 dark:border-dark-300 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {getRepoName(repoPath)}
          </h2>
          <span className="text-gray-600 dark:text-gray-500 text-sm">{repoPath}</span>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {!hooksInstalled && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onInstallHooks}
              className="btn bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-2"
            >
              <span>⚠️</span>
              Install Git Hooks
            </motion.button>
          )}
          {hooksInstalled && (
            <div className="flex items-center gap-2 text-green-500 text-sm">
              <span>✓</span>
              Hooks Active
            </div>
          )}
        </div>
      </div>

      {/* Graph Controls */}
      <div className="bg-gray-100 dark:bg-dark-200 border-b border-gray-300 dark:border-dark-300 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">🔍 Zoom:</span>
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
            <span>🖱️ <strong>Drag</strong> to pan</span>
            <span>🖲️ <strong>Scroll</strong> to zoom</span>
            <span>🖱️ <strong>Click commit</strong> for details</span>
          </div>
        </div>

        <div className="text-gray-600 dark:text-gray-400 text-sm">
          <span className="font-semibold text-gray-900 dark:text-white">{commits.length}</span> commit{commits.length !== 1 ? 's' : ''} loaded
        </div>
      </div>

      {/* Graph Canvas */}
      <div className={`flex-1 overflow-hidden relative bg-white dark:bg-dark-100 ${selectedAuthor !== 'all' ? 'filtered-view' : ''}`}>
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
              cursor: isPanning ? 'grabbing' : 'grab',
              backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
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
                transformOrigin: 'top center',
                transition: isPanning ? 'none' : 'transform 0.1s ease-out',
                minHeight: 'fit-content',
                backgroundColor: theme === 'dark' ? '#1e1e1e' : '#ffffff',
              }}
            >
              <div 
                ref={graphContainerRef} 
                className="graph-canvas"
                style={{
                  minHeight: '100%',
                  display: 'inline-block',
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

