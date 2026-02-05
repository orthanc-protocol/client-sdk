/**
 * Caching example for the Orthanc Client SDK
 */

import { OrthancsClient } from "../src";

async function main() {
  const client = new OrthancsClient({
    endpoint: "https://api.orthanc.ai",
    apiKey: "your-api-key-here",
    cache: {
      enabled: true,
      ttl: 60000,
      maxSize: 1000,
    },
  });

  // First query hits the API
  console.log("First query...");
  const start1 = Date.now();
  const result1 = await client.query("user-123", "What do I like?");
  console.log("  Time:", Date.now() - start1 + "ms");
  console.log("  API latency:", result1.latency_ms + "ms");
  console.log("  Results:", result1.count);

  // Second query hits the cache
  console.log("\nSecond query (cached)...");
  const start2 = Date.now();
  const result2 = await client.query("user-123", "What do I like?");
  console.log("  Time:", Date.now() - start2 + "ms");
  console.log("  Results:", result2.count);

  // Sync invalidates the cache for that user
  console.log("\nSyncing new memory...");
  await client.syncText("user-123", "User likes pizza");

  // Third query hits the API again
  console.log("\nThird query (after sync)...");
  const start3 = Date.now();
  const result3 = await client.query("user-123", "What do I like?");
  console.log("  Time:", Date.now() - start3 + "ms");
  console.log("  API latency:", result3.latency_ms + "ms");
  console.log("  Results:", result3.count);

  // Manual cache invalidation
  console.log("\nManual cache invalidation...");
  client.invalidateCache("user-123");

  // Clear entire cache
  console.log("Clearing entire cache...");
  client.clearCache();
}

main().catch(console.error);
