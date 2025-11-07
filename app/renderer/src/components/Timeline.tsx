import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CommitNode } from '../types';

interface TimelineProps {
  commits: CommitNode[];
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
  onReplayClick?: () => void;
  onStopReplay?: () => void;
  isReplaying?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({
  commits,
  onDateRangeChange,
  onReplayClick,
  onStopReplay,
  isReplaying = false,
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');

  const stats = useMemo(() => {
    const authors = new Set<string>();
    const branches = new Set<string>();
    let mergeCount = 0;

    commits.forEach((commit) => {
      authors.add(commit.author);
      if (commit.refs && commit.refs.length > 0) {
        commit.refs.forEach((ref) => {
          if (ref.includes('origin/') || ref.includes('HEAD')) {
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
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-dark-200 border-b border-dark-300 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-6">
          <div className="text-white">
            <span className="text-2xl font-bold">{stats.totalCommits}</span>
            <span className="text-gray-400 text-sm ml-2">commits</span>
          </div>
          <div className="text-white">
            <span className="text-xl font-semibold">{stats.authors.length}</span>
            <span className="text-gray-400 text-sm ml-2">authors</span>
          </div>
          <div className="text-white">
            <span className="text-xl font-semibold">{stats.branches.length || 'N/A'}</span>
            <span className="text-gray-400 text-sm ml-2">branches</span>
          </div>
          <div className="text-white">
            <span className="text-xl font-semibold">{stats.mergeCount}</span>
            <span className="text-gray-400 text-sm ml-2">merges</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isReplaying ? (
            <button
              onClick={onReplayClick}
              disabled={commits.length === 0}
              className="btn btn-secondary flex items-center gap-2 disabled:opacity-50"
            >
              ▶️ Replay
            </button>
          ) : (
            <button
              onClick={onStopReplay}
              className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
            >
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              ⏹️ Stop Replay
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary"
          >
            🔍 {showFilters ? 'Hide' : 'Filters'}
          </button>
        </div>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-dark-300 pt-3 mt-3"
        >
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <label className="text-gray-400 text-sm mb-1 block">
                Date Range
              </label>
              <div className="text-gray-300 text-sm">
                {formatDate(stats.firstCommit)} → {formatDate(stats.lastCommit)}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-gray-400 text-sm mb-1 block">Author</label>
              <select
                value={selectedAuthor}
                onChange={(e) => setSelectedAuthor(e.target.value)}
                className="input w-full text-sm"
              >
                <option value="all">All Authors ({stats.authors.length})</option>
                {stats.authors.map((author) => (
                  <option key={author} value={author}>
                    {author}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Timeline;

