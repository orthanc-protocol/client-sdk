/**
 * LangChain integration example
 * Shows how to use Orthanc as a memory backend for LangChain agents
 */

import { OrthancsClient } from "../src";

// This is a simplified example showing the pattern
// In a real implementation, you would use the actual LangChain types

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

class OrthancsMemory {
  private client: OrthancsClient;
  private userId: string;

  constructor(client: OrthancsClient, userId: string) {
    this.client = client;
    this.userId = userId;
  }

  async loadMemoryVariables(input: { query: string }): Promise<{ memories: string }> {
    const result = await this.client.query(this.userId, input.query, {
      matchCount: 5,
      matchThreshold: 0.5,
    });

    if (result.count === 0) {
      return { memories: "" };
    }

    const formatted = result.memories
      .map((m, i) => `- ${m}`)
      .join("\n");

    return { memories: formatted };
  }

  async saveContext(input: Message[], output: Message): Promise<void> {
    const messages = [...input, output];

    await this.client.syncMessages(this.userId, messages, {
      source: "chat",
    });
  }

  async clear(): Promise<void> {
    const exported = await this.client.exportAll(this.userId);
    const ids = exported.map(m => m.id);

    if (ids.length > 0) {
      await this.client.deleteAllMemories(this.userId, ids);
    }
  }
}

async function main() {
  const client = new OrthancsClient({
    endpoint: "https://api.orthanc.ai",
    apiKey: "your-api-key-here",
  });

  const memory = new OrthancsMemory(client, "user-123");

  // Simulate a conversation
  const userMessage: Message = {
    role: "user",
    content: "I just got a new job at Google as a software engineer",
  };

  const assistantMessage: Message = {
    role: "assistant",
    content: "Congratulations on your new position at Google! That's a great achievement.",
  };

  // Save the conversation to memory
  await memory.saveContext([userMessage], assistantMessage);
  console.log("Saved conversation to memory");

  // Later, retrieve relevant memories
  const memories = await memory.loadMemoryVariables({
    query: "Where does the user work?",
  });

  console.log("\nRetrieved memories:");
  console.log(memories.memories);

  // Use in a system prompt
  const systemPrompt = `You are a helpful assistant. Here is what you know about the user:

${memories.memories}

Use this information to personalize your responses.`;

  console.log("\nSystem prompt:");
  console.log(systemPrompt);
}

main().catch(console.error);
