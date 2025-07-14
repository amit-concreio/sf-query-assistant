import { ChatSession } from '@/types/chat';

const CHAT_STORAGE_KEY = 'sf-chat-sessions';

export const chatStorage = {
  // Save chat sessions to localStorage
  saveSessions: (sessions: ChatSession[]) => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Failed to save chat sessions:', error);
    }
  },

  // Load chat sessions from localStorage
  loadSessions: (): ChatSession[] => {
    try {
      const stored = localStorage.getItem(CHAT_STORAGE_KEY);
      if (stored) {
        const sessions = JSON.parse(stored);
        // Convert string dates back to Date objects
        return sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      }
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
    return [];
  },

  // Add new session
  addSession: (session: ChatSession) => {
    const sessions = chatStorage.loadSessions();
    sessions.unshift(session); // Add to beginning
    chatStorage.saveSessions(sessions);
  },

  // Update existing session
  updateSession: (sessionId: string, updatedSession: ChatSession) => {
    const sessions = chatStorage.loadSessions();
    const index = sessions.findIndex(s => s.id === sessionId);
    if (index !== -1) {
      sessions[index] = updatedSession;
      chatStorage.saveSessions(sessions);
    }
  }
};