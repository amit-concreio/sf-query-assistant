"use client";

import { useState, useRef } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "@/types/chat";

export default function Home() {
  const { currentSession, addMessage } = useChat();
  const [loading, setLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSendMessage = async (content: string) => {
    if (!currentSession) return;

    // Add user message
    addMessage({
      type: "user",
      content,
    });

    setLoading(true);
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuery: content }),
        signal: abortController.signal,
      });

      const result = await response.json();
      console.log("Backend error:", result); // For developers only

      // If the LLM API returns an error, show it in the chat
      if (result.error) {
        addMessage({
          type: "ai",
          content: result.error, // Show only the user-friendly error message
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
      } else if (result.operation === "aggregate" && result.data) {
        // Aggregate: show aggregate table
        addMessage({
          type: "ai",
          content: `Here are the aggregate results:`,
          data: result.data,
          operation: "aggregate",
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
      if (error.name === "AbortError") {
        addMessage({
          type: "ai",
          content: "Request cancelled by user.",
        });
      } else {
        addMessage({
          type: "ai",
          content:
            "The server is not responding. Please check your connection or try again later.",
        });
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
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
    <div className="relative h-full">
      <ChatContainer
        messages={currentSession.messages}
        onSendMessage={handleSendMessage}
        loading={loading}
      />
      {loading && (
        <button
          onClick={handleCancel}
          className="absolute right-4 bottom-4 px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 z-10"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
