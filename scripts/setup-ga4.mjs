/**
 * YuNoWellness — GA4 Auto-Configuration Script
 *
 * This script creates all custom dimensions and marks key events
 * in your Google Analytics 4 property automatically.
 *
 * Setup:
 *   1. Go to Google Cloud Console → IAM → Service Accounts → Create
 *   2. Download the JSON key file
 *   3. In GA4 → Admin → Property Access Management → Add the service account email with "Editor" role
 *   4. Run: GOOGLE_APPLICATION_CREDENTIALS=./your-key.json node scripts/setup-ga4.mjs YOUR_PROPERTY_ID
 */

import { AnalyticsAdminServiceClient } from "@google-analytics/admin";

const propertyId = process.argv[2];
if (!propertyId) {
  console.error("Usage: node scripts/setup-ga4.mjs <GA4_PROPERTY_ID>");
  console.error("Example: node scripts/setup-ga4.mjs 123456789");
  console.error("\nSet GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON key file.");
  process.exit(1);
}

const client = new AnalyticsAdminServiceClient();
const parent = `properties/${propertyId}`;

// ─── CUSTOM DIMENSIONS ───
const dimensions = [
  { parameterName: "peptide_name", displayName: "Peptide Name", description: "Name of the peptide viewed or selected", scope: "EVENT" },
  { parameterName: "peptide_slug", displayName: "Peptide Slug", description: "URL slug of the peptide", scope: "EVENT" },
  { parameterName: "search_term", displayName: "Search Term", description: "User search query in nav or library", scope: "EVENT" },
  { parameterName: "search_source", displayName: "Search Source", description: "Where the search was performed (nav or library)", scope: "EVENT" },
  { parameterName: "result_count", displayName: "Result Count", description: "Number of search results returned", scope: "EVENT" },
  { parameterName: "filter_type", displayName: "Filter Type", description: "Type of library filter used (route or difficulty)", scope: "EVENT" },
  { parameterName: "filter_value", displayName: "Filter Value", description: "Value of the filter selected", scope: "EVENT" },
  { parameterName: "dose_mg", displayName: "Dose (mg)", description: "Calculator dose in milligrams", scope: "EVENT" },
  { parameterName: "vial_strength_mg", displayName: "Vial Strength (mg)", description: "Calculator vial strength in milligrams", scope: "EVENT" },
  { parameterName: "signup_method", displayName: "Signup Method", description: "How the user signed up (password or magic_link)", scope: "EVENT" },
  { parameterName: "login_method", displayName: "Login Method", description: "How the user logged in (password or magic_link)", scope: "EVENT" },
  { parameterName: "code_valid", displayName: "Invite Code Valid", description: "Whether the invite code entered was valid (yes/no)", scope: "EVENT" },
];

// ─── KEY EVENTS (conversions) ───
const keyEvents = [
  { eventName: "signup_complete" },
  { eventName: "login_complete" },
  { eventName: "calculator_copy" },
  { eventName: "purchase" },
];

async function run() {
  console.log(`\nConfiguring GA4 property: ${propertyId}\n`);

  // ─── Create Custom Dimensions ───
  console.log("Creating custom dimensions...\n");

  // First, get existing dimensions to avoid duplicates
  const [existingDims] = await client.listCustomDimensions({ parent });
  const existingSlugs = new Set(
    (existingDims || []).map((d) => d.parameterName)
  );

  for (const dim of dimensions) {
    if (existingSlugs.has(dim.parameterName)) {
      console.log(`  SKIP ${dim.displayName} (already exists)`);
      continue;
    }

    try {
      await client.createCustomDimension({
        parent,
        customDimension: {
          parameterName: dim.parameterName,
          displayName: dim.displayName,
          description: dim.description,
          scope: dim.scope,
        },
      });
      console.log(`  OK   ${dim.displayName}`);
    } catch (e) {
      console.error(`  FAIL ${dim.displayName}: ${e.message}`);
    }
  }

  // ─── Create Key Events ───
  console.log("\nMarking key events (conversions)...\n");

  // Get existing key events
  const [existingKeys] = await client.listKeyEvents({ parent });
  const existingKeyNames = new Set(
    (existingKeys || []).map((k) => k.eventName)
  );

  for (const ke of keyEvents) {
    if (existingKeyNames.has(ke.eventName)) {
      console.log(`  SKIP ${ke.eventName} (already a key event)`);
      continue;
    }

    try {
      await client.createKeyEvent({
        parent,
        keyEvent: {
          eventName: ke.eventName,
          countingMethod: "ONCE_PER_EVENT",
        },
      });
      console.log(`  OK   ${ke.eventName}`);
    } catch (e) {
      console.error(`  FAIL ${ke.eventName}: ${e.message}`);
    }
  }

  console.log("\nDone! All custom dimensions and key events are configured.");
  console.log("Events will appear in GA4 → Reports once data starts flowing.\n");
}

run().catch((e) => {
  console.error("Script failed:", e.message);
  if (e.message.includes("Could not load the default credentials")) {
    console.error("\nFix: Set the GOOGLE_APPLICATION_CREDENTIALS environment variable:");
    console.error("  GOOGLE_APPLICATION_CREDENTIALS=./your-service-account-key.json node scripts/setup-ga4.mjs " + propertyId);
  }
  process.exit(1);
});
