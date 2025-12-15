import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ChatMessage, streamChatCompletion } from "../services/openai";
import { ChatSession, RawNoteFile } from "../types";

const STORAGE_KEYS = {
  SESSIONS: "fia_copilot_sessions",
  CURRENT_SESSION_ID: "fia_copilot_current_session_id",
};

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
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

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
                 const text = firstUser.content.split("\n\n--- File:")[0];
                 const candidateTitle = text.slice(0, 30) + (text.length > 30 ? "..." : "");
                 if (candidateTitle) title = candidateTitle;
             }
        }
        return { ...s, messages: newMessages, title };
      }
      return s;
    }));
  }, []);

  const sendMessage = useCallback(async (content: string, contextFiles: RawNoteFile[]) => {
    if (isLoading) return;

    let userContent = content;
    if (contextFiles.length > 0) {
      // Use XML-style tags for better context recognition (OpenAI RAG standard)
      const contextStr = contextFiles
        .map(f => `\n\n<document name="${f.filePath}">\n${f.content || "(No Content)"}\n</document>`)
        .join("");
      userContent += `\n\nReference Documents:${contextStr}`;
    }

    const userMsg: ChatMessage = { role: "user", content: userContent };
    
    let activeId = currentSessionIdRef.current;
    let currentMsgs = messages;

    // If no session, create one
    if (!activeId) {
      const title = userContent.slice(0, 30) + (userContent.length > 30 ? "..." : "");
      currentMsgs = [userMsg];
      activeId = createNewSession(currentMsgs, title);
    } else {
      currentMsgs = [...messages, userMsg];
      setMessages(currentMsgs);
      updateSessionMessages(activeId, currentMsgs);
    }

    setIsLoading(true);
    
    // Add placeholder for assistant
    const assistantMsgPlaceholder: ChatMessage = { role: "assistant", content: "" };
    let messagesWithAssistant = [...currentMsgs, assistantMsgPlaceholder];
    setMessages(messagesWithAssistant);
    
    updateSessionMessages(activeId, messagesWithAssistant);

    let assistantContent = "";

    await streamChatCompletion(
      currentMsgs, // Send ONLY user/system messages to API (not the empty assistant one)
      (chunk) => {
        assistantContent += chunk;
        
        // Functional update to avoid closure staleness
        setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx].role === "assistant") {
                updated[lastIdx] = { ...updated[lastIdx], content: assistantContent };
            }
            return updated;
        });

        // Also update the session storage live
        setSessions(prev => prev.map(s => {
            if (s.id === activeId) {
                const updatedMsgs = [...s.messages];
                const lastIdx = updatedMsgs.length - 1;
                if (updatedMsgs[lastIdx].role === "assistant") {
                    updatedMsgs[lastIdx] = { ...updatedMsgs[lastIdx], content: assistantContent };
                } else {
                     updatedMsgs.push({ role: "assistant", content: assistantContent });
                }
                return { ...s, messages: updatedMsgs };
            }
            return s;
        }));
      },
      () => {
        setIsLoading(false);
      },
      (err) => {
        console.error(err);
        const errorMsg = `\n\n${t('copilot.errorPrefix')}${err.message}`;
        assistantContent += errorMsg;
        
        // Final update for error
         setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = { ...updated[lastIdx], content: assistantContent };
            return updated;
        });
        
        setSessions(prev => prev.map(s => {
            if (s.id === activeId) {
                 const updatedMsgs = [...s.messages];
                 const lastIdx = updatedMsgs.length - 1;
                 updatedMsgs[lastIdx] = { ...updatedMsgs[lastIdx], content: assistantContent };
                 return { ...s, messages: updatedMsgs };
            }
            return s;
        }));
        
        setIsLoading(false);
      }
    );
  }, [isLoading, messages, createNewSession, updateSessionMessages]);

  const regenerateLastResponse = useCallback(async () => {
    if (isLoading || messages.length === 0) return;
    
    const activeId = currentSessionIdRef.current;
    if (!activeId) return;

    // 1. Prepare history: remove last assistant message if present
    let historyToUse = [...messages];
    const lastMsg = historyToUse[historyToUse.length - 1];
    
    if (lastMsg.role === "assistant") {
        historyToUse.pop();
    } else if (lastMsg.role !== "user") {
        return; // Can't regenerate if not following a user message
    }

    // Update state to remove the old assistant message (if any)
    setMessages(historyToUse);
    updateSessionMessages(activeId, historyToUse);

    setIsLoading(true);

    // 2. Add new placeholder
    const assistantMsgPlaceholder: ChatMessage = { role: "assistant", content: "" };
    let messagesWithAssistant = [...historyToUse, assistantMsgPlaceholder];
    setMessages(messagesWithAssistant);
    updateSessionMessages(activeId, messagesWithAssistant);

    let assistantContent = "";

    // 3. Stream
    await streamChatCompletion(
      historyToUse,
      (chunk) => {
        assistantContent += chunk;
        setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx].role === "assistant") {
                updated[lastIdx] = { ...updated[lastIdx], content: assistantContent };
            }
            return updated;
        });
        setSessions(prev => prev.map(s => {
            if (s.id === activeId) {
                const updatedMsgs = [...s.messages];
                const lastIdx = updatedMsgs.length - 1;
                if (updatedMsgs[lastIdx].role === "assistant") {
                    updatedMsgs[lastIdx] = { ...updatedMsgs[lastIdx], content: assistantContent };
                } else {
                     updatedMsgs.push({ role: "assistant", content: assistantContent });
                }
                return { ...s, messages: updatedMsgs };
            }
            return s;
        }));
      },
      () => setIsLoading(false),
      (err) => {
        console.error(err);
        const errorMsg = `\n\n${t('copilot.errorPrefix')}${err.message}`;
        assistantContent += errorMsg;
        setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = { ...updated[lastIdx], content: assistantContent };
            return updated;
        });
        setSessions(prev => prev.map(s => {
            if (s.id === activeId) {
                 const updatedMsgs = [...s.messages];
                 const lastIdx = updatedMsgs.length - 1;
                 updatedMsgs[lastIdx] = { ...updatedMsgs[lastIdx], content: assistantContent };
                 return { ...s, messages: updatedMsgs };
            }
            return s;
        }));
        setIsLoading(false);
      }
    );
  }, [isLoading, messages, updateSessionMessages]);

  const loadSession = useCallback((session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
  }, []);

  const clearCurrentSession = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SESSION_ID);
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
