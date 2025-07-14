import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "@/types/chat";

interface ChatContainerProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  loading?: boolean;
}

export const ChatContainer = ({
  messages,
  onSendMessage,
  loading,
}: ChatContainerProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <div className="bg-white border-b px-4 py-3">
        <h1 className="text-lg font-semibold">Salesforce Query Assistant</h1>
        <p className="text-sm text-gray-600">
          Ask questions about your Salesforce data
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-8">
            <p>Start a conversation by asking about your Salesforce data</p>
            <p className="text-sm mt-2">Try: "Show me all accounts"</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSend={onSendMessage} loading={loading} />
    </div>
  );
};
