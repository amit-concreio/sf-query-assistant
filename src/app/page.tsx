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

    console.log(" [FRONTEND] Sending message:", content);

    // Add user message
    addMessage({
      type: "user",
      content,
    });

    setLoading(true);

    try {
      console.log(" [FRONTEND] Calling LLM API...");

      // Call your existing LLM API - FIX: Send userQuery instead of query
      const response = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userQuery: content }), // FIXED: Changed from 'query' to 'userQuery'
      });

      const result = await response.json();
      console.log("🚀 [FRONTEND] LLM Response:", result);

      // Create a better response message
      let responseContent = "Query executed successfully";
      let responseData = null;

      if (result.operation === "read" && result.data?.records) {
        const recordCount = result.data.records.length;
        responseContent = `Found ${recordCount} records. Here are the results:`;
        responseData = result.data;
      } else if (result.operation === "create" && result.data?.id) {
        responseContent = `Record created successfully with ID: ${result.data.id}`;
        responseData = result.data;
      } else if (result.operation === "update" && result.data?.success) {
        responseContent = `Record updated successfully`;
        responseData = result.data;
      } else if (result.operation === "delete" && result.data?.success) {
        responseContent = `Record deleted successfully`;
        responseData = result.data;
      } else if (result.message) {
        responseContent = result.message;
        responseData = result.data;
      }

      // Add AI response
      addMessage({
        type: "ai",
        content: responseContent,
        data: responseData,
        operation: result.operation,
      });

      console.log("🚀 [FRONTEND] Added AI message to chat");
    } catch (error) {
      console.error("🚀 [FRONTEND] Error:", error);
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
