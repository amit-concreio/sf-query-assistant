import { NextRequest, NextResponse } from "next/server";
import { SalesforceAuth } from "@/utility/sf-auth";

interface DeleteRequest {
  objectType: string;
  recordId: string;
}

export async function DELETE(req: NextRequest) {
  console.log(
    "��️ [DELETE] DELETE /api/salesforce/delete - Starting delete operation"
  );

  try {
    console.log("🗑️ [DELETE] Parsing request body...");
    const body: DeleteRequest = await req.json();
    const { objectType, recordId } = body;

    console.log("🗑️ [DELETE] Request parameters:");
    console.log("��️ [DELETE] - Object Type:", objectType);
    console.log("��️ [DELETE] - Record ID:", recordId);

    console.log("🗑️ [DELETE] Authenticating with Salesforce...");
    const authData = await SalesforceAuth();
    console.log("🗑️ [DELETE] ✅ Authentication successful");

    console.log("🗑️ [DELETE] Making request to Salesforce API...");
    // Delete record using Salesforce REST API
    const response = await fetch(
      `${authData.instance_url}/services/data/v${process.env.SALESFORCE_API_VERSION}/sobjects/${objectType}/${recordId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("🗑️ [DELETE] Salesforce API response status:", response.status);
    console.log(
      "🗑️ [DELETE] Salesforce API response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("🗑️ [DELETE] ❌ Salesforce API error response:", errorText);
      throw new Error(`Salesforce delete failed: ${response.statusText}`);
    }

    console.log("🗑️ [DELETE] ✅ Successfully deleted record");

    return NextResponse.json({
      success: true,
      id: recordId,
      message: `${objectType} deleted successfully`,
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
    } else if (errorText.includes("delete failed")) {
      userMessage =
        "There was a problem deleting the record in Salesforce. Please check your input.";
    } else if (errorText) {
      userMessage = errorText;
    }
    // Log technical details for debugging
    console.error("[DELETE] Detailed error:", error);
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
