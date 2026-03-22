import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const SUPABASE_URL = "https://qwgouvnhggfeczfscikz.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3Z291dm5oZ2dmZWN6ZnNjaWt6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDE4OTk1MiwiZXhwIjoyMDg5NzY1OTUyfQ.bhKOrli0hnon3KdKP921oHq4PegNmVeo8pR5Ol6_pi0";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Agent output files containing scraped peptide JSON
const OUTPUT_DIR =
  "/private/tmp/claude-502/-Users-cislan-public-html-sites-yunowellness/0e05b0ba-a304-43ff-831c-b1b7cef99b0f/tasks";

const OUTPUT_FILES = [
  "a652b7549d3a139ec.output", // batch 1 (A-B)
  "a4dfc1272bc2674af.output", // batch 2 (C-D)
  "ad5cd4bd4b22b757f.output", // batch 3 (E-I)
  "a55d056e225d6add0.output", // batch 4 (K-N)
  "ad40e35c4f85a1b4a.output", // batch 5a (O-P)
  "af719e1554aa4e512.output", // batch 5b (R-S)
  "a52c78f7e512e4386.output", // batch 6 (S-Z)
];

function extractJSON(fileContent) {
  // Output files are JSONL — each line is a JSON message object.
  // The code fences with peptide data are inside the "message.content" strings.
  // We need to find the largest JSON array embedded within the text content.

  // Strategy: find all occurrences of JSON arrays that start with [{"slug" pattern
  const results = [];

  // Parse each line as a JSON message and extract text content
  const lines = fileContent.split("\n").filter((l) => l.trim());
  let fullText = "";

  for (const line of lines) {
    try {
      const msg = JSON.parse(line);
      if (msg.message && msg.message.content) {
        const content = msg.message.content;
        if (typeof content === "string") {
          fullText += content + "\n";
        } else if (Array.isArray(content)) {
          for (const block of content) {
            if (block.text) fullText += block.text + "\n";
          }
        }
      }
    } catch {
      // Not a JSON line, skip
    }
  }

  // Now extract JSON arrays from the accumulated text
  // Look for ```json blocks
  const codeBlockRegex = /```json\s*\n(\[[\s\S]*?\])\s*\n```/g;
  let match;
  let longestMatch = "";

  while ((match = codeBlockRegex.exec(fullText)) !== null) {
    if (match[1].length > longestMatch.length) {
      longestMatch = match[1];
    }
  }

  if (longestMatch) {
    try {
      return JSON.parse(longestMatch);
    } catch (e) {
      console.error("  Failed to parse code block JSON:", e.message.slice(0, 100));
    }
  }

  // Fallback: try to find raw JSON arrays with slug keys
  const rawRegex = /\[\s*\{[^]*?"slug"\s*:/g;
  let rawMatch;
  while ((rawMatch = rawRegex.exec(fullText)) !== null) {
    // Try to find the closing bracket
    let depth = 0;
    let start = rawMatch.index;
    for (let i = start; i < fullText.length; i++) {
      if (fullText[i] === "[") depth++;
      if (fullText[i] === "]") depth--;
      if (depth === 0) {
        const candidate = fullText.slice(start, i + 1);
        try {
          const parsed = JSON.parse(candidate);
          if (Array.isArray(parsed) && parsed.length > results.length) {
            return parsed;
          }
        } catch {
          // Continue searching
        }
        break;
      }
    }
  }

  return results;
}

async function seed() {
  console.log("Reading peptide data from agent outputs...\n");

  const allPeptides = [];
  const seenSlugs = new Set();

  for (const file of OUTPUT_FILES) {
    const path = `${OUTPUT_DIR}/${file}`;
    try {
      const content = readFileSync(path, "utf-8");
      const peptides = extractJSON(content);
      for (const p of peptides) {
        if (p.slug && !seenSlugs.has(p.slug)) {
          seenSlugs.add(p.slug);
          allPeptides.push(p);
        }
      }
      console.log(`  ${file}: ${peptides.length} peptides extracted`);
    } catch (e) {
      console.error(`  ${file}: FAILED - ${e.message}`);
    }
  }

  console.log(`\nTotal unique peptides: ${allPeptides.length}\n`);

  let inserted = 0;
  let failed = 0;

  for (const p of allPeptides) {
    // Insert into peptides table
    const peptideRow = {
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle || null,
      description: p.description || null,
      type_badge: p.type_badge || null,
      administration_route: p.administration_route || null,
      difficulty: p.difficulty || null,
      hero_tags: p.hero_tags || [],
      hero_stats: p.hero_stats || [],
      quick_facts: p.quick_facts || [],
      what_is_it_label: "Understanding",
      what_is_it_title: `So... what exactly is ${p.name}?`,
      what_is_it_body: `<p>${p.description || ""}</p>`,
      what_is_it_cards: [],
      benefits_intro: `Here's what ${p.name} is commonly used for. Think of these as the main reasons people reach for it.`,
      side_effects_intro: `Here's what to watch out for when using <strong>${p.name}</strong>:`,
      side_effects_bottom_line: null,
      dosing_intro: `Here are the common dose ranges for <strong>${p.name}</strong>:`,
      dosing_cards: p.dosing_cards || [],
      dosing_info: p.dosing_info || [],
      dosing_tip: null,
      recon_intro: p.recon_steps && p.recon_steps.length > 0
        ? `Here's how to prepare <strong>${p.name}</strong> for use:`
        : null,
      recon_steps: p.recon_steps || [],
      recon_tip: null,
      supplies: p.supplies || [],
      inject_intro: null,
      inject_steps: [],
      is_published: true,
    };

    const { data: peptideData, error: peptideError } = await supabase
      .from("peptides")
      .upsert(peptideRow, { onConflict: "slug" })
      .select("id")
      .single();

    if (peptideError) {
      console.error(`  FAILED ${p.slug}: ${peptideError.message}`);
      failed++;
      continue;
    }

    const peptideId = peptideData.id;

    // Delete existing benefits and side effects for this peptide (for re-runs)
    await supabase.from("peptide_benefits").delete().eq("peptide_id", peptideId);
    await supabase
      .from("peptide_side_effects")
      .delete()
      .eq("peptide_id", peptideId);

    // Insert benefits
    if (p.benefits && p.benefits.length > 0) {
      const benefitRows = p.benefits.map((b, i) => ({
        peptide_id: peptideId,
        icon: b.icon || null,
        title: b.title,
        description: b.description || null,
        strength: b.strength || 3,
        sort_order: i,
      }));

      const { error: benError } = await supabase
        .from("peptide_benefits")
        .insert(benefitRows);

      if (benError) {
        console.error(`  Benefits failed for ${p.slug}: ${benError.message}`);
      }
    }

    // Insert side effects
    if (p.side_effects && p.side_effects.length > 0) {
      const seRows = p.side_effects.map((se, i) => ({
        peptide_id: peptideId,
        icon: se.icon || null,
        name: se.name,
        description: se.description || null,
        frequency: se.frequency || "common",
        sort_order: i,
      }));

      const { error: seError } = await supabase
        .from("peptide_side_effects")
        .insert(seRows);

      if (seError) {
        console.error(
          `  Side effects failed for ${p.slug}: ${seError.message}`
        );
      }
    }

    inserted++;
    process.stdout.write(`  Inserted ${inserted}/${allPeptides.length}: ${p.name}\n`);
  }

  console.log(`\nDone! ${inserted} inserted, ${failed} failed.`);
}

seed().catch(console.error);
