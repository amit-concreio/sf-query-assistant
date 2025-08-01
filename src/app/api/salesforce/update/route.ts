import { NextRequest, NextResponse } from "next/server";
import { SalesforceAuth } from "@/utility/sf-auth";

interface UpdateRequest {
  objectType: string;
  recordId: string;
  data: Record<string, any>;
}

export async function PUT(req: NextRequest) {
  console.log(
    "✏️ [UPDATE] PUT /api/salesforce/update - Starting update operation"
  );

  try {
    console.log("✏️ [UPDATE] Parsing request body...");
    const body: UpdateRequest = await req.json();
    const { objectType, recordId, data } = body;

    console.log("✏️ [UPDATE] Request parameters:");
    console.log("✏️ [UPDATE] - Object Type:", objectType);
    console.log("✏️ [UPDATE] - Record ID:", recordId);
    console.log("✏️ [UPDATE] - Data:", data);

    console.log("✏️ [UPDATE] Authenticating with Salesforce...");
    const authData = await SalesforceAuth();
    console.log("✏️ [UPDATE] ✅ Authentication successful");

    console.log("✏️ [UPDATE] Making request to Salesforce API...");
    // Update record using Salesforce REST API
    const response = await fetch(
      `${authData.instance_url}/services/data/v${process.env.SALESFORCE_API_VERSION}/sobjects/${objectType}/${recordId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    console.log("✏️ [UPDATE] Salesforce API response status:", response.status);
    console.log(
      "✏️ [UPDATE] Salesforce API response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("✏️ [UPDATE] ❌ Salesforce API error response:", errorText);
      throw new Error(`Salesforce update failed: ${response.statusText}`);
    }

    console.log("✏️ [UPDATE] ✅ Successfully updated record");

    return NextResponse.json({
      success: true,
      id: recordId,
      message: `${objectType} updated successfully`,
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
    } else if (errorText.includes("update failed")) {
      userMessage =
        "There was a problem updating the record in Salesforce. Please check your input.";
    } else if (errorText) {
      userMessage = errorText;
    }
    // Log technical details for debugging
    console.error("[UPDATE] Detailed error:", error);
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
