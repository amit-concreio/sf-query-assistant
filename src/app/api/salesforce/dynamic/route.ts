import { NextRequest, NextResponse } from "next/server";
import { SalesforceAuth } from "@/utility/sf-auth";

interface DynamicQueryRequest {
  objectType: string;
  fields?: string[];
  filters?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export async function POST(req: NextRequest) {
  console.log(
    "🔄 [DYNAMIC] POST /api/salesforce/dynamic - Starting dynamic query"
  );

  try {
    console.log("🔄 [DYNAMIC] Parsing request body...");
    const body: DynamicQueryRequest = await req.json();
    const {
      objectType,
      fields = [],
      filters,
      limit = 100,
      sortBy,
      sortOrder = "ASC",
    } = body;

    console.log("🔄 [DYNAMIC] Request parameters:");
    console.log(" [DYNAMIC] - Object Type:", objectType);
    console.log(" [DYNAMIC] - Fields:", fields);
    console.log("🔄 [DYNAMIC] - Filters:", filters || "None");
    console.log("🔄 [DYNAMIC] - Limit:", limit);
    console.log("🔄 [DYNAMIC] - Sort By:", sortBy || "None");
    console.log("🔄 [DYNAMIC] - Sort Order:", sortOrder);

    console.log("🔄 [DYNAMIC] Authenticating with Salesforce...");
    const authData = await SalesforceAuth();
    console.log("🔄 [DYNAMIC] ✅ Authentication successful");

    // Build SOQL query
    const selectedFields = fields.length > 0 ? fields.join(", ") : "*";
    let soqlQuery = `SELECT ${selectedFields} FROM ${objectType}`;

    // Fix: Handle filters properly - remove "WHERE" if it's already in the filters
    if (filters) {
      const cleanFilters = filters.trim();
      if (cleanFilters.toUpperCase().startsWith("WHERE ")) {
        // Remove "WHERE" if it's already there
        soqlQuery += ` ${cleanFilters}`;
      } else {
        // Add "WHERE" if it's not there
        soqlQuery += ` WHERE ${cleanFilters}`;
      }
    }

    if (sortBy) {
      soqlQuery += ` ORDER BY ${sortBy} ${sortOrder}`;
    }

    soqlQuery += ` LIMIT ${limit}`;

    console.log("🔄 [DYNAMIC] Generated SOQL query:", soqlQuery);
    console.log("🔄 [DYNAMIC] Making request to Salesforce API...");

    // Execute query
    const response = await fetch(
      `${authData.instance_url}/services/data/v${
        process.env.SALESFORCE_API_VERSION
      }/query?q=${encodeURIComponent(soqlQuery)}`,
      {
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(
      "🔄 [DYNAMIC] Salesforce API response status:",
      response.status
    );
    console.log(
      "🔄 [DYNAMIC] Salesforce API response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "🔄 [DYNAMIC] ❌ Salesforce API error response:",
        errorText
      );
      throw new Error(`Salesforce query failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("🔄 [DYNAMIC] ✅ Successfully retrieved dynamic query data");
    console.log("🔄 [DYNAMIC] Total records:", data.totalSize);
    console.log("🔄 [DYNAMIC] Records returned:", data.records?.length || 0);
    console.log("🔄 [DYNAMIC] Query done:", data.done);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("🔄 [DYNAMIC] ❌ Dynamic query error:", error.message);
    console.error("🔄 [DYNAMIC] Stack trace:", error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
