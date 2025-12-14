import React, { useState, useMemo } from "react";
import { FileSystemNode, FolderItem, NoteItem } from "../types";

interface SidebarProps {
  rootNode: FileSystemNode;
  onSelect: (note: NoteItem) => void;
  selectedId: string | null;
}

interface SidebarNodeProps {
  node: FileSystemNode;
  onSelect: (note: NoteItem) => void;
  selectedId: string | null;
  depth?: number;
}

// --- Icons ---

const FileIcon = () => (
  <svg
    className="w-4 h-4 mr-2 text-zinc-400 dark:text-zinc-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    />
  </svg>
);

const FolderIcon = ({ open }: { open: boolean }) => (
  <svg
    className={`w-4 h-4 mr-2 text-yellow-500 dark:text-yellow-600 transition-transform ${open ? "rotate-90" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-4 h-4 text-zinc-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const ClearIcon = () => (
  <svg
    className="w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
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

// --- Recursively Search Helper ---

const searchFiles = (node: FileSystemNode, term: string): NoteItem[] => {
  let results: NoteItem[] = [];
  const lowerTerm = term.toLowerCase();

  if (node.type === "file") {
    if (node.name.toLowerCase().includes(lowerTerm)) {
      results.push(node as NoteItem);
    }
  } else {
    (node as FolderItem).children.forEach((child) => {
      results = [...results, ...searchFiles(child, term)];
    });
  }
  return results;
};

// --- Recursive Tree Node Component ---

const SidebarNode: React.FC<SidebarNodeProps> = ({
  node,
  onSelect,
  selectedId,
  depth = 0,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === "file") {
      onSelect(node as NoteItem);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const isSelected = node.id === selectedId;

  return (
    <div className="select-none">
      <div
        onClick={handleSelect}
        className={`flex items-center py-1.5 px-2 cursor-pointer transition-colors text-sm rounded-md
          ${
            isSelected
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          }
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        {node.type === "folder" ? <FolderIcon open={isOpen} /> : <FileIcon />}
        <span className="truncate">{node.name}</span>
      </div>

      {node.type === "folder" &&
        isOpen &&
        (node as FolderItem).children.map((child) => (
          <SidebarNode
            key={child.id}
            node={child}
            onSelect={onSelect}
            selectedId={selectedId}
            depth={depth + 1}
          />
        ))}
    </div>
  );
};

// --- Main Sidebar Component (Exported) ---

export const Sidebar: React.FC<SidebarProps> = ({
  rootNode,
  onSelect,
  selectedId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Flatten logic when searching
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return null;
    return searchFiles(rootNode, searchTerm);
  }, [rootNode, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      {/* Search Input Area */}
      <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-8 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder-zinc-400"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-2 flex items-center cursor-pointer"
            >
              <ClearIcon />
            </button>
          )}
        </div>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
        {filteredResults ? (
          // Search Results
          <div className="space-y-1">
            {filteredResults.length === 0 ? (
              <div className="text-center py-8 text-sm text-zinc-500 dark:text-zinc-500">
                No matching notes found.
              </div>
            ) : (
              filteredResults.map((file) => (
                <div
                  key={file.id}
                  onClick={() => onSelect(file)}
                  className={`flex items-center py-2 px-3 cursor-pointer transition-colors text-sm rounded-md border border-transparent
                    ${
                      file.id === selectedId
                        ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }
                  `}
                >
                  <FileIcon />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{file.name}</span>
                    <span className="text-[10px] text-zinc-400 truncate">
                      {file.path}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          // Standard Tree View
          rootNode.type === "folder" &&
          rootNode.children.map((child) => (
            <SidebarNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))
        )}
      </div>
    </div>
  );
};
