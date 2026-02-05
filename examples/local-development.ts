/**
 * Local development example using the in-memory store
 * No API key or network required
 */

import { LocalClient } from "../src";

async function main() {
  const client = new LocalClient();

  // Sync some memories
  await client.syncMessages("user-123", [
    { role: "user", content: "I love hiking in the mountains" },
    { role: "assistant", content: "That sounds great!" },
    { role: "user", content: "My favorite trail is in Yosemite" },
  ]);

  await client.syncText(
    "user-123",
    "User works as a software engineer. User prefers TypeScript. User drinks coffee every morning."
  );

  // Create individual memories
  await client.createMemory("user-123", "User has a dog named Max");
  await client.createMemory("user-123", "User is allergic to peanuts");

  // Query memories
  const result = await client.query("user-123", "What does the user like?");

  console.log("Query results:");
  console.log("  Count:", result.count);
  console.log("  Query type:", result.queryType);
  console.log("  Latency:", result.latency_ms + "ms");

  for (let i = 0; i < result.memories.length; i++) {
    console.log(`  ${i + 1}. ${result.memories[i]} (score: ${result.scores[i].toFixed(2)})`);
  }

  // Export all memories
  const exported = await client.export("user-123");

  console.log("\nExported memories:", exported.count);
  for (const memory of exported.memories) {
    console.log(`  - ${memory.content}`);
  }

  // Get stats
  const stats = client.getStats();

  console.log("\nStore stats:");
  console.log("  Total memories:", stats.totalMemories);
  console.log("  Users:", stats.users);

  // Clear user data
  client.clearUser("user-123");

  const afterClear = client.getStats();
  console.log("\nAfter clear:", afterClear.totalMemories, "memories");
}

main().catch(console.error);
