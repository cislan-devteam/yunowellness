import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://qwgouvnhggfeczfscikz.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Z291dm5oZ2dmZWN6ZnNjaWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE4OTk1MiwiZXhwIjoyMDg5NzY1OTUyfQ.bhKOrli0hnon3KdKP921oHq4PegNmVeo8pR5Ol6_pi0";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Format a mcg number as mg
function mcgNumToMg(numStr) {
  const num = parseFloat(numStr.replace(/,/g, ""));
  const mg = num / 1000;
  if (mg >= 1 && mg === Math.floor(mg)) return mg.toString();
  return mg.toFixed(4).replace(/\.?0+$/, "");
}

// Convert mcg values to mg in a string
function convertMcgToMg(str) {
  if (!str || typeof str !== "string") return str;

  let result = str;

  // 1. Handle ranges: "250–500 mcg" or "250-500 mcg" or "250–500mcg"
  result = result.replace(
    /(\d[\d,]*(?:\.\d+)?)\s*[–\-]\s*(\d[\d,]*(?:\.\d+)?)\s*mcg/gi,
    (match, num1, num2) => {
      const mg1 = mcgNumToMg(num1);
      const mg2 = mcgNumToMg(num2);
      const hadSpace = /\d\s+mcg/i.test(match);
      return mg1 + "–" + mg2 + (hadSpace ? " mg" : "mg");
    }
  );

  // 2. Handle single number + mcg: "250 mcg", "1,000mcg"
  result = result.replace(
    /(\d[\d,]*(?:\.\d+)?)\s*mcg/gi,
    (match, numStr) => {
      const mgStr = mcgNumToMg(numStr);
      const hadSpace = /\d\s+mcg/i.test(match);
      return mgStr + (hadSpace ? " mg" : "mg");
    }
  );

  // 3. Replace any remaining standalone "mcg" (no number prefix) with "mg"
  result = result.replace(/mcg/gi, "mg");

  return result;
}

// Recursively convert all string values in an object/array
function deepConvert(obj) {
  if (typeof obj === "string") return convertMcgToMg(obj);
  if (Array.isArray(obj)) return obj.map(deepConvert);
  if (obj && typeof obj === "object") {
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
      result[key] = deepConvert(val);
    }
    return result;
  }
  return obj;
}

// Fields that contain user-facing text (strings or JSON arrays/objects)
const TEXT_FIELDS = [
  "description",
  "subtitle",
  "what_is_it_body",
  "what_is_it_cards",
  "benefits_intro",
  "side_effects_intro",
  "side_effects_bottom_line",
  "dosing_intro",
  "dosing_cards",
  "dosing_info",
  "dosing_tip",
  "recon_intro",
  "recon_steps",
  "recon_tip",
  "hero_stats",
  "hero_tags",
  "quick_facts",
  "supplies",
];

async function main() {
  const { data: peptides, error } = await supabase
    .from("peptides")
    .select(`id, name, ${TEXT_FIELDS.join(", ")}`)
    .eq("is_published", true);

  if (error) {
    console.error("Failed to fetch peptides:", error);
    process.exit(1);
  }

  let updatedCount = 0;

  for (const p of peptides) {
    const original = JSON.stringify(p);
    if (!original.toLowerCase().includes("mcg")) continue;

    const updates = {};
    let changed = false;

    for (const field of TEXT_FIELDS) {
      if (!p[field]) continue;
      const before = JSON.stringify(p[field]);
      if (!before.toLowerCase().includes("mcg")) continue;

      const converted = deepConvert(p[field]);
      const after = JSON.stringify(converted);

      if (before !== after) {
        updates[field] = converted;
        changed = true;
        // Log specific changes
        console.log(`  ${p.name} -> ${field}:`);
        // Show a few diffs
        const beforeLines = before.match(/\d[\d,]*(?:\.\d+)?\s*mcg/gi) || [];
        const afterMatches = after.match(/\d[\d,]*(?:\.\d+)?\s*mg/gi) || [];
        for (let i = 0; i < Math.min(beforeLines.length, 3); i++) {
          console.log(`    "${beforeLines[i]}" -> "${afterMatches[i] || "?"}"`);
        }
        if (beforeLines.length > 3) {
          console.log(`    ... and ${beforeLines.length - 3} more`);
        }
      }
    }

    if (changed) {
      const { error: updateError } = await supabase
        .from("peptides")
        .update(updates)
        .eq("id", p.id);

      if (updateError) {
        console.error(`  FAILED to update ${p.name}:`, updateError);
      } else {
        updatedCount++;
        console.log(`  Updated ${p.name}`);
      }
    }
  }

  console.log(`\nDone. Updated ${updatedCount} peptides.`);
}

main();
