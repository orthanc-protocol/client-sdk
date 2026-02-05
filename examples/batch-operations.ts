/**
 * Batch operations example for the Orthanc Client SDK
 */

import { OrthancsClient } from "../src";

async function main() {
  const client = new OrthancsClient({
    endpoint: "https://api.orthanc.ai",
    apiKey: "your-api-key-here",
  });

  // Create a single memory
  const createResult = await client.createMemory(
    "user-123",
    "User prefers dark mode in all applications",
    {
      category: "preference",
      tags: ["ui", "settings"],
    }
  );

  console.log("Create result:", createResult.results);

  // Batch create multiple memories
  const batchCreateResult = await client.batch({
    userId: "user-123",
    operations: [
      { action: "create", text: "User drinks coffee every morning" },
      { action: "create", text: "User exercises on weekends" },
      { action: "create", text: "User reads before bed" },
    ],
  });

  console.log("Batch create:");
  console.log("  Processed:", batchCreateResult.processed);
  console.log("  Created:", batchCreateResult.results.created);

  // Update a memory
  const updateResult = await client.updateMemory(
    "user-123",
    "mem-uuid-here",
    {
      category: "routine",
      tags: ["morning", "beverage"],
    }
  );

  console.log("Update result:", updateResult.results);

  // Delete a memory
  const deleteResult = await client.deleteMemory("user-123", "mem-uuid-here");

  console.log("Delete result:", deleteResult.results);

  // Mixed batch operations
  const mixedResult = await client.batch({
    userId: "user-123",
    operations: [
      { action: "create", text: "User started learning piano" },
      { action: "update", id: "mem-1", updates: { category: "hobby" } },
      { action: "update", id: "mem-2", updates: { tags: ["music", "learning"] } },
      { action: "delete", id: "mem-3" },
    ],
  });

  console.log("Mixed batch:");
  console.log("  Created:", mixedResult.results.created);
  console.log("  Updated:", mixedResult.results.updated);
  console.log("  Deleted:", mixedResult.results.deleted);
  console.log("  Failed:", mixedResult.results.failed);

  if (mixedResult.errors) {
    console.log("Errors:");
    for (const err of mixedResult.errors) {
      console.log(`  Operation ${err.index}: ${err.error}`);
    }
  }

  // Delete multiple memories at once
  const bulkDeleteResult = await client.deleteAllMemories("user-123", [
    "mem-a",
    "mem-b",
    "mem-c",
  ]);

  console.log("Bulk delete:", bulkDeleteResult.results.deleted, "memories deleted");
}

main().catch(console.error);
