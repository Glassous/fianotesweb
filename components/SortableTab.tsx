import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getFileIcon } from './FileIcons';

// Reusing the CloseIcon from App.tsx (we might need to export it or duplicate it)
// Ideally, we should export common icons. For now, I'll duplicate it to be safe and self-contained.
const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className || "w-6 h-6 text-zinc-600 dark:text-zinc-300"}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M6 18L18 6M6 6l12 12"
    />
  </svg>
);

interface SortableTabProps {
  id: string;
  path: string;
  isActive: boolean;
  onNavigate: (path: string) => void;
  onClose: (e: React.MouseEvent, path: string) => void;
  isLast?: boolean;
  nextIsActive?: boolean;
}

export const SortableTab = React.memo(({
  id,
  path,
  isActive,
  onNavigate,
  onClose,
  isLast,
  nextIsActive
}: SortableTabProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : (isActive ? 10 : 'auto'),
    opacity: isDragging ? 0.5 : 1,
  };

  const fileName = path.split('/').pop()?.replace(/\.[^/.]+$/, "");

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onNavigate(path)}
      className={`
          group relative flex items-center min-w-[100px] max-w-[200px] flex-1 h-9 px-3 
          rounded-t-lg cursor-pointer select-none
          ${isActive 
             ? 'bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100' 
             : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-300/50 dark:hover:bg-zinc-800/50 hover:text-zinc-700 dark:hover:text-zinc-200'}
      `}
    >
      {/* Separator (only for inactive tabs and not the last one) */}
      {!isActive && !isLast && !nextIsActive && (
        <div className="absolute right-0 top-2 bottom-2 w-px bg-zinc-300 dark:bg-zinc-700 group-hover:hidden" />
      )}

      {/* Icon */}
      <div className="mr-2 shrink-0 opacity-80">
        {getFileIcon(path, "w-4 h-4")}
      </div>

      {/* Title */}
      <span className="truncate text-xs font-medium flex-1 pb-0.5">{fileName}</span>
      
      {/* Close Button */}
      <button
        onClick={(e) => onClose(e, path)}
        className={`ml-1 p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking close
      >
          <CloseIcon className="w-3 h-3" />
      </button>
    </div>
  );
});
