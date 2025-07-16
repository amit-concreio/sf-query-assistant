"use client";

import { useState } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "@/types/chat";

export default function Home() {
  const { currentSession, addMessage } = useChat();
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    if (!currentSession) return;

    // Add user message
    addMessage({
      type: "user",
      content,
    });

    setLoading(true);

    try {
      // Call your existing LLM API
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuery: content }),
      });

      const result = await response.json();

      // If the LLM API returns an error, show it in the chat
      if (result.error) {
        addMessage({
          type: "ai",
          content:
            `Error: ${result.message || "An error occurred."}` +
            (result.stack ? `\nDetails: ${result.stack}` : ""),
        });
        return;
      }

      // Handle create/update: only show status message and record ID
      if (
        (result.operation === "create" || result.operation === "update") &&
        result.data?.id &&
        result.data.success
      ) {
        addMessage({
          type: "ai",
          content:
            result.operation === "create"
              ? `Record created successfully (ID: ${result.data.id})`
              : `Record updated successfully (ID: ${result.data.id})`,
          data: null,
          operation: result.operation,
        });
      } else if (
        result.operation === "delete" &&
        result.data?.id &&
        result.data.success
      ) {
        // Show delete message only
        addMessage({
          type: "ai",
          content: `Record deleted successfully (ID: ${result.data.id})`,
          data: null,
          operation: "delete",
        });
      } else if (result.operation === "read" && result.data?.records) {
        // Normal read: show table
        addMessage({
          type: "ai",
          content: `Found ${result.data.records.length} records. Here are the results:`,
          data: result.data,
          operation: "read",
        });
      } else {
        // Fallback for any other response
        addMessage({
          type: "ai",
          content: result.message || "Query executed successfully",
          data: result.data,
          operation: result.operation,
        });
      }
    } catch (error: any) {
      addMessage({
        type: "ai",
        content: error?.message
          ? `Error: ${error.message}`
          : "Sorry, there was an error processing your request.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading chat...</div>
      </div>
    );
  }

  return (
    <ChatContainer
      messages={currentSession.messages}
      onSendMessage={handleSendMessage}
      loading={loading}
    />
  );
}
