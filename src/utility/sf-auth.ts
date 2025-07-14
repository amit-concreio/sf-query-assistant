import dotenv from "dotenv";

dotenv.config();

const {
  SALESFORCE_CLIENT_ID,
  SALESFORCE_CLIENT_SECRET,
  SALESFORCE_LOGIN_URL,
  SALESFORCE_API_VERSION,
} = process.env;

export const SalesforceAuth = async () => {
  console.log("🔑 [SF-AUTH-UTIL] Starting Salesforce authentication");
  console.log("🔑 [SF-AUTH-UTIL] Environment variables check:");
  console.log("🔑 [SF-AUTH-UTIL] - CLIENT_ID:", SALESFORCE_CLIENT_ID ? "Present" : "Missing");
  console.log("🔑 [SF-AUTH-UTIL] - CLIENT_SECRET:", SALESFORCE_CLIENT_SECRET ? "Present" : "Missing");
  console.log("🔑 [SF-AUTH-UTIL] - LOGIN_URL:", SALESFORCE_LOGIN_URL);
  console.log("🔑 [SF-AUTH-UTIL] - API_VERSION:", SALESFORCE_API_VERSION);
  
  if (
    !SALESFORCE_CLIENT_ID ||
    !SALESFORCE_CLIENT_SECRET ||
    !SALESFORCE_LOGIN_URL ||
    !SALESFORCE_API_VERSION
  ) {
    console.error("🔑 [SF-AUTH-UTIL] ❌ Missing Salesforce environment variables");
    throw new Error("Missing Salesforce environment variables");
  }

  console.log("🔑 [SF-AUTH-UTIL] Building authentication request...");
  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", SALESFORCE_CLIENT_ID);
  params.append("client_secret", SALESFORCE_CLIENT_SECRET);

  const authUrl = `${SALESFORCE_LOGIN_URL}/services/oauth2/token`;
  console.log("🔑 [SF-AUTH-UTIL] Authentication URL:", authUrl);

  try {
    console.log("🔑 [SF-AUTH-UTIL] Making authentication request to Salesforce...");
    const res = await fetch(authUrl, {
      method: "POST",
      body: params,
    });

    console.log("🔑 [SF-AUTH-UTIL] Salesforce auth response status:", res.status);
    console.log("🔑 [SF-AUTH-UTIL] Salesforce auth response headers:", Object.fromEntries(res.headers.entries()));

    if (!res.ok) {
      const errortext = await res.text();
      console.error("🔑 [SF-AUTH-UTIL] ❌ Salesforce authentication failed");
      console.error("🔑 [SF-AUTH-UTIL] Error response:", errortext);
      throw new Error(`Salesforce authentication failed: ${errortext}`);
    }

    const data = await res.json();
    console.log("🔑 [SF-AUTH-UTIL] ✅ Authentication successful");
    console.log("🔑 [SF-AUTH-UTIL] Token type:", data.token_type);
    console.log("🔑 [SF-AUTH-UTIL] Instance URL:", data.instance_url);
    console.log("🔑 [SF-AUTH-UTIL] Token received:", data.access_token ? "Yes" : "No");
    
    return data;
  } catch (error: any) {
    console.error("🔑 [SF-AUTH-UTIL] ❌ Token request failed:", error.message);
    console.error("🔑 [SF-AUTH-UTIL] Stack trace:", error.stack);
    throw new Error(`Token request failed: ${error.message}`);
  }
};
