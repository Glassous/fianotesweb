import React, { useEffect, useRef, useState } from "react";
import { RawNoteFile, FileSystemNode, FolderItem, ChatSession } from "../types";
import { ChatMessage } from "../services/openai";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { useChatContext } from "../contexts/ChatContext";

// --- Icons ---
const StarIcon = () => (
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
      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
    />
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
  const [isOpen, setIsOpen] = useState(false);
  
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
}

export const CopilotSidebar: React.FC<CopilotSidebarProps> = ({
  isOpen,
  onClose,
  notes,
  fileTree,
  activeNote,
  isMobile,
  isDarkMode,
}) => {
  const { 
    sessions, 
    currentSessionId, 
    messages, 
    isLoading, 
    sendMessage, 
    loadSession: hookLoadSession, 
    clearCurrentSession, 
    deleteSession: hookDeleteSession 
  } = useChatContext();

  const [input, setInput] = useState("");
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const [selectedContextFiles, setSelectedContextFiles] = useState<RawNoteFile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // History State
  const [showHistory, setShowHistory] = useState(false);

  // Auto-attach active note logic
  useEffect(() => {
    if (isOpen && activeNote && messages.length === 0 && selectedContextFiles.length === 0 && !currentSessionId) {
        setSelectedContextFiles([activeNote]);
    }
  }, [isOpen, activeNote, currentSessionId, messages.length]);

  // Scroll to bottom
  useEffect(() => {
    if (!showHistory) {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, showHistory]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() && selectedContextFiles.length === 0) return;
    if (isLoading) return;

    const content = input;
    const files = [...selectedContextFiles];
    
    // Clear input immediately for better UX
    setInput("");
    setSelectedContextFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    await sendMessage(content, files);
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

  // Filter notes for file picker (legacy flat list if no tree)
  const [fileSearch, setFileSearch] = useState("");
  const filteredNotes = notes.filter(n => 
    n.filePath.toLowerCase().includes(fileSearch.toLowerCase())
  );

  const containerClasses = isMobile
    ? `fixed inset-x-0 bottom-0 z-50 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-2xl transition-transform duration-300 rounded-t-2xl flex flex-col h-[85vh] ${isOpen ? "translate-y-0" : "translate-y-full"}`
    : `w-80 bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 flex flex-col h-full overflow-hidden transition-all duration-300 ${isOpen ? "mr-0" : "-mr-80 hidden"}`;

  const renderUserMessage = (content: string) => {
    const parts = content.split("\n\n--- File: ");
    const userText = parts[0];
    const files = parts.slice(1).map(part => {
        const firstLineBreak = part.indexOf(" ---\n");
        if (firstLineBreak === -1) return null;
        const path = part.substring(0, firstLineBreak);
        return path;
    }).filter(Boolean);
    
    return (
        <div className="flex flex-col gap-2">
            {files.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {files.map((path, i) => (
                        <div key={i} className="flex items-center gap-1.5 bg-blue-700/50 border border-blue-500/30 px-2 py-1.5 rounded text-xs text-blue-100">
                            <FileIcon />
                            <span className="truncate max-w-[150px]">{path?.split('/').pop()}</span>
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

      <aside className={containerClasses}>
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
                    <StarIcon />
                    <span>Fia Copilot</span>
                </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!showHistory && (
                <>
                    <button
                    onClick={handleNewChat}
                    className="p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                    title="New Chat"
                    >
                    <PlusIcon />
                    </button>
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
                                    onClick={(e) => deleteSession(e, session.id)}
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
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 relative min-h-0">
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
                            <div
                                className={`max-w-[90%] rounded-lg p-3 text-sm ${
                                msg.role === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200"
                                }`}
                            >
                                {msg.role === "user" ? (
                                    renderUserMessage(msg.content)
                                ) : (
                                <MarkdownRenderer content={msg.content} isDark={isDarkMode} variant="chat" />
                                )}
                            </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                        
                        {/* File Selection Bottom Sheet (Internal) */}
                        {isSelectingFile && (
                            <div className="absolute inset-x-0 bottom-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-10 flex flex-col max-h-[60vh] animate-in slide-in-from-bottom-10 duration-200 rounded-t-xl">
                                <div className="p-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
                                    <span className="text-xs font-semibold uppercase text-zinc-500">Select File</span>
                                    <button onClick={() => setIsSelectingFile(false)} className="text-zinc-400 hover:text-zinc-600"><XMarkIcon /></button>
                                </div>
                                <div className="p-2 shrink-0">
                                    {/* Only show search if using flat list or if we want to filter tree? For now simple input for flat list fallback or tree filter (not implemented yet for tree) */}
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
                    </div>

                    {/* Input Area */}
                    <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
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

                        <div className="relative flex items-center gap-2 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
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
                            className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[24px] py-1.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 leading-relaxed"
                            rows={1}
                            />
                            
                            <button
                            onClick={handleSend}
                            disabled={isLoading || (!input.trim() && selectedContextFiles.length === 0)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 h-9 w-9 flex items-center justify-center transition-colors"
                            >
                            <SendIcon />
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
      </aside>
    </>
  );
};
