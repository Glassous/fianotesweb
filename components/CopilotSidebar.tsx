import React, { useEffect, useRef, useState } from "react";
import { RawNoteFile, FileSystemNode, FolderItem, ChatSession } from "../types";
import { ChatMessage } from "../services/openai";
import { fetchNoteContent } from "../services/github";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useChatContext } from "../contexts/ChatContext";
import { LoadingAnimation } from "./LoadingAnimation";

// --- Icons ---
const SparklesIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
  </svg>
);

const SendIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
    />
  </svg>
);

const PaperClipIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 4v16m8-8H4"
    />
  </svg>
);

const HistoryIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    className="w-6 h-6"
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

const FileIcon = () => (
  <svg
    className="w-4 h-4"
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

const XMarkIcon = () => (
  <svg
    className="w-3 h-3"
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

const ChevronLeftIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 19l-7-7 7-7"
      />
    </svg>
  );

const FolderIcon = ({ open }: { open: boolean }) => (
  <svg
    className="w-4 h-4 text-yellow-500"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d={open 
      ? "M2 6a2 2 0 012-2h4l2 2h10a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" 
      : "M2 5a2 2 0 012-2h4l2 2h10a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z"} 
    />
  </svg>
);

// --- Component ---

// Recursive File Picker Node
const FilePickerNode: React.FC<{
  node: FileSystemNode;
  onSelect: (path: string) => void;
  depth?: number;
}> = ({ node, onSelect, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(depth === 0 && node.name.toLowerCase() !== "home"); // Auto-expand root unless it's the hidden home
  
  // Special handling: if this node is "home" and we are at root depth, render its children directly
  if (depth === 0 && node.name.toLowerCase() === "home" && node.type === "folder") {
      return (
          <>
            {(node as FolderItem).children.map((child) => (
                <FilePickerNode key={child.id} node={child} onSelect={onSelect} depth={0} />
            ))}
          </>
      );
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === "file") {
      onSelect(node.path);
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="select-none">
      <div 
        onClick={handleClick}
        className="flex items-center py-1.5 px-2 cursor-pointer transition-colors text-sm rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <div className="mr-2">
            {node.type === "folder" ? <FolderIcon open={isOpen} /> : <FileIcon />}
        </div>
        <span className="truncate">{node.name}</span>
      </div>
      {node.type === "folder" && isOpen && (node as FolderItem).children.map((child) => (
        <FilePickerNode key={child.id} node={child} onSelect={onSelect} depth={depth + 1} />
      ))}
    </div>
  );
};

interface CopilotSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  notes: RawNoteFile[];
  fileTree?: FileSystemNode;
  activeNote?: RawNoteFile;
  isMobile: boolean;
  isDarkMode: boolean;
  width?: number;
  onResizeStart?: (e: React.MouseEvent) => void;
  containerRef?: React.RefObject<HTMLElement>;
  onNoteContentLoad?: (filePath: string, content: string) => void;
}

export const CopilotSidebar: React.FC<CopilotSidebarProps> = ({
  isOpen,
  onClose,
  notes,
  fileTree,
  activeNote,
  isMobile,
  isDarkMode,
  width = 320,
  onResizeStart,
  containerRef,
  onNoteContentLoad,
}) => {
  const { 
    sessions, 
    currentSessionId, 
    messages, 
    isLoading, 
    sendMessage, 
    loadSession: hookLoadSession, 
    clearCurrentSession, 
    deleteSession: hookDeleteSession,
    regenerateLastResponse 
  } = useChatContext();

  const [input, setInput] = useState("");
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const [selectedContextFiles, setSelectedContextFiles] = useState<RawNoteFile[]>([]);
  
  // Refs
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true); // Tracks if user is at the bottom
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // History State
  const [showHistory, setShowHistory] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; sessionId: string | null }>({
    isOpen: false,
    sessionId: null,
  });

  // Compute files already in history to prevent duplicate "Add current file" suggestions
  const filesInHistory = React.useMemo(() => {
    const files = new Set<string>();
    messages.forEach(msg => {
      if (msg.role !== 'user') return;
      
      // Check for new format
      const parts = msg.content.split("\n\nReference Documents:");
      if (parts.length > 1) {
        const docsSection = parts[1];
        const regex = /<document name="(.*?)">/g;
        let match;
        while ((match = regex.exec(docsSection)) !== null) {
            files.add(match[1]);
        }
      }

      // Check for legacy format fallback
      const legacyParts = msg.content.split("\n\n--- File: ");
      if (legacyParts.length > 1) {
          legacyParts.slice(1).forEach(part => {
              const path = part.split(" ---\n")[0];
              if (path) files.add(path);
          });
      }
    });
    return files;
  }, [messages]);

  // --- Core Fix: Safe Auto-Scrolling ---
  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
        // Direct manipulation of scrollTop does not affect global page layout
        const container = messagesContainerRef.current;
        container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    // Only scroll if tracking is active (user hasn't scrolled up)
    if (!showHistory && isAtBottomRef.current) {
        // Use requestAnimationFrame to sync with render cycles
        requestAnimationFrame(() => {
            scrollToBottom();
        });
    }
  }, [messages, isLoading, showHistory]);

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    
    // If the distance to the bottom is small (< 20px), we consider it "at bottom"
    // If user scrolls up significantly, this becomes false, and auto-scroll pauses.
    const isBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 20;
    isAtBottomRef.current = isBottom;
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const tempNote: RawNoteFile = {
          filePath: `Local: ${file.name}`,
          content: content,
          metadata: { title: file.name }
      };
      addFileContext(tempNote);
      setIsSelectingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() && selectedContextFiles.length === 0) return;
    if (isLoading || isDownloading) return;

    const content = input;
    
    // Fetch content for selected files if missing
    const needsFetch = selectedContextFiles.some(file => !file.content && file.blobUrl);
    
    let files = selectedContextFiles;

    if (needsFetch) {
        setIsDownloading(true);
        try {
            files = await Promise.all(selectedContextFiles.map(async (file) => {
                if (!file.content && file.blobUrl) {
                    try {
                        const text = await fetchNoteContent(file.blobUrl);
                        if (onNoteContentLoad) {
                            onNoteContentLoad(file.filePath, text);
                        }
                        return { ...file, content: text };
                    } catch (e) {
                        console.error("Failed to fetch context content for", file.filePath, e);
                        return { ...file, content: "(Failed to load content)" };
                    }
                }
                return file;
            }));
        } catch (err) {
            console.error("Error during file download", err);
        } finally {
            setIsDownloading(false);
        }
    }
    
    setInput("");
    setSelectedContextFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    // When sending, force snap to bottom and re-enable auto-tracking
    isAtBottomRef.current = true;
    scrollToBottom();

    await sendMessage(content, files);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
      clearCurrentSession();
      setSelectedContextFiles([]);
      if (isMobile) {
          // close keyboard?
      }
  };

  const loadSession = (session: ChatSession) => {
      hookLoadSession(session);
      setShowHistory(false);
      setSelectedContextFiles([]);
      isAtBottomRef.current = true; // Reset scroll tracking
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm("Delete this chat?")) {
          hookDeleteSession(id);
      }
  };

  const addFileContext = (file: RawNoteFile) => {
    if (!selectedContextFiles.some(f => f.filePath === file.filePath)) {
      setSelectedContextFiles([...selectedContextFiles, file]);
    }
    setIsSelectingFile(false);
  };

  const handleFileSelect = (path: string) => {
      const note = notes.find(n => n.filePath === path);
      if (note) {
          addFileContext(note);
      }
  };

  const removeFileContext = (filePath: string) => {
    setSelectedContextFiles(selectedContextFiles.filter(f => f.filePath !== filePath));
  };

  // Filter notes for file picker
  const [fileSearch, setFileSearch] = useState("");
  const filteredNotes = notes.filter(n => 
    n.filePath.toLowerCase().includes(fileSearch.toLowerCase())
  );

  const containerClasses = isMobile
    ? `fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl transition-transform duration-300 rounded-t-2xl flex flex-col h-[85vh] ${isOpen ? "translate-y-0" : "translate-y-full"}`
    : `bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden transition-all duration-300 relative`;

  const desktopStyle = isMobile ? {} : {
    width: width,
    marginRight: isOpen ? 0 : -width,
    visibility: isOpen ? 'visible' as const : 'hidden' as const
  };

  const renderUserMessage = (content: string) => {
    // New format: Text + \n\nReference Documents: + XML docs
    const parts = content.split("\n\nReference Documents:");
    const userText = parts[0];
    const docsSection = parts[1];
    
    let files: { path: string }[] = [];
    
    if (docsSection) {
        // Regex to extract file paths from <document name="...">
        const regex = /<document name="(.*?)">/g;
        let match;
        while ((match = regex.exec(docsSection)) !== null) {
            files.push({ path: match[1] });
        }
    } else {
        // Legacy fallback
        const legacyParts = content.split("\n\n--- File: ");
        if (legacyParts.length > 1) {
             return (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                        {legacyParts.slice(1).map((part, i) => {
                             const path = part.split(" ---\n")[0];
                             return (
                                <div key={i} className="flex items-center gap-1.5 bg-blue-700/50 border border-blue-500/30 px-2 py-1.5 rounded text-xs text-blue-100">
                                    <FileIcon />
                                    <span className="truncate max-w-[150px]">{path?.split('/').pop()}</span>
                                </div>
                             )
                        })}
                    </div>
                    <div className="whitespace-pre-wrap">{legacyParts[0]}</div>
                </div>
             );
        }
    }
    
    return (
        <div className="flex flex-col gap-2">
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {files.map((f, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-blue-700/50 border border-blue-500/30 px-2 py-1.5 rounded text-xs text-blue-100">
                            <FileIcon />
                            <span className="truncate max-w-[150px]">{f.path?.split('/').pop()}</span>
                        </div>
                    ))}
                </div>
            )}
            <div className="whitespace-pre-wrap">{userText}</div>
        </div>
    );
  };

  return (
    <>
       {/* Overlay for Mobile */}
       {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40"
          onClick={onClose}
        />
      )}

      <aside 
        ref={containerRef}
        className={`${containerClasses}`} 
        style={desktopStyle}
      >
        {/* Resizer Handle (Desktop) */}
        {!isMobile && isOpen && (
          <div
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-50 hover:bg-blue-500/50 transition-colors"
            onMouseDown={onResizeStart}
          />
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-100 dark:border-zinc-800 shrink-0 h-16">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-100 font-semibold">
            {showHistory ? (
                <button onClick={() => setShowHistory(false)} className="hover:text-blue-500 flex items-center gap-1">
                    <ChevronLeftIcon />
                    <span>Back</span>
                </button>
            ) : (
                <>
                    <SparklesIcon />
                    <span>Fia Copilot</span>
                </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!showHistory && (
                <>
                    {messages.length > 0 && (
                        <button
                        onClick={handleNewChat}
                        className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                        title="New Chat"
                        >
                        <PlusIcon />
                        </button>
                    )}
                    <button
                    onClick={() => setShowHistory(true)}
                    className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                    title="History"
                    >
                    <HistoryIcon />
                    </button>
                </>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors ml-1"
            >
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
            {showHistory ? (
                // History List
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {sessions.length === 0 ? (
                        <div className="text-center text-zinc-400 mt-10 text-sm">No history yet</div>
                    ) : (
                        sessions.map(session => (
                            <div 
                                key={session.id} 
                                onClick={() => loadSession(session)}
                                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${currentSessionId === session.id ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"}`}
                            >
                                <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">{session.title || "Untitled Chat"}</span>
                                    <span className="text-xs text-zinc-400">{new Date(session.timestamp).toLocaleDateString()}</span>
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteConfirmation({ isOpen: true, sessionId: session.id });
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-opacity"
                                >
                                    <XMarkIcon />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                // Chat Area
                <>
                     {/* Messages */}
                    <div 
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto p-4 space-y-4 relative min-h-0"
                    >
                        {messages.length === 0 && (
                            <div className="text-center text-zinc-400 dark:text-zinc-500 mt-10 text-sm">
                            <p>Start a conversation with Fia Copilot.</p>
                            <p className="mt-2">You can add notes to context.</p>
                            </div>
                        )}
                        {messages.map((msg, idx) => (
                            <div
                            key={idx}
                            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                            >
                                {msg.role === "user" ? (
                    <div className="max-w-[90%] rounded-lg p-3 text-sm bg-blue-600 text-white">
                        {renderUserMessage(msg.content)}
                    </div>
                ) : (
                    <div className="w-full text-sm text-zinc-800 dark:text-zinc-200 px-1">
                        <MarkdownRenderer content={msg.content} isDark={isDarkMode} variant="chat" />
                        <div className="flex items-center gap-3 mt-2 select-none">
                            <button 
                                onClick={() => handleCopy(msg.content)}
                                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                                title="Copy"
                            >
                                <ClipboardIcon />
                                <span>Copy</span>
                            </button>
                            {idx === messages.length - 1 && (
                                <button 
                                    onClick={regenerateLastResponse}
                                    disabled={isLoading}
                                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-blue-500 transition-colors disabled:opacity-50"
                                    title="Regenerate"
                                >
                                    <RefreshIcon />
                                    <span>Regenerate</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}
                            </div>
                        ))}
                        {/* No refs here, scrolling is handled via scrollTop */}
                    </div>

                    {/* Input Area + File Picker Wrapper */}
                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900 relative z-30">
                        
                        {/* Download Indicator */}
                        {isDownloading && (
                             <div className="absolute -top-8 left-0 right-0 flex justify-center">
                                 <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                                     <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                     </svg>
                                     Downloading file content...
                                 </div>
                             </div>
                        )}

                        {/* File Selection Bottom Sheet - Positioned Absolutely ABOVE the input area */}
                        {isSelectingFile && (
                            <div className="absolute bottom-full left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.15)] z-20 flex flex-col max-h-[300px] rounded-t-xl animate-in slide-in-from-bottom-5 duration-200">
                                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                                    <span className="text-xs font-semibold uppercase text-zinc-500">Select File</span>
                                    <button onClick={() => setIsSelectingFile(false)} className="text-zinc-400 hover:text-zinc-600"><XMarkIcon /></button>
                                </div>
                                <div className="p-2 shrink-0 space-y-2">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleLocalFileUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors border border-dashed border-zinc-300 dark:border-zinc-600"
                                    >
                                        <span className="text-lg leading-none">+</span> Upload Local File
                                    </button>
                                    {!fileTree && (
                                        <input 
                                            type="text" 
                                            placeholder="Search files..." 
                                            className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-md px-3 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                            value={fileSearch}
                                            onChange={e => setFileSearch(e.target.value)}
                                            autoFocus
                                        />
                                    )}
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                    {fileTree ? (
                                        <FilePickerNode node={fileTree} onSelect={handleFileSelect} />
                                    ) : (
                                        <>
                                        {filteredNotes.map(note => (
                                            <button
                                            key={note.filePath}
                                            onClick={() => addFileContext(note)}
                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors"
                                            >
                                            <FileIcon />
                                            <span className="truncate">{note.filePath}</span>
                                            </button>
                                        ))}
                                        {filteredNotes.length === 0 && (
                                            <div className="p-4 text-center text-zinc-400 text-xs">No matching files</div>
                                        )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Suggest Adding Active Note */}
                        {!isSelectingFile && activeNote && !selectedContextFiles.some(f => f.filePath === activeNote.filePath) && !filesInHistory.has(activeNote.filePath) && (
                            <button 
                                onClick={() => addFileContext(activeNote)}
                                className="flex items-center gap-1.5 mb-2 px-1 text-xs text-blue-600 dark:text-blue-400 hover:underline transition-colors w-full text-left"
                            >
                                <PlusIcon />
                                <span className="truncate">Add current file: {activeNote.filePath.split('/').pop()}</span>
                            </button>
                        )}

                        {/* Selected Files Context */}
                        {selectedContextFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                            {selectedContextFiles.map(f => (
                                <span key={f.filePath} className="flex items-center gap-1 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                                <FileIcon />
                                <span className="max-w-[120px] truncate">{f.filePath.split('/').pop()}</span>
                                <button onClick={() => removeFileContext(f.filePath)} className="hover:text-red-500">
                                    <XMarkIcon />
                                </button>
                                </span>
                            ))}
                            </div>
                        )}

                        <div className="relative flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-xl transition-all">
                            <button
                            onClick={() => setIsSelectingFile(!isSelectingFile)}
                            className={`p-2 rounded-lg transition-colors shrink-0 h-9 w-9 flex items-center justify-center ${isSelectingFile ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"}`}
                            title="Add context from file"
                            >
                            <PaperClipIcon />
                            </button>
                            
                            <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask anything..."
                            className="flex-1 bg-transparent border-none focus:ring-0 outline-none resize-none max-h-32 min-h-[24px] py-1.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 leading-relaxed"
                            rows={1}
                            />
                            
                            <button
                            onClick={handleSend}
                            disabled={isLoading || (!input.trim() && selectedContextFiles.length === 0)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 h-9 w-9 flex items-center justify-center transition-colors"
                            >
                            {isLoading ? <LoadingAnimation size="sm" color="bg-white" /> : <SendIcon />}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Delete Confirmation Overlay */}
            {deleteConfirmation.isOpen && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-[2px] p-4">
                    <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-zinc-200 dark:border-zinc-700 p-4 w-full max-w-[280px] animate-in zoom-in-95 duration-200">
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Delete Chat History?</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">This action cannot be undone.</p>
                        <div className="flex gap-2 justify-end">
                            <button 
                                onClick={() => setDeleteConfirmation({ isOpen: false, sessionId: null })}
                                className="px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={(e) => {
                                    if (deleteConfirmation.sessionId) {
                                        hookDeleteSession(deleteConfirmation.sessionId);
                                    }
                                    setDeleteConfirmation({ isOpen: false, sessionId: null });
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </aside>
    </>
  );
};