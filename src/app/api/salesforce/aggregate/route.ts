import { NextRequest, NextResponse } from "next/server";
import { SalesforceAuth } from "@/utility/sf-auth";

interface AggregateQueryRequest {
  objectType: string;
  aggregateFunctions: Array<{
    function: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX";
    field: string;
    alias?: string;
  }>;
  groupBy?: string[];
  having?: string;
  filters?: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: "ASC" | "DESC";
}

export async function POST(req: NextRequest) {
  console.log(
    "📊 [AGGREGATE] POST /api/salesforce/aggregate - Starting aggregate query"
  );

  try {
    console.log("📊 [AGGREGATE] Parsing request body...");
    const body: AggregateQueryRequest = await req.json();
    const {
      objectType,
      aggregateFunctions,
      groupBy = [],
      having,
      filters,
      limit,
      sortBy,
      sortOrder = "ASC",
    } = body;

    console.log("📊 [AGGREGATE] Request parameters:");
    console.log("📊 [AGGREGATE] - Object Type:", objectType);
    console.log("📊 [AGGREGATE] - Aggregate Functions:", aggregateFunctions);
    console.log("📊 [AGGREGATE] - Group By:", groupBy);
    console.log("📊 [AGGREGATE] - Having:", having || "None");
    console.log("📊 [AGGREGATE] - Filters:", filters || "None");
    console.log("📊 [AGGREGATE] - Limit:", limit);
    console.log("📊 [AGGREGATE] - Sort By:", sortBy || "None");
    console.log("📊 [AGGREGATE] - Sort Order:", sortOrder);

    console.log("📊 [AGGREGATE] Authenticating with Salesforce...");
    const authData = await SalesforceAuth();
    console.log("📊 [AGGREGATE] ✅ Authentication successful");

    // Build aggregate SOQL query
    const aggregateSelects = aggregateFunctions.map((agg) => {
      const alias =
        agg.alias ||
        `${agg.function}_${agg.field.replace(/[^a-zA-Z0-9]/g, "_")}`;
      return `${agg.function}(${agg.field}) ${alias}`;
    });

    // Add GROUP BY fields to SELECT if they're not already included
    const groupBySelects = groupBy
      .filter((field) => !aggregateFunctions.some((agg) => agg.field === field))
      .map((field) => field);

    const allSelects = [...groupBySelects, ...aggregateSelects];
    let soqlQuery = `SELECT ${allSelects.join(", ")} FROM ${objectType}`;

    // Handle filters (WHERE clause)
    if (filters && filters.trim() !== "") {
      const cleanFilters = filters.trim();
      if (cleanFilters.toUpperCase().startsWith("WHERE ")) {
        soqlQuery += ` ${cleanFilters}`;
      } else {
        soqlQuery += ` WHERE ${cleanFilters}`;
      }
    }

    // Handle GROUP BY
    if (groupBy.length > 0) {
      soqlQuery += ` GROUP BY ${groupBy.join(", ")}`;
    }

    // Handle HAVING clause
    if (having && having.trim() !== "") {
      const cleanHaving = having.trim();
      if (cleanHaving.toUpperCase().startsWith("HAVING ")) {
        soqlQuery += ` ${cleanHaving}`;
      } else {
        soqlQuery += ` HAVING ${cleanHaving}`;
      }
    }

    // Handle sorting
    if (sortBy && sortBy.trim() !== "") {
      soqlQuery += ` ORDER BY ${sortBy} ${sortOrder}`;
    }

    // Handle limit
    if (groupBy.length > 0 && limit && typeof limit === "number" && limit > 0) {
      soqlQuery += ` LIMIT ${limit}`;
    } else if (groupBy.length > 0) {
      // Default limit for grouped aggregate queries
      soqlQuery += ` LIMIT 1000`;
    }
    // Do NOT add LIMIT if there is no groupBy

    console.log("📊 [AGGREGATE] Generated SOQL query:", soqlQuery);
    console.log("📊 [AGGREGATE] Making request to Salesforce API...");

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
      "📊 [AGGREGATE] Salesforce API response status:",
      response.status
    );
    console.log(
      "📊 [AGGREGATE] Salesforce API response headers:",
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "📊 [AGGREGATE] ❌ Salesforce API error response:",
        errorText
      );
      throw new Error(
        `Salesforce aggregate query failed: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Ensure records is always an array
    if (!Array.isArray(data.records)) {
      data.records = [];
    }

    // Add aggregate metadata to response
    const aggregateMetadata = {
      aggregateFunctions: aggregateFunctions,
      groupBy: groupBy,
      having: having,
      queryType: "aggregate",
    };

    console.log(
      "📊 [AGGREGATE] ✅ Successfully retrieved aggregate query data"
    );
    console.log("📊 [AGGREGATE] Total records:", data.totalSize);
    console.log("📊 [AGGREGATE] Records returned:", data.records.length);
    console.log("📊 [AGGREGATE] Query done:", data.done);

    return NextResponse.json({
      ...data,
      aggregateMetadata,
    });
  } catch (error: any) {
    let userMessage = "An unexpected error occurred. Please try again.";
    const errorText = error.message || "";

    if (errorText.includes("fetch failed")) {
      userMessage =
        "The server is not responding. Please check your connection or try again later.";
    } else if (errorText.includes("INVALID_FIELD")) {
      userMessage =
        "One or more fields in your aggregate query do not exist in Salesforce. Please check the field names.";
    } else if (errorText.includes("NOT_FOUND")) {
      userMessage =
        "The requested object or resource was not found in Salesforce.";
    } else if (errorText.includes("INVALID_TYPE")) {
      userMessage =
        "One or more aggregate functions are not compatible with the specified field types. Please check your query.";
    } else if (errorText.includes("aggregate query failed")) {
      userMessage =
        "There was a problem with your Salesforce aggregate query. Please check your query syntax and field names.";
    } else if (errorText) {
      userMessage = errorText;
    }

    // Log technical details for debugging
    console.error("[AGGREGATE] Detailed error:", error);
    return NextResponse.json({ error: userMessage }, { status: 500 });
  }
}
