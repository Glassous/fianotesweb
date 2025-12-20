import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  url?: string;
  onClose: () => void;
  duration?: number;
}

const CheckCircleIcon = () => (
  <svg
    className="w-6 h-6 text-green-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export const Toast: React.FC<ToastProps> = ({ message, url, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-20 right-1/2 translate-x-1/2 md:right-4 md:translate-x-0 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-xl rounded-lg p-4 flex items-start gap-3 min-w-[300px] max-w-md">
        <div className="shrink-0 mt-0.5">
          <CheckCircleIcon />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {message}
          </h3>
          {url && (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 break-all bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded border border-zinc-100 dark:border-zinc-800 font-mono">
              {url}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="shrink-0 text-zinc-400 hover:text-zinc-500 dark:hover:text-zinc-300"
        >
          <span className="sr-only">Close</span>
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
