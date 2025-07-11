import { SalesforceAuth } from "@/utility/sf-auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const authData = await SalesforceAuth();
    return NextResponse.json({
      access_token: authData.access_token,
      instance_url: authData.instance_url,
    });
  } catch (e: any) {
    console.error("Error in GET /api/salesforce/auth:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}