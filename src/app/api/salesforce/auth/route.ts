import { SalesforceAuth } from "@/utility/sf-auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const authData = await SalesforceAuth();
    return NextResponse.json(authData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
