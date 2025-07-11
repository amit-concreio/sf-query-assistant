import dotenv from "dotenv";

dotenv.config();

const {
  SALESFORCE_CLIENT_ID,
  SALESFORCE_CLIENT_SECRET,
  SALESFORCE_LOGIN_URL,
  SALESFORCE_API_VERSION,
} = process.env;

export const SalesforceAuth = async () => {
  if (
    !SALESFORCE_CLIENT_ID ||
    !SALESFORCE_CLIENT_SECRET ||
    !SALESFORCE_LOGIN_URL ||
    !SALESFORCE_API_VERSION
  ) {
    throw new Error("Missing Salesforce environment variables");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", SALESFORCE_CLIENT_ID);
  params.append("client_secret", SALESFORCE_CLIENT_SECRET);

  try {
    const res = await fetch(`${SALESFORCE_LOGIN_URL}/services/oauth2/token`, {
      method: "POST",
      body: params,
    });

    if (!res.ok) {
      const errortext = await res.text();
      throw new Error(`Salesforce authentication failed: ${errortext}`);
    }

    const data = await res.json();
    return data;
  } catch (error: any) {
    throw new Error(`Token request failed: ${error.message}`);
  }
};
