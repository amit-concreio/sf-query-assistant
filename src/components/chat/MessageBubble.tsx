import { useState } from "react";
import { ChatMessage } from "@/types/chat";
import { GenericTable } from "../data-display/GenericTable";

interface MessageBubbleProps {
  message: ChatMessage;
}

const objectTypeMeta: Record<string, { title: string; emoji: string }> = {
  Account: { title: "Account Results", emoji: "📊" },
  Case: { title: "Case Results", emoji: "📝" },
  Task: { title: "Task Results", emoji: "✅" },
  Event: { title: "Event Results", emoji: "📅" },
  default: { title: "Results", emoji: "📄" },
};

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.type === "user";
  const [page, setPage] = useState(0);
  const pageSize = 10;

  // Helper to route to the correct table component
  const renderData = (data: any, operation?: string, objectType?: string) => {
    if (!data) return null;
    const meta = objectTypeMeta[objectType || ""] || objectTypeMeta.default;
    if (operation === "read" && data.records && Array.isArray(data.records)) {
      return (
        <GenericTable
          data={data}
          page={page}
          setPage={setPage}
          pageSize={pageSize}
          title={meta.title}
          emoji={meta.emoji}
        />
      );
    }
    // For create/update/delete, show JSON or a simple message
    if (operation === "create" || operation === "update") {
      if (data.records && Array.isArray(data.records)) {
        // If backend returns the full record, show as table
        return (
          <GenericTable
            data={data}
            page={0}
            setPage={() => {}}
            pageSize={1}
            singleRecord
            title={meta.title}
            emoji={meta.emoji}
          />
        );
      }
      // Otherwise, show JSON
      return (
        <div className="mt-2">
          <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
    }
    // For delete, show nothing or a simple message
    return null;
  };

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[90%] rounded-lg px-4 py-3 ${
          isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
        }`}
      >
        <div className="text-sm font-medium mb-1">
          {isUser ? "You" : "Salesforce Assistant"}
        </div>
        <div className="text-sm">{message.content}</div>
        {message.data &&
          renderData(
            message.data,
            message.operation,
            message.data.objectType || message.operation
          )}
        <div className="text-xs opacity-70 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
