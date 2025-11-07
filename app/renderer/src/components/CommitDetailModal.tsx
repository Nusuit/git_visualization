import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommitNode } from "../types";

interface CommitDetailModalProps {
  commit: CommitNode | null;
  onClose: () => void;
}

const CommitDetailModal: React.FC<CommitDetailModalProps> = ({
  commit,
  onClose,
}) => {
  if (!commit) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-dark-200 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden border border-dark-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">📝</div>
              <h2 className="text-xl font-bold text-white">Commit Details</h2>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            {/* Commit Hash */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm font-medium mb-2 block">
                Commit Hash
              </label>
              <div className="flex items-center gap-2">
                <code className="bg-dark-300 text-blue-400 px-4 py-2 rounded-lg font-mono text-sm flex-1">
                  {commit.id}
                </code>
                <button
                  onClick={() => copyToClipboard(commit.id)}
                  className="px-3 py-2 bg-dark-300 hover:bg-dark-400 rounded-lg transition-colors text-gray-300"
                  title="Copy hash"
                >
                  📋
                </button>
              </div>
            </div>

            {/* Commit Message */}
            <div className="mb-6">
              <label className="text-gray-400 text-sm font-medium mb-2 block">
                Message
              </label>
              <div className="bg-dark-300 rounded-lg p-4">
                <p className="text-white text-lg font-medium leading-relaxed">
                  {commit.message}
                </p>
              </div>
            </div>

            {/* Author Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-gray-400 text-sm font-medium mb-2 block">
                  Author
                </label>
                <div className="bg-dark-300 rounded-lg p-3">
                  <p className="text-white font-medium">{commit.author}</p>
                  <p className="text-gray-400 text-sm mt-1">{commit.email}</p>
                </div>
              </div>
              <div>
                <label className="text-gray-400 text-sm font-medium mb-2 block">
                  Date
                </label>
                <div className="bg-dark-300 rounded-lg p-3">
                  <p className="text-white">{formatDate(commit.date)}</p>
                </div>
              </div>
            </div>

            {/* Parent Commits */}
            {commit.parents.length > 0 && (
              <div className="mb-6">
                <label className="text-gray-400 text-sm font-medium mb-2 block">
                  Parent Commit{commit.parents.length > 1 ? "s" : ""}
                  {commit.parents.length > 1 && (
                    <span className="ml-2 px-2 py-1 bg-red-600 text-white text-xs rounded-full">
                      Merge
                    </span>
                  )}
                </label>
                <div className="space-y-2">
                  {commit.parents.map((parent) => (
                    <div key={parent} className="flex items-center gap-2">
                      <code className="bg-dark-300 text-purple-400 px-3 py-2 rounded-lg font-mono text-sm flex-1">
                        {parent}
                      </code>
                      <button
                        onClick={() => copyToClipboard(parent)}
                        className="px-3 py-2 bg-dark-300 hover:bg-dark-400 rounded-lg transition-colors text-gray-300"
                        title="Copy parent hash"
                      >
                        📋
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refs/Branches */}
            {commit.refs && commit.refs.length > 0 && (
              <div className="mb-6">
                <label className="text-gray-400 text-sm font-medium mb-2 block">
                  References
                </label>
                <div className="flex flex-wrap gap-2">
                  {commit.refs.map((ref, index) => {
                    const isHead = ref.includes("HEAD");
                    const isTag = ref.includes("tag:");
                    const isBranch = !isHead && !isTag;

                    return (
                      <span
                        key={index}
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isHead
                            ? "bg-green-600 text-white"
                            : isTag
                            ? "bg-yellow-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {isHead && "👉 "}
                        {isTag && "🏷️ "}
                        {isBranch && "🌿 "}
                        {ref}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="bg-dark-300 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">
                    {commit.parents.length}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Parent(s)</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400">
                    {commit.id.substring(0, 7)}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Short Hash</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">
                    {commit.refs?.length || 0}
                  </div>
                  <div className="text-gray-400 text-sm mt-1">Reference(s)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-dark-300 border-t border-dark-400 flex justify-end gap-2">
            <button
              onClick={() => copyToClipboard(commit.id)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              📋 Copy Hash
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-dark-400 hover:bg-dark-200 text-white rounded-lg transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommitDetailModal;
