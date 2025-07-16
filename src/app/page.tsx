"use client";

import { useState } from "react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "@/types/chat";

export default function Home() {
  const { currentSession, addMessage } = useChat();
  const [loading, setLoading] = useState(false);

  // Helper to fetch a record by ID and show in table
  const fetchAndShowRecord = async (objectType: string, id: string) => {
    try {
      const response = await fetch("/api/salesforce/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objectType,
          fields: null, // Let backend use defaults
          filters: `Id = '${id}'`,
          limit: 1,
        }),
      });
      const result = await response.json();
      addMessage({
        type: "ai",
        content: `Here are the details for record ID: ${id}`,
        data: result,
        operation: "read",
      });
    } catch (error) {
      addMessage({
        type: "ai",
        content: "Could not fetch the record details after create/update.",
      });
    }
  };

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

      // Handle create/update with follow-up fetch
      if (
        (result.operation === "create" || result.operation === "update") &&
        result.data?.id &&
        result.data.success
      ) {
        // Show success message
        addMessage({
          type: "ai",
          content:
            result.operation === "create"
              ? `Record created successfully (ID: ${result.data.id})`
              : `Record updated successfully (ID: ${result.data.id})`,
          data: null,
          operation: result.operation,
        });
        // Fetch and show the full record
        await fetchAndShowRecord(
          result.data.objectType || result.objectType,
          result.data.id
        );
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
    } catch (error) {
      addMessage({
        type: "ai",
        content: "Sorry, there was an error processing your request.",
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
