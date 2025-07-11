import { NextRequest, NextResponse } from "next/server";
import { SalesforceAuth } from "@/utility/sf-auth";
import dotenv from "dotenv";

dotenv.config();

const { SALESFORCE_API_VERSION } = process.env;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); 
    const query = searchParams.get("query"); 

    const tokenData = await SalesforceAuth();
    const { access_token, instance_url } = tokenData;
    const apiVersion = SALESFORCE_API_VERSION || "59.0";

    let endpoint: string;

    if (id) {
      // Fetch specific Account by ID
      endpoint = `${instance_url}/services/data/v${apiVersion}/sobjects/Account/${id}`;
    } else {
      // Fetch Accounts using SOQL query  
      const defaultQuery = "SELECT Id, Name, Type, Industry, BillingCity, BillingState, BillingCountry, Phone, Website, CreatedDate FROM Account LIMIT 100";
      endpoint = `${instance_url}/services/data/v${apiVersion}/query?q=${encodeURIComponent(query || defaultQuery)}`;
    }

    const sfRes = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!sfRes.ok) {
      const err = await sfRes.text();
      return NextResponse.json({ error: `Salesforce API call failed: ${err}` }, { status: 500 });
    }

    const data = await sfRes.json();
    return NextResponse.json(data);
  } catch (e: any) {
    console.error(`Error in GET /api/salesforce/accounts:`, e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}