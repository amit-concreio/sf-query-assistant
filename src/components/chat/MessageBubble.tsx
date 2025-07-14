import { useState } from "react";
import { ChatMessage } from "@/types/chat";

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.type === "user";

  // Pagination state for records
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const renderData = (data: any) => {
    if (!data) return null;

    // If it's Salesforce records data
    if (data.records && Array.isArray(data.records)) {
      const total = data.records.length;
      const start = page * pageSize;
      const end = Math.min(start + pageSize, total);
      const pageRecords = data.records.slice(start, end);

      return (
        <div className="mt-3">
          <div className="text-sm font-semibold mb-2">
            📊 Results ({total} records)
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-xs border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  {pageRecords.length > 0 &&
                    Object.keys(pageRecords[0])
                      .filter((key) => key !== "attributes")
                      .map((key) => (
                        <th
                          key={key}
                          className="border border-gray-300 px-2 py-1 text-left"
                        >
                          {key}
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody>
                {pageRecords.map((record: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {Object.keys(record)
                      .filter((key) => key !== "attributes")
                      .map((key) => (
                        <td
                          key={key}
                          className="border border-gray-300 px-2 py-1"
                        >
                          {record[key] !== null && record[key] !== undefined
                            ? record[key]
                            : "-"}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination controls */}
          <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
              Previous
            </button>
            <span>
              Showing {start + 1}–{end} of {total} records
            </span>
            <button
              disabled={end >= total}
              onClick={() => setPage(page + 1)}
              className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      );
    }

    // For other data types (create, update, delete responses)
    return (
      <div className="mt-2">
        <pre className="text-xs bg-gray-200 p-2 rounded overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
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
        {message.data && renderData(message.data)}
        <div className="text-xs opacity-70 mt-2">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
