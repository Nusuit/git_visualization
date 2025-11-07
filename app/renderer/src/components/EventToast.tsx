import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ToastItem } from "../types";

interface EventToastProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

const EventToast: React.FC<EventToastProps> = ({ toasts, onRemove }) => {
  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, 5000);

      return () => clearTimeout(timer);
    });
  }, [toasts, onRemove]);

  const getToastStyles = (type: string) => {
    switch (type) {
      case "success":
        return "bg-green-600 border-green-500";
      case "error":
        return "bg-red-600 border-red-500";
      case "warning":
        return "bg-yellow-600 border-yellow-500";
      case "info":
      default:
        return "bg-blue-600 border-blue-500";
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      case "info":
      default:
        return "ℹ";
    }
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className={`${getToastStyles(
              toast.type
            )} border-l-4 rounded-lg shadow-xl p-4 flex items-start gap-3 cursor-pointer pointer-events-auto`}
            onClick={() => onRemove(toast.id)}
          >
            <div className="text-2xl flex-shrink-0">{getIcon(toast.type)}</div>
            <div className="flex-1">
              <p className="text-white font-medium">{toast.message}</p>
            </div>
            <button
              className="text-white hover:text-gray-300 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onRemove(toast.id);
              }}
            >
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default EventToast;
