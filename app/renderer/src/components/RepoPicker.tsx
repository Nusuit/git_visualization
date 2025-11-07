import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface RepoPickerProps {
  onRepoSelected: (repoPath: string) => void;
}

const RepoPicker: React.FC<RepoPickerProps> = ({ onRepoSelected }) => {
  const [recentRepos, setRecentRepos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadRecentRepos();
  }, []);

  const loadRecentRepos = async () => {
    try {
      const repos = await window.electronAPI.getRecentRepos();
      setRecentRepos(repos);
    } catch (error) {
      console.error("Failed to load recent repos:", error);
    }
  };

  const handleSelectRepo = async () => {
    setLoading(true);
    try {
      const repoPath = await window.electronAPI.selectRepo();
      if (repoPath) {
        onRepoSelected(repoPath);
      }
    } catch (error) {
      console.error("Failed to select repo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecentRepoClick = (repoPath: string) => {
    onRepoSelected(repoPath);
  };

  const getRepoName = (repoPath: string) => {
    const parts = repoPath.split(/[\\/]/);
    return parts[parts.length - 1];
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-dark-100 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Git Flow Visualizer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Visualize your Git repository in real-time
          </p>
        </div>

        <div className="card mb-6">
          <button
            onClick={handleSelectRepo}
            disabled={loading}
            className="btn btn-primary w-full text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                Loading...
              </span>
            ) : (
              "📁 Select Repository"
            )}
          </button>
        </div>

        {recentRepos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="card"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Recent Repositories
            </h2>
            <div className="space-y-2">
              {recentRepos.map((repo, index) => (
                <motion.button
                  key={repo}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleRecentRepoClick(repo)}
                  className="w-full text-left px-4 py-3 bg-gray-100 dark:bg-dark-300 hover:bg-gray-200 dark:hover:bg-dark-400 rounded-lg transition-colors flex items-center gap-3 group"
                >
                  <span className="text-2xl">📂</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {getRepoName(repo)}
                    </p>
                    <p className="text-gray-500 dark:text-gray-500 text-sm truncate">
                      {repo}
                    </p>
                  </div>
                  <span className="text-gray-400 dark:text-gray-600 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">
                    →
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Select a Git repository to get started</p>
        </div>
      </motion.div>
    </div>
  );
};

export default RepoPicker;
