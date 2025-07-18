import { NextRequest, NextResponse } from "next/server";
import { SalesforceAuth } from "@/utility/sf-auth";

interface CreateRequest {
  objectType: string;
  data: Record<string, any>;
}

export async function POST(req: NextRequest) {
  console.log(
    "➕ [CREATE] POST /api/salesforce/create - Starting create operation"
  );

  try {
    console.log("➕ [CREATE] Parsing request body...");
    const body: CreateRequest = await req.json();
    const { objectType, data } = body;

    console.log("➕ [CREATE] Request parameters:");
    console.log("➕ [CREATE] - Object Type:", objectType);
    console.log("➕ [CREATE] - Data:", data);

    console.log("➕ [CREATE] Authenticating with Salesforce...");
    const authData = await SalesforceAuth();
    console.log("➕ [CREATE] ✅ Authentication successful");

    console.log("➕ [CREATE] Making request to Salesforce API...");
    // Create record using Salesforce REST API
    const response = await fetch(
      `${authData.instance_url}/services/data/v${process.env.SALESFORCE_API_VERSION}/sobjects/${objectType}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    console.log("➕ [CREATE] Salesforce API response status:", response.status);
    console.log(
      "➕ [CREATE] Salesforce API response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("➕ [CREATE] ❌ Salesforce API error response:", errorText);
      throw new Error(`Salesforce create failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log("➕ [CREATE] ✅ Successfully created record");
    console.log("➕ [CREATE] Record ID:", result.id);
    console.log("➕ [CREATE] Success:", result.success);

    return NextResponse.json({
      success: true,
      id: result.id,
      message: `${objectType} created successfully`,
      objectType,
    });
  } catch (error: any) {
    let userMessage = "An unexpected error occurred. Please try again.";
    const errorText = error.message || "";
    if (errorText.includes("fetch failed")) {
      userMessage =
        "The server is not responding. Please check your connection or try again later.";
    } else if (errorText.includes("INVALID_FIELD")) {
      userMessage =
        "One or more fields in your request do not exist in Salesforce. Please check the field names.";
    } else if (errorText.includes("NOT_FOUND")) {
      userMessage =
        "The requested object or resource was not found in Salesforce.";
    } else if (errorText.includes("create failed")) {
      userMessage =
        "There was a problem creating the record in Salesforce. Please check your input.";
    } else if (errorText) {
      userMessage = errorText;
    }
    // Log technical details for debugging
    console.error("[CREATE] Detailed error:", error);
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
