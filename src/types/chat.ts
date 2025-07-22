export interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  data?: any; // For AI responses with Salesforce data
  operation?: "read" | "create" | "update" | "delete" | "aggregate";
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}
