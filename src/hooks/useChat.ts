import { useState, useEffect, useCallback, useRef } from "react";
import { ChatMessage, ChatSession } from "@/types/chat";
import { chatStorage } from "@/utils/storage";

export const useChat = () => {
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(
    null
  );
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const currentSessionRef = useRef<ChatSession | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    currentSessionRef.current = currentSession;
  }, [currentSession]);

  // Load sessions on mount
  useEffect(() => {
    const loadedSessions = chatStorage.loadSessions();
    setSessions(loadedSessions);

    // Create new session if none exists
    if (loadedSessions.length === 0) {
      createNewSession();
    } else {
      setCurrentSession(loadedSessions[0]);
    }
  }, []);

  const createNewSession = useCallback(() => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setCurrentSession(newSession);
    setSessions((prev) => [newSession, ...prev]);
    chatStorage.addSession(newSession);
  }, []);

  const addMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "timestamp">) => {
      const session = currentSessionRef.current;
      if (!session) {
        console.error("🚀 [CHAT] No current session available");
        return;
      }

      console.log("🚀 [CHAT] Adding message to session:", session.id);
      console.log("🚀 [CHAT] Message:", message);

      const newMessage: ChatMessage = {
        ...message,
        id: Date.now().toString(),
        timestamp: new Date(),
      };

      const updatedSession: ChatSession = {
        ...session,
        messages: [...session.messages, newMessage],
        updatedAt: new Date(),
      };

      console.log(
        "🚀 [CHAT] Updated session messages count:",
        updatedSession.messages.length
      );

      setCurrentSession(updatedSession);
      setSessions((prev) =>
        prev.map((s) => (s.id === session.id ? updatedSession : s))
      );
      chatStorage.updateSession(session.id, updatedSession);
    },
    []
  );

  const clearCurrentSession = useCallback(() => {
    const session = currentSessionRef.current;
    if (!session) return;

    const clearedSession: ChatSession = {
      ...session,
      messages: [],
      updatedAt: new Date(),
    };

    setCurrentSession(clearedSession);
    setSessions((prev) =>
      prev.map((s) => (s.id === session.id ? clearedSession : s))
    );
    chatStorage.updateSession(session.id, clearedSession);
  }, []);

  return {
    currentSession,
    sessions,
    addMessage,
    createNewSession,
    clearCurrentSession,
  };
};
