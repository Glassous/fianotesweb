import React, { useState } from "react";
import { OutlineItem } from "../types";

interface OutlineViewProps {
  items: OutlineItem[];
  onHeadingClick: (id: string) => void;
}

interface OutlineNodeProps {
  item: OutlineItem;
  onHeadingClick: (id: string) => void;
}

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-3 h-3 text-zinc-400 transition-transform ${open ? "rotate-90" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 5l7 7-7 7"
    />
  </svg>
);

const OutlineNode: React.FC<OutlineNodeProps> = ({ item, onHeadingClick }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHeadingClick(item.id);
  };

  return (
    <div className="select-none">
      <div
        className="flex items-center py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded cursor-pointer text-sm text-zinc-600 dark:text-zinc-400"
        style={{ paddingLeft: `${(item.level - 1) * 12 + 8}px` }}
        onClick={handleClick}
      >
        <div
          className="w-4 h-4 flex items-center justify-center mr-1 cursor-pointer"
          onClick={hasChildren ? handleToggle : undefined}
        >
          {hasChildren && <ChevronIcon open={isOpen} />}
        </div>
        <span className="truncate">{item.text}</span>
      </div>
      {hasChildren && isOpen && (
        <div>
          {item.children.map((child) => (
            <OutlineNode
              key={child.id}
              item={child}
              onHeadingClick={onHeadingClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const OutlineView: React.FC<OutlineViewProps> = ({ items, onHeadingClick }) => {
  if (items.length === 0) {
    return (
      <div className="p-4 text-sm text-zinc-400 text-center">
        No headings found
      </div>
    );
  }

  return (
    <div className="flex flex-col py-2">
      {items.map((item) => (
        <OutlineNode key={item.id} item={item} onHeadingClick={onHeadingClick} />
      ))}
    </div>
  );
};
