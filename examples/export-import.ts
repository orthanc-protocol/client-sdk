/**
 * Export and import example for the Orthanc Client SDK
 */

import { OrthancsClient } from "../src";

async function main() {
  const client = new OrthancsClient({
    endpoint: "https://api.orthanc.ai",
    apiKey: "your-api-key-here",
  });

  // Export memories with pagination
  const firstPage = await client.export({
    userId: "user-123",
    limit: 100,
    offset: 0,
  });

  console.log("Export results:");
  console.log("  Total memories:", firstPage.total);
  console.log("  This page:", firstPage.count);
  console.log("  Has more:", firstPage.hasMore);

  for (const memory of firstPage.memories) {
    console.log(`  - ${memory.content} (${memory.category || "uncategorized"})`);
  }

  // Export all memories for a user
  const allMemories = await client.exportAll("user-123");

  console.log("\nAll memories:", allMemories.length);

  // Group by category
  const byCategory: Record<string, number> = {};
  for (const memory of allMemories) {
    const cat = memory.category || "uncategorized";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  console.log("\nBy category:");
  for (const [category, count] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${count}`);
  }

  // Import memories from export
  const importResult = await client.batch({
    userId: "user-456",
    operations: allMemories.map(m => ({
      action: "create" as const,
      text: m.content,
      options: {
        category: m.category,
        tags: m.tags,
      },
    })),
  });

  console.log("\nImport results:");
  console.log("  Created:", importResult.results.created);
  console.log("  Failed:", importResult.results.failed);
}

main().catch(console.error);
