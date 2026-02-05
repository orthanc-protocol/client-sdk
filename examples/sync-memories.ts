/**
 * Memory sync example for the Orthanc Client SDK
 */

import { OrthancsClient } from "../src";

async function main() {
  const client = new OrthancsClient({
    endpoint: "https://api.orthanc.ai",
    apiKey: "your-api-key-here",
  });

  // Sync from chat messages
  const chatResult = await client.syncMessages(
    "user-123",
    [
      { role: "user", content: "I just moved to San Francisco" },
      { role: "assistant", content: "That's exciting! How do you like it?" },
      { role: "user", content: "It's great, I love the weather here" },
    ],
    {
      source: "chat",
      sourceName: "Mobile App",
      tags: ["location", "preference"],
    }
  );

  console.log("Chat sync status:", chatResult.status);
  console.log("Input format:", chatResult.inputFormat);

  // Sync from raw text
  const textResult = await client.syncText(
    "user-123",
    "User works at Google as a software engineer. Started in January 2026.",
    {
      source: "import",
      infer: false,
      category: "work",
    }
  );

  console.log("Text sync status:", textResult.status);

  // Sync with custom metadata
  const metadataResult = await client.sync({
    userId: "user-123",
    messages: [
      { role: "user", content: "My favorite programming language is TypeScript" },
    ],
    options: {
      source: "sdk",
      importance: 8,
      tags: ["preference", "programming"],
    },
    metadata: {
      conversation_id: "conv-456",
      session_id: "sess-789",
    },
  });

  console.log("Metadata sync status:", metadataResult.status);

  // Synchronous sync (wait for processing)
  const syncResult = await client.sync({
    userId: "user-123",
    text: "User is allergic to peanuts",
    options: {
      sync: true,
      category: "health",
      importance: 10,
    },
  });

  console.log("Sync result:");
  console.log("  Status:", syncResult.status);
  console.log("  Memories created:", syncResult.memoriesCreated);
  console.log("  Latency:", syncResult.latency_ms + "ms");
}

main().catch(console.error);
