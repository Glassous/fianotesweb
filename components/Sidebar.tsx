import React, { useState, useMemo } from "react";
import { FileSystemNode, FolderItem, NoteItem, OutlineItem } from "../types";
import { OutlineView } from "./OutlineView";
import { FolderIcon, getFileIcon } from "./FileIcons";

interface SidebarProps {
  rootNode: FileSystemNode;
  onSelect: (note: NoteItem) => void;
  selectedId: string | null;
  isLoading?: boolean;
  onRefresh?: () => void;
  outlineItems?: OutlineItem[];
  showOutline?: boolean;
  activeTab?: "files" | "outline";
  onTabChange?: (tab: "files" | "outline") => void;
  onHeadingClick?: (id: string) => void;
}

interface SidebarNodeProps {
  node: FileSystemNode;
  onSelect: (note: NoteItem) => void;
  selectedId: string | null;
  depth?: number;
}

// --- Icons ---

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

const RefreshIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    className={`w-4 h-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-transform ${spinning ? "animate-spin" : ""}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
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
  const [isOpen, setIsOpen] = useState(false);

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
        {node.type === "folder" ? (
          <FolderIcon open={isOpen} className="mr-2" />
        ) : (
          getFileIcon(node.name, "mr-2")
        )}
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
  isLoading = false,
  onRefresh,
  outlineItems = [],
  showOutline = false,
  activeTab = "files",
  onTabChange,
  onHeadingClick,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // Flatten logic when searching
  const filteredResults = useMemo(() => {
    if (!searchTerm.trim()) return null;
    return searchFiles(rootNode, searchTerm);
  }, [rootNode, searchTerm]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tabs */}
      {showOutline && (
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0">
          <button
            onClick={() => onTabChange && onTabChange("files")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === "files"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Files
          </button>
          <button
            onClick={() => onTabChange && onTabChange("outline")}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === "outline"
                ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
                : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            Outline
          </button>
        </div>
      )}

      {/* Content */}
      {activeTab === "files" ? (
        <>
          {/* Search Input Area */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10 flex gap-2">
            <div className="relative flex-1">
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
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                title="Refresh list"
                disabled={isLoading}
              >
                <RefreshIcon spinning={isLoading} />
              </button>
            )}
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar relative min-h-0">
            {isLoading && !filteredResults && (
              <div className="absolute inset-0 z-20 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-[1px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-zinc-200 border-b-blue-500"></div>
              </div>
            )}
            
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
                      {getFileIcon(file.name, "mr-2")}
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
        </>
      ) : (
        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar relative min-h-0">
          <OutlineView
            items={outlineItems}
            onHeadingClick={onHeadingClick || (() => {})}
          />
        </div>
      )}
    </div>
  );
};
