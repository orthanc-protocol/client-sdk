/**
 * Basic usage example for the Orthanc Client SDK
 */

import { OrthancsClient } from "../src";

async function main() {
  const client = new OrthancsClient({
    endpoint: "https://api.orthanc.ai",
    apiKey: "your-api-key-here",
  });

  const result = await client.query("user-123", "What do I like?");

  console.log("Memories found:", result.count);
  console.log("Query type:", result.queryType);
  console.log("Response time:", result.latency_ms + "ms");

  for (let i = 0; i < result.memories.length; i++) {
    console.log(`  ${i + 1}. ${result.memories[i]} (score: ${result.scores[i]})`);
  }
}

main().catch(console.error);
