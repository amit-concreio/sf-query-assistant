import { createSalesforceQueryPrompt } from "@/lib/prompts/sf-query";
import { NextRequest, NextResponse } from "next/server";

interface OllamaRequest {
  model: string;
  prompt: string;
  stream: boolean;
}

export async function POST(req: NextRequest) {
  console.log(" [LLM] POST /api/llm - Starting LLM query processing");

  // --- Cancellation support ---
  let clientAborted = false;
  const ollamaAbortController = new AbortController();
  const salesforceAbortController = new AbortController();
  req.signal?.addEventListener("abort", () => {
    clientAborted = true;
    ollamaAbortController.abort();
    salesforceAbortController.abort();
    console.log(" [LLM] Client disconnected, aborted downstream requests.");
  });
  // --- End cancellation support ---

  try {
    console.log("🤖 [LLM] Parsing request body...");
    const { userQuery } = await req.json();
    console.log("🤖 [LLM] User query received:", userQuery);

    // Create prompt for Ollama using the prompt template
    const prompt = createSalesforceQueryPrompt(userQuery);

    console.log("🤖 [LLM] Generated prompt for Ollama");
    console.log("🤖 [LLM] Prompt length:", prompt.length, "characters");

    const ollamaRequest: OllamaRequest = {
      model: "llama3:8b",
      prompt: prompt,
      stream: false,
    };

    console.log("🤖 [LLM] Ollama request configuration:");
    console.log("🤖 [LLM] - Model:", ollamaRequest.model);
    console.log("🤖 [LLM] - Stream:", ollamaRequest.stream);

    console.log("🤖 [LLM] Making request to Ollama API...");
    // Call Ollama
    const ollamaResponse = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(ollamaRequest),
      signal: ollamaAbortController.signal,
    });

    console.log("🤖 [LLM] Ollama API response status:", ollamaResponse.status);
    console.log(
      "🤖 [LLM] Ollama API response headers:",
      Object.fromEntries(ollamaResponse.headers.entries())
    );

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error(" [LLM] ❌ Ollama API error response:", errorText);
      throw new Error("Ollama request failed");
    }

    const ollamaData = await ollamaResponse.json();
    console.log("🤖 [LLM] ✅ Ollama response received");
    console.log(
      "🤖 [LLM] Ollama response length:",
      ollamaData.response?.length || 0
    );
    console.log(
      "🤖 [LLM] Ollama response preview:",
      ollamaData.response?.substring(0, 200) + "..."
    );

    // Parse LLM response
    console.log("🤖 [LLM] Parsing LLM response as JSON...");
    let parsedQuery;
    try {
      // Try direct JSON parse first
      parsedQuery = JSON.parse(ollamaData.response);
      console.log("🤖 [LLM] ✅ Successfully parsed LLM response");
      console.log(" [LLM] Parsed query object:", parsedQuery);
    } catch (parseError) {
      // Fallback: try to extract JSON from markdown/code block or after extra text
      console.error("🤖 [LLM] ❌ Failed to parse LLM response as JSON");
      console.error(" [LLM] Raw response:", ollamaData.response);
      let jsonString = ollamaData.response;
      // Extract only the JSON part between the first '{' and the last '}'
      const firstBrace = jsonString.indexOf("{");
      const lastBrace = jsonString.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonString = jsonString.slice(firstBrace, lastBrace + 1);
      }
      // Remove markdown code block markers if present
      jsonString = jsonString
        .replace(/```[a-zA-Z]*[\r\n]+/, "")
        .replace(/```[\r\n]*/g, "");
      try {
        parsedQuery = JSON.parse(jsonString);
        console.log(
          "🤖 [LLM] ✅ Successfully parsed LLM response after cleaning"
        );
        console.log(" [LLM] Parsed query object:", parsedQuery);
      } catch (finalParseError) {
        throw new Error("Failed to parse LLM response");
      }
    }

    // Determine operation type and route accordingly
    const operation = parsedQuery.operation || "read";
    console.log("🤖 [LLM] Operation type:", operation);

    let endpoint = "";
    let method = "POST";
    let requestBody = {};

    switch (operation.toLowerCase()) {
      case "create":
        endpoint = "/api/salesforce/create";
        method = "POST";
        requestBody = {
          objectType: parsedQuery.objectType,
          data: parsedQuery.data,
        };
        break;
      case "update":
        endpoint = "/api/salesforce/update";
        method = "PUT";
        requestBody = {
          objectType: parsedQuery.objectType,
          recordId: parsedQuery.recordId,
          data: parsedQuery.data,
        };
        break;
      case "delete":
        endpoint = "/api/salesforce/delete";
        method = "DELETE";
        requestBody = {
          objectType: parsedQuery.objectType,
          recordId: parsedQuery.recordId,
        };
        break;
      case "aggregate":
        endpoint = "/api/salesforce/aggregate";
        method = "POST";
        requestBody = {
          objectType: parsedQuery.objectType,
          aggregateFunctions: parsedQuery.aggregateFunctions,
          groupBy: parsedQuery.groupBy,
          having: parsedQuery.having,
          filters: parsedQuery.filters,
          limit: parsedQuery.limit,
          sortBy: parsedQuery.sortBy,
          sortOrder: parsedQuery.sortOrder,
        };
        break;
      default: // read
        endpoint = "/api/salesforce/read";
        method = "POST";
        requestBody = {
          objectType: parsedQuery.objectType,
          fields: parsedQuery.fields,
          filters: parsedQuery.filters,
          limit: parsedQuery.limit,
          sortBy: parsedQuery.sortBy,
          sortOrder: parsedQuery.sortOrder,
        };
    }

    console.log("🤖 [LLM] Making request to Salesforce endpoint:", endpoint);
    console.log("🤖 [LLM] Method:", method);
    console.log(" [LLM] Request body:", requestBody);

    // Call appropriate Salesforce endpoint
    const salesforceResponse = await fetch(`${req.nextUrl.origin}${endpoint}`, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: salesforceAbortController.signal,
    });

    console.log(
      "🤖 [LLM] Salesforce endpoint response status:",
      salesforceResponse.status
    );

    if (!salesforceResponse.ok) {
      const errorText = await salesforceResponse.text();
      console.error(" [LLM] ❌ Salesforce endpoint error:", errorText);
      throw new Error("Salesforce operation failed");
    }

    const salesforceData = await salesforceResponse.json();
    console.log("🤖 [LLM] ✅ Successfully received Salesforce data");
    console.log("🤖 [LLM] Salesforce response:", salesforceData);

    return NextResponse.json({
      operation: operation,
      data: salesforceData,
      message: `Successfully executed ${operation} operation`,
      success: true,
    });
  } catch (error: any) {
    // Handle client abort
    if (clientAborted || error?.name === "AbortError") {
      console.warn(" [LLM] Request cancelled by client (abort)");
      return NextResponse.json(
        {
          error: true,
          message: "Request cancelled by client.",
        },
        { status: 499 }
      );
    }
    console.error("🤖 [LLM] ❌ LLM route error:", error.message);
    console.error("🤖 [LLM] Stack trace:", error.stack);
    return NextResponse.json(
      {
        error: true,
        message: error.message || "An unknown error occurred in the LLM route.",
        stack: error.stack || undefined,
      },
      { status: 500 }
    );
  }
}
