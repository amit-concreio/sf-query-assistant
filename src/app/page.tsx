"use client";

import { Account, QueryResult } from "@/types/type";
import { useState } from "react";

export default function Home() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [lastOperation, setLastOperation] = useState<string>("");

  const handleQuery = async () => {
    setAccounts([]);
    setError(null);
    setSuccess(null);
    if (!query.trim()) return;

    setLoading(true);

    try {
      console.log(" [FRONTEND] Sending query:", query);

      const response = await fetch("/api/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userQuery: query }),
      });

      console.log("🔄 [FRONTEND] Response status:", response.status);

      if (!response.ok) {
        throw new Error("Query failed");
      }

      const data: QueryResult = await response.json();
      console.log("🔄 [FRONTEND] Received data:", data);

      // Handle different operation types
      if (data.records) {
        // READ operation
        console.log("🔄 [FRONTEND] Processing READ operation");
        setAccounts(data.records || []);
        setLastOperation("read");
        setSuccess(
          `Successfully retrieved ${data.records?.length || 0} records`
        );
      } else if (data.success) {
        // CREATE, UPDATE, DELETE operations
        console.log("🔄 [FRONTEND] Processing CRUD operation");
        const operationType = data.message?.toLowerCase().includes("created")
          ? "create"
          : data.message?.toLowerCase().includes("updated")
          ? "update"
          : "delete";

        console.log("🔄 [FRONTEND] Operation type:", operationType);
        setLastOperation(operationType);
        setSuccess(data.message || "Operation completed successfully");

        // For CREATE/UPDATE operations, fetch the updated record to show
        if (
          data.id &&
          (operationType === "create" || operationType === "update")
        ) {
          console.log(
            "🔄 [FRONTEND] Fetching updated record with ID:",
            data.id
          );
          await fetchUpdatedRecord(data.id, "Account");
        }
      } else {
        console.log(" [FRONTEND] Unknown response format:", data);
      }
    } catch (err: any) {
      console.error("🔄 [FRONTEND] Error:", err);
      setError(err.message || "An error occurred while processing your query");
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdatedRecord = async (recordId: string, objectType: string) => {
    try {
      console.log(
        "🔄 [FRONTEND] Fetching record:",
        recordId,
        "for object:",
        objectType
      );

      // Direct call to READ endpoint with SOQL query
      const response = await fetch("/api/salesforce/read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          objectType: objectType,
          fields: [
            "Id",
            "Name",
            "Industry",
            "AnnualRevenue",
            "BillingCity",
            "Phone",
            "Website",
          ],
          filters: `Id = '${recordId}'`,
          limit: 1,
        }),
      });

      console.log(
        "🔄 [FRONTEND] Fetch record response status:",
        response.status
      );

      if (response.ok) {
        const data = await response.json();
        console.log(" [FRONTEND] Fetched record data:", data);

        if (data.records && data.records.length > 0) {
          setAccounts(data.records);
          console.log(" [FRONTEND] Updated accounts state with:", data.records);
        } else {
          console.log("🔄 [FRONTEND] No records found in response");
        }
      } else {
        console.error(
          "🔄 [FRONTEND] Failed to fetch record, status:",
          response.status
        );
      }
    } catch (error) {
      console.error("🔄 [FRONTEND] Failed to fetch updated record:", error);
    }
  };

  const getStatusIcon = () => {
    switch (lastOperation) {
      case "read":
        return "📖";
      case "create":
        return "➕";
      case "update":
        return "✏️";
      case "delete":
        return "🗑️";
      default:
        return "ℹ️";
    }
  };

  const getStatusColor = () => {
    switch (lastOperation) {
      case "read":
        return "text-blue-600";
      case "create":
        return "text-green-600";
      case "update":
        return "text-yellow-600";
      case "delete":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Salesforce Query Assistant
                </h1>
                <p className="text-sm text-gray-600">
                  Query and manage your Salesforce data
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Query Input Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Ask About Your Salesforce Data
              </h2>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Ask questions in natural language about your Salesforce
                accounts, opportunities, contacts, and more.
              </p>

              <div className="max-w-2xl mx-auto space-y-4">
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Show me all accounts, Create account ABC Corp, Update account 123 name to XYZ, Delete account 123"
                  className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={loading}
                />

                <button
                  onClick={handleQuery}
                  disabled={loading || !query.trim()}
                  className={`
                    inline-flex items-center px-6 py-3 rounded-lg font-medium text-white
                    transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${
                      loading || !query.trim()
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500"
                    }
                  `}
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing Query...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Execute Query
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{getStatusIcon()}</span>
                </div>
                <div className="ml-3">
                  <h3 className={`text-sm font-medium ${getStatusColor()}`}>
                    {lastOperation.charAt(0).toUpperCase() +
                      lastOperation.slice(1)}{" "}
                    Operation Successful
                  </h3>
                  <div className="mt-2 text-sm text-green-700">{success}</div>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Results Section */}
          {accounts.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {lastOperation === "read"
                    ? `Query Results (${accounts.length} records found)`
                    : lastOperation === "create"
                    ? "Created Record"
                    : lastOperation === "update"
                    ? "Updated Record"
                    : "Operation Result"}
                </h3>
              </div>

              <div className="overflow-x-auto">
                <div className="p-6">
                  <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm text-gray-800 font-mono">
                    {JSON.stringify(accounts, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && !success && accounts.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ask a Question
              </h3>
              <p className="text-gray-600">
                Type your question in natural language above to query your
                Salesforce data.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
