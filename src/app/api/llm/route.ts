import { createSalesforceQueryPrompt } from "@/lib/prompts/sf-query";
import { OllamaRequest } from "@/types/type";
import { NextRequest, NextResponse } from "next/server";




export async function POST(req: NextRequest) {
  console.log("�� [LLM] POST /api/llm - Starting LLM query processing");

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
    });

    console.log("🤖 [LLM] Ollama API response status:", ollamaResponse.status);
    console.log(
      "🤖 [LLM] Ollama API response headers:",
      Object.fromEntries(ollamaResponse.headers.entries())
    );

    if (!ollamaResponse.ok) {
      const errorText = await ollamaResponse.text();
      console.error("�� [LLM] ❌ Ollama API error response:", errorText);
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
      parsedQuery = JSON.parse(ollamaData.response);
      console.log("🤖 [LLM] ✅ Successfully parsed LLM response");
      console.log("�� [LLM] Parsed query object:", parsedQuery);
    } catch (parseError) {
      console.error("🤖 [LLM] ❌ Failed to parse LLM response as JSON");
      console.error("�� [LLM] Raw response:", ollamaData.response);
      throw new Error("Failed to parse LLM response");
    }

    console.log("🤖 [LLM] Making request to dynamic Salesforce endpoint...");
    // Call dynamic Salesforce endpoint
    const salesforceResponse = await fetch(
      `${req.nextUrl.origin}/api/salesforce/dynamic`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedQuery),
      }
    );

    console.log(
      "🤖 [LLM] Dynamic Salesforce endpoint response status:",
      salesforceResponse.status
    );

    if (!salesforceResponse.ok) {
      const errorText = await salesforceResponse.text();
      console.error(
        "🤖 [LLM] ❌ Dynamic Salesforce endpoint error:",
        errorText
      );
      throw new Error("Salesforce query failed");
    }

    const salesforceData = await salesforceResponse.json();
    console.log("🤖 [LLM] ✅ Successfully received Salesforce data");
    console.log(
      "🤖 [LLM] Salesforce data records:",
      salesforceData.records?.length || 0
    );

    return NextResponse.json(salesforceData);
  } catch (error: any) {
    console.error("🤖 [LLM] ❌ LLM route error:", error.message);
    console.error("🤖 [LLM] Stack trace:", error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}