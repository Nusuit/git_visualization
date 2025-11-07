import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CommitNode } from "../types";
import ThemeToggle from "./ThemeToggle";

interface TimelineProps {
  commits: CommitNode[];
  repoPath: string;
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
  onReplayClick?: () => void;
  onStopReplay?: () => void;
  isReplaying?: boolean;
  onAuthorFilterChange?: (author: string) => void;
  onInstallHooks: () => void;
  hooksInstalled: boolean;
}

const Timeline: React.FC<TimelineProps> = ({
  commits,
  repoPath,
  onDateRangeChange,
  onReplayClick,
  onStopReplay,
  isReplaying = false,
  onAuthorFilterChange,
  onInstallHooks,
  hooksInstalled,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const stats = useMemo(() => {
    const authors = new Set<string>();
    const branches = new Set<string>();
    let mergeCount = 0;

    commits.forEach((commit) => {
      authors.add(commit.author);
      if (commit.refs && commit.refs.length > 0) {
        commit.refs.forEach((ref) => {
          if (ref.includes("origin/") || ref.includes("HEAD")) {
            // Extract branch name
            const branchMatch = ref.match(/origin\/([^,\s]+)/);
            if (branchMatch) branches.add(branchMatch[1]);
          }
        });
      }
      if (commit.parents.length > 1) {
        mergeCount++;
      }
    });

    const sortedDates = commits
      .map((c) => new Date(c.date).getTime())
      .sort((a, b) => a - b);

    return {
      totalCommits: commits.length,
      authors: Array.from(authors),
      branches: Array.from(branches),
      mergeCount,
      firstCommit: sortedDates.length > 0 ? new Date(sortedDates[0]) : null,
      lastCommit:
        sortedDates.length > 0
          ? new Date(sortedDates[sortedDates.length - 1])
          : null,
    };
  }, [commits]);

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getRepoName = (path: string) => {
    const parts = path.split(/[\\/]/);
    return parts[parts.length - 1];
  };

  return (
    <div className="bg-gray-100 dark:bg-dark-200 border-b border-gray-300 dark:border-dark-300 px-4 py-2">
      {/* Single row with all info */}
      <div className="flex items-center justify-between gap-4">
        {/* Left: Repo info + Stats */}
        <div className="flex items-center gap-4">
          {/* Repo name */}
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {getRepoName(repoPath)}
            </h2>
            <span className="text-gray-500 dark:text-gray-500 text-xs">
              {repoPath.length > 50 ? "..." + repoPath.slice(-50) : repoPath}
            </span>
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 dark:bg-dark-400"></div>

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="text-gray-900 dark:text-white">
              <span className="text-base font-bold">{stats.totalCommits}</span>
              <span className="text-gray-600 dark:text-gray-400 text-xs ml-1">
                commits
              </span>
            </div>
            <div className="text-gray-900 dark:text-white">
              <span className="text-sm font-semibold">
                {stats.authors.length}
              </span>
              <span className="text-gray-600 dark:text-gray-400 text-xs ml-1">
                authors
              </span>
            </div>
            <div className="text-gray-900 dark:text-white">
              <span className="text-sm font-semibold">
                {stats.branches.length || "N/A"}
              </span>
              <span className="text-gray-600 dark:text-gray-400 text-xs ml-1">
                branches
              </span>
            </div>
            <div className="text-gray-900 dark:text-white">
              <span className="text-sm font-semibold">{stats.mergeCount}</span>
              <span className="text-gray-600 dark:text-gray-400 text-xs ml-1">
                merges
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {!hooksInstalled && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={onInstallHooks}
              className="btn bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-1 text-xs px-2 py-1"
            >
              <span>⚠️</span>
              Install Hooks
            </motion.button>
          )}
          {hooksInstalled && (
            <div className="flex items-center gap-1 text-green-500 text-xs">
              <span>✓</span>
              Hooks Active
            </div>
          )}

          {!isReplaying ? (
            <button
              onClick={onReplayClick}
              disabled={commits.length === 0}
              className="btn btn-secondary flex items-center gap-1 text-sm px-3 py-1 disabled:opacity-50"
            >
              ▶️ Replay
            </button>
          ) : (
            <button
              onClick={onStopReplay}
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 text-sm px-3 py-1"
            >
              ⏹️ Stop
            </button>
          )}

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary text-sm px-3 py-1"
          >
            🔍 Filters
          </button>
        </div>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-300 dark:border-dark-300 pt-4 mt-3"
        >
          <div className="grid grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="text-gray-600 dark:text-gray-400 text-sm mb-2 block font-medium">
                🔍 Search Commits
              </label>
              <input
                type="text"
                placeholder="Search message, hash, author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full text-sm"
              />
              {searchQuery && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {
                    commits.filter(
                      (c) =>
                        c.message
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        c.author
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                        c.id.includes(searchQuery)
                    ).length
                  }{" "}
                  results found
                </p>
              )}
            </div>

            {/* Author Filter */}
            <div>
              <label className="text-gray-600 dark:text-gray-400 text-sm mb-2 block font-medium">
                👤 Filter by Author
              </label>
              <select
                value={selectedAuthor}
                onChange={(e) => {
                  const newAuthor = e.target.value;
                  setSelectedAuthor(newAuthor);
                  onAuthorFilterChange?.(newAuthor);
                }}
                className="input w-full text-sm"
              >
                <option value="all">
                  All Authors ({stats.authors.length})
                </option>
                {stats.authors.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>
              {selectedAuthor !== "all" && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {commits.filter((c) => c.author === selectedAuthor).length}{" "}
                  commits
                </p>
              )}
            </div>

            {/* Date Range */}
            <div>
              <label className="text-gray-600 dark:text-gray-400 text-sm mb-2 block font-medium">
                📅 Date Range
              </label>
              <div className="text-gray-700 dark:text-gray-300 text-sm bg-white dark:bg-dark-300 rounded px-3 py-2 border border-gray-300 dark:border-dark-400">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 dark:text-gray-400">
                    From:
                  </span>
                  <span className="text-gray-900 dark:text-gray-200">
                    {formatDate(stats.firstCommit)?.split(",")[0]}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-500 dark:text-gray-400">To:</span>
                  <span className="text-gray-900 dark:text-gray-200">
                    {formatDate(stats.lastCommit)?.split(",")[0]}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(selectedAuthor !== "all" || searchQuery) && (
            <div className="mt-4 pt-3 border-t border-gray-300 dark:border-dark-400 flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-400 text-sm">
                Active filters:
              </span>
              {selectedAuthor !== "all" && (
                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  Author: {selectedAuthor}
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                  Search: "{searchQuery}"
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedAuthor("all");
                  setSearchQuery("");
                  onAuthorFilterChange?.("all");
                }}
                className="ml-auto text-xs text-red-400 hover:text-red-300"
              >
                Clear all filters
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Timeline;
