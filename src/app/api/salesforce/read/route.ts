import { NextRequest, NextResponse } from "next/server";
import { SalesforceAuth } from "@/utility/sf-auth";

interface ReadQueryRequest {
  objectType: string;
  fields?: string[];
  filters?: string | Record<string, any>;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export async function POST(req: NextRequest) {
  console.log(" [READ] POST /api/salesforce/read - Starting read query");

  try {
    console.log("📖 [READ] Parsing request body...");
    const body: ReadQueryRequest = await req.json();
    const {
      objectType,
      fields = [],
      filters,
      limit,
      sortBy,
      sortOrder = "ASC",
    } = body;

    console.log("📖 [READ] Request parameters:");
    console.log("📖 [READ] - Object Type:", objectType);
    console.log(" [READ] - Fields:", fields);
    console.log("📖 [READ] - Filters:", filters || "None");
    console.log("📖 [READ] - Limit:", limit);
    console.log("📖 [READ] - Sort By:", sortBy || "None");
    console.log("📖 [READ] - Sort Order:", sortOrder);

    console.log("📖 [READ] Authenticating with Salesforce...");
    const authData = await SalesforceAuth();
    console.log("📖 [READ] ✅ Authentication successful");

    // Build SOQL query
    const selectedFields = fields.length > 0 ? fields.join(", ") : "*";
    let soqlQuery = `SELECT ${selectedFields} FROM ${objectType}`;

    // Handle filters - only add if filters exist and are not empty
    if (filters) {
      let filterClause = "";

      if (typeof filters === "string") {
        // Handle string filters (SOQL WHERE clause)
        if (filters.trim() !== "") {
          const cleanFilters = filters.trim();
          if (cleanFilters.toUpperCase().startsWith("WHERE ")) {
            filterClause = ` ${cleanFilters}`;
          } else {
            filterClause = ` WHERE ${cleanFilters}`;
          }
        }
      } else if (typeof filters === "object" && filters !== null) {
        // Handle object filters - convert to SOQL WHERE clause
        const filterConditions = [];
        for (const [field, value] of Object.entries(filters)) {
          if (value !== null && value !== undefined) {
            if (typeof value === "string") {
              // Handle string values with quotes
              filterConditions.push(
                `${field} = '${value.replace(/'/g, "\\'")}'`
              );
            } else if (typeof value === "number") {
              // Handle numeric values
              filterConditions.push(`${field} = ${value}`);
            } else if (typeof value === "boolean") {
              // Handle boolean values
              filterConditions.push(`${field} = ${value}`);
            }
          }
        }

        if (filterConditions.length > 0) {
          filterClause = ` WHERE ${filterConditions.join(" AND ")}`;
        }
      }

      if (filterClause) {
        soqlQuery += filterClause;
      }
    }

    // Handle sorting - only add if sortBy exists
    if (sortBy && sortBy.trim() !== "") {
      soqlQuery += ` ORDER BY ${sortBy} ${sortOrder}`;
    }

    // Handle limit - only add if limit is a valid number
    if (limit && typeof limit === "number" && limit > 0) {
      soqlQuery += ` LIMIT ${limit}`;
    } else {
      // Default limit if none provided or invalid
      soqlQuery += ` LIMIT 100`;
    }

    console.log("📖 [READ] Generated SOQL query:", soqlQuery);
    console.log("📖 [READ] Making request to Salesforce API...");

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

    console.log("📖 [READ] Salesforce API response status:", response.status);
    console.log(
      "📖 [READ] Salesforce API response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("📖 [READ] ❌ Salesforce API error response:", errorText);
      throw new Error(`Salesforce query failed: ${response.statusText}`);
    }

    const data = await response.json();
    // Ensure records is always an array
    if (!Array.isArray(data.records)) {
      data.records = [];
    }
    console.log("📖 [READ] ✅ Successfully retrieved read query data");
    console.log("📖 [READ] Total records:", data.totalSize);
    console.log("📖 [READ] Records returned:", data.records.length);
    console.log("📖 [READ] Query done:", data.done);

    return NextResponse.json(data);
  } catch (error: any) {
    let userMessage = "An unexpected error occurred. Please try again.";
    const errorText = error.message || "";
    if (errorText.includes("fetch failed")) {
      userMessage =
        "The server is not responding. Please check your connection or try again later.";
    } else if (errorText.includes("INVALID_FIELD")) {
      userMessage =
        "One or more fields in your query do not exist in Salesforce. Please check the field names.";
    } else if (errorText.includes("NOT_FOUND")) {
      userMessage =
        "The requested object or resource was not found in Salesforce.";
    } else if (errorText.includes("query failed")) {
      userMessage =
        "There was a problem with your Salesforce query. Please check your query syntax and field names.";
    } else if (errorText) {
      userMessage = errorText;
    }
    // Log technical details for debugging
    console.error("[READ] Detailed error:", error);
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
