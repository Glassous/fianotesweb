import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { streamChatCompletion, ChatMessage, StreamUpdate, ToolCall, ContentPart, getTextContent } from "../services/openai";
import { RawNoteFile } from "../types";
import { fetchNoteContent } from "../services/github";
import { useTranslation } from "react-i18next";
import i18n from "../i18n";

const STORAGE_KEYS = {
  SESSIONS: "chat_sessions",
  CURRENT_SESSION_ID: "chat_current_session_id",
};

export interface ChatSession {
  id: string;
  title: string;
  timestamp: number;
  messages: ChatMessage[];
}

interface ChatContextType {
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (content: string, contextFiles: RawNoteFile[]) => Promise<void>;
  loadSession: (session: ChatSession) => void;
  clearCurrentSession: () => void;
  deleteSession: (sessionId: string) => void;
  regenerateLastResponse: () => Promise<void>;
  setFileContext: (files: RawNoteFile[]) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const TOOLS = [
  {
    type: "function",
    function: {
      name: "list_files",
      description: "List all available files in the directory. Returns file paths.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the content of a specific file.",
      parameters: {
        type: "object",
        properties: {
          file_path: { type: "string", description: "The path of the file to read." },
        },
        required: ["file_path"],
      },
    },
  },
];

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Ref to track current session ID inside callbacks (streaming)
  const currentSessionIdRef = useRef<string | null>(null);
  
  // Initialize from LocalStorage
  useEffect(() => {
    try {
      const savedSessions = localStorage.getItem(STORAGE_KEYS.SESSIONS);
      let parsedSessions: ChatSession[] = [];
      
      if (savedSessions) {
        parsedSessions = JSON.parse(savedSessions);
        setSessions(parsedSessions);
      }

      const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_SESSION_ID);
      // Requirement: Do not restore the active session on reload. Start fresh.
      // if (savedId) {
      //   setCurrentSessionId(savedId);
      //   currentSessionIdRef.current = savedId;
        
      //   // Load messages for this session
      //   const session = parsedSessions.find(s => s.id === savedId);
      //   if (session) {
      //     setMessages(session.messages);
      //   }
      // }
    } catch (e) {
      console.error("Failed to restore chat session", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Persist Sessions
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
    }
  }, [sessions, isLoaded]);

  // Persist Current Session ID
  useEffect(() => {
    if (isLoaded) {
        if (currentSessionId) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_SESSION_ID, currentSessionId);
        currentSessionIdRef.current = currentSessionId;
        } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
        currentSessionIdRef.current = null;
        }
    }
  }, [currentSessionId, isLoaded]);

  const createNewSession = useCallback((initialMessages: ChatMessage[], title: string) => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title,
      timestamp: Date.now(),
      messages: initialMessages,
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newId);
    setMessages(initialMessages);
    return newId;
  }, []);

  const updateSessionMessages = useCallback((sessionId: string, newMessages: ChatMessage[]) => {
    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        // Update title if it's the first turn and title is generic
        let title = s.title;
        if ((s.title === "New Chat" || s.title.endsWith("...")) && newMessages.length > 0) {
             const firstUser = newMessages.find(m => m.role === "user");
             if (firstUser) {
                 const text = getTextContent(firstUser.content).split("\n\n--- File:")[0];
                 const candidateTitle = text.slice(0, 30) + (text.length > 30 ? "..." : "");
                 if (candidateTitle) title = candidateTitle;
             }
        }
        return { ...s, messages: newMessages, title };
      }
      return s;
    }));
  }, []);

  const fileContextRef = useRef<RawNoteFile[]>([]);
  const selectedContextRef = useRef<RawNoteFile[]>([]);

  const setFileContext = useCallback((files: RawNoteFile[]) => {
    fileContextRef.current = files;
  }, []);

  const executeTool = async (name: string, args: any): Promise<string> => {
    if (name === "list_files") {
      const files = selectedContextRef.current.length > 0 ? selectedContextRef.current : fileContextRef.current;
      const paths = files.map(f => f.filePath);
      return JSON.stringify(paths);
    }
    if (name === "read_file") {
      const filePath = args.file_path;
      const file = (selectedContextRef.current.length > 0 ? selectedContextRef.current : fileContextRef.current)
        .find(f => f.filePath === filePath);
      if (file) {
        let content = file.content;
        
        // If content is missing but we have a blobUrl, fetch it on demand
        if (!content && file.blobUrl) {
            try {
                content = await fetchNoteContent(file.blobUrl);
                // We don't update global state here, but we could cache it locally in the ref if needed.
                // For now, just return it to the AI.
            } catch (e: any) {
                console.error(`Failed to fetch content for ${filePath}`, e);
                return `Error reading file: ${e.message}`;
            }
        }
        
        content = content || "(No Content)";
        return `File Path: ${file.filePath}\nContent:\n${content}`;
      }
      return `File not found: ${filePath}`;
    }
    return "Unknown tool";
  };

  const processChat = async (history: ChatMessage[], sessionId: string) => {
    // Add placeholder for assistant
    const assistantMsgPlaceholder: ChatMessage = { role: "assistant", content: "" };
    let messagesWithAssistant = [...history, assistantMsgPlaceholder];
    setMessages(messagesWithAssistant);
    updateSessionMessages(sessionId, messagesWithAssistant);

    let assistantContent = "";
    let accumulatedToolCalls: any[] = [];
    // We don't display reasoning in the main content for now, or maybe we append it?
    // User requested "Design a UI to intuitively display tool call processes".
    // Reasoning could be part of that. For now, let's just handle content.

    await streamChatCompletion(
      history,
      TOOLS,
      (update) => {
        if (update.content) {
          assistantContent += update.content;
        }
        
        if (update.tool_calls) {
          update.tool_calls.forEach((tc) => {
            if (!accumulatedToolCalls[tc.index]) {
              accumulatedToolCalls[tc.index] = { ...tc, function: { ...tc.function, arguments: "" } };
            } else {
              if (tc.function?.arguments) {
                accumulatedToolCalls[tc.index].function.arguments += tc.function.arguments;
              }
            }
          });
        }

        // Update UI
        setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx].role === "assistant") {
                updated[lastIdx] = { 
                  ...updated[lastIdx], 
                  content: assistantContent,
                  tool_calls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined
                };
            }
            return updated;
        });
        
        // Update session storage
        setSessions(prev => prev.map(s => {
            if (s.id === sessionId) {
                const updatedMsgs = [...s.messages];
                const lastIdx = updatedMsgs.length - 1;
                if (updatedMsgs[lastIdx].role === "assistant") {
                    updatedMsgs[lastIdx] = { 
                      ...updatedMsgs[lastIdx], 
                      content: assistantContent,
                      tool_calls: accumulatedToolCalls.length > 0 ? accumulatedToolCalls : undefined
                    };
                }
                return { ...s, messages: updatedMsgs };
            }
            return s;
        }));
      },
      async () => {
        // On Done
        if (accumulatedToolCalls.length > 0) {
           // Prepare for tool execution
           const finalAssistantMsg: ChatMessage = {
             role: "assistant",
             content: assistantContent || null,
             tool_calls: accumulatedToolCalls
           };

           // Add assistant msg to history (replace placeholder)
           // Actually, the placeholder is already there and updated.
           // We need to append tool results.
           
           const currentHistoryWithAssistant = [...history, finalAssistantMsg];
           let nextHistory = [...currentHistoryWithAssistant];

           for (const toolCall of accumulatedToolCalls) {
             let args = {};
             try {
                args = JSON.parse(toolCall.function.arguments);
             } catch (e) {
                console.error("Failed to parse tool arguments", e);
             }
             
             // Notify UI of tool execution (optional: add a temporary 'status' message or just rely on the tool_calls rendering)
             // Executing...
             
             const result = await executeTool(toolCall.function.name, args);
             
             nextHistory.push({
               role: "tool",
               tool_call_id: toolCall.id,
               name: toolCall.function.name,
               content: result
             });
           }

           // Update UI with tool results
           setMessages(nextHistory);
           updateSessionMessages(sessionId, nextHistory);
           
           // Recursively call AI with tool results
           await processChat(nextHistory, sessionId);
        } else {
           setIsLoading(false);
        }
      },
      (err) => {
        console.error(err);
        const errorMsg = `\n\n${t('copilot.errorPrefix')}${err.message}`;
        assistantContent += errorMsg;
        // Update UI with error
        setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = { ...updated[lastIdx], content: assistantContent };
            return updated;
        });
        updateSessionMessages(sessionId, [...history, { role: "assistant", content: assistantContent }]);
        setIsLoading(false);
      }
    );
  };

  const sendMessage = useCallback(async (content: string, contextFiles: RawNoteFile[]) => {
    if (isLoading) return;

    let messageContent: string | ContentPart[] = content;

    if (contextFiles.length > 0) {
      selectedContextRef.current = contextFiles;
      
      const parts: ContentPart[] = [];
      if (content) {
          parts.push({ type: "text", text: content });
      }

      contextFiles.forEach(f => {
          const isDataUrl = f.content?.startsWith("data:");
          if (isDataUrl && f.content) {
              parts.push({
                  type: "image_url",
                  image_url: { url: f.content }
              });
          } else {
              parts.push({
                  type: "text",
                  text: `\n\n<document name="${f.filePath}">\n${f.content || "(No Content)"}\n</document>`
              });
          }
      });
      messageContent = parts;
    }

    const userMsg: ChatMessage = { role: "user", content: messageContent };
    
    let activeId = currentSessionIdRef.current;
    let currentMsgs = messages;

    // If no session, create one
    if (!activeId) {
      let titleText = "";
      if (typeof messageContent === "string") {
          titleText = messageContent;
      } else {
          const textPart = messageContent.find(p => p.type === "text") as { type: "text"; text: string } | undefined;
          titleText = textPart?.text || "New Chat";
      }
      const title = titleText.slice(0, 30) + (titleText.length > 30 ? "..." : "");
      
      currentMsgs = [userMsg];
      activeId = createNewSession(currentMsgs, title);
    } else {
      currentMsgs = [...messages, userMsg];
      setMessages(currentMsgs);
      updateSessionMessages(activeId, currentMsgs);
    }

    setIsLoading(true);
    
    await processChat(currentMsgs, activeId);

  }, [isLoading, messages, updateSessionMessages, processChat]);

  const regenerateLastResponse = useCallback(async () => {
    if (isLoading || messages.length === 0) return;
    
    const activeId = currentSessionIdRef.current;
    if (!activeId) return;

    // 1. Prepare history: remove last assistant message if present
    let historyToUse = [...messages];
    const lastMsg = historyToUse[historyToUse.length - 1];
    
    if (lastMsg.role === "assistant") {
        historyToUse.pop();
    } else if (lastMsg.role !== "user" && lastMsg.role !== "tool") {
        return; 
    }

    // Update state to remove the old assistant message (if any)
    setMessages(historyToUse);
    updateSessionMessages(activeId, historyToUse);

    setIsLoading(true);
    await processChat(historyToUse, activeId);
  }, [isLoading, messages, updateSessionMessages, processChat]);

  const loadSession = useCallback((session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    selectedContextRef.current = [];
  }, []);

  const clearCurrentSession = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
    selectedContextRef.current = [];
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionIdRef.current === sessionId) {
      clearCurrentSession();
    }
  }, [clearCurrentSession]);

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSessionId,
        messages,
        isLoading,
        sendMessage,
        loadSession,
        clearCurrentSession,
        deleteSession,
        regenerateLastResponse,
        setFileContext,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
