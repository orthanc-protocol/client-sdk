# Orthanc Client SDK

The open source SDK for querying agent memory. Build with a standard interface that works everywhere.

## What is this

Orthanc Client SDK is a universal way to query long term memory for AI agents. Whether you're building a chatbot, a support agent, or an autonomous system, this SDK gives you one interface that works locally or in the cloud.

Think of it like this: instead of every AI project building memory differently, they all speak the same language through the Orthanc Protocol.

## Installation

```bash
npm install @orthanc-protocol/client
```

## Quick start

```typescript
import { OrthancsClient } from "@orthanc-protocol/client";

const client = new OrthancsClient({
  endpoint: "https://api.orthanc.ai",
  apiKey: "your-api-key",
});

const result = await client.query("user-123", "What do I like?");
console.log(result.memories);
```

That's it. Your agent now has access to long term memory.

## Try it now (Public Demo Key)

Want to test without signing up? Use our public demo key:

```typescript
import { OrthancsClient } from "@orthanc-protocol/client";

const client = new OrthancsClient({
  endpoint: "https://api.orthanc.ai",
  apiKey: "orth_demo_public_2026",  // Public demo key
});

// Store a memory
await client.syncMessages("demo-user", [
  { role: "user", content: "I love hiking in the mountains" },
  { role: "assistant", content: "That sounds wonderful!" }
]);

// Query memories (~150ms from production servers)
const result = await client.query("demo-user", "What are my hobbies?");
console.log(result.memories);     // ["User loves hiking in the mountains"]
console.log(result.latency_ms);   // ~150ms
console.log(result.queryType);    // "question_match"
```

> **Note:** The demo key is rate-limited and shared. Get your own key at [orthanc.ai](https://orthanc.ai) for production use.

## Features

### Query memory

Retrieve relevant memories for any user query. The SDK handles query type detection, scoring, and result formatting.

```typescript
const result = await client.query("user-123", "What are my hobbies?", {
  matchThreshold: 0.5,
  matchCount: 5,
  timeFilter: "month",
});

console.log(result.memories);     // Array of memory strings
console.log(result.scores);       // Relevance scores (0-1)
console.log(result.queryType);    // "question_match" | "vector_search" | etc.
console.log(result.latency_ms);   // Processing time in ms
console.log(result.requestId);    // Request ID for debugging
```

### Sync memories

Ingest new memories from chat messages or raw text.

```typescript
await client.syncMessages("user-123", [
  { role: "user", content: "I just moved to San Francisco" },
  { role: "assistant", content: "How do you like it?" },
  { role: "user", content: "I love the weather here" },
]);

await client.syncText("user-123", "User works at Google as a software engineer");
```

### Batch operations

Create, update, or delete multiple memories in a single request.

```typescript
const result = await client.batch({
  userId: "user-123",
  operations: [
    { action: "create", text: "User likes coffee" },
    { action: "update", id: "mem-1", updates: { category: "food" } },
    { action: "delete", id: "mem-2" },
  ],
});

console.log(result.results.created);
console.log(result.results.updated);
console.log(result.results.deleted);
```

### Export and import

Export all memories for data portability or migration.

```typescript
const memories = await client.exportAll("user-123");

for (const memory of memories) {
  console.log(memory.content, memory.category, memory.createdAt);
}
```

### Webhooks

Subscribe to real time notifications when memories change.

```typescript
const webhook = await client.createWebhook({
  url: "https://your-server.com/webhook",
  events: ["memory.created", "memory.updated", "memory.deleted"],
  secret: "your-hmac-secret",
});
```

### Caching

Built in query caching to reduce API calls and improve response times.

```typescript
const client = new OrthancsClient({
  endpoint: "https://api.orthanc.ai",
  apiKey: "your-api-key",
  cache: {
    enabled: true,
    ttl: 60000,
    maxSize: 1000,
  },
});
```

### Error handling

Typed errors for all failure cases with automatic retries for transient failures.

```typescript
import {
  OrthancsClient,
  AuthenticationError,
  RateLimitError,
  ValidationError,
} from "@orthanc-protocol/client";

try {
  const result = await client.query("user-123", "What do I like?");
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("Invalid API key");
  } else if (error instanceof RateLimitError) {
    console.error("Rate limit exceeded, retry after:", error.retryAfter);
  } else if (error instanceof ValidationError) {
    console.error("Invalid request:", error.message);
  }
}
```

### Local development

Test your agent without hitting an external API using the in memory store.

```typescript
import { LocalClient } from "@orthanc-protocol/client";

const client = new LocalClient();

await client.syncText("user-123", "User likes hiking");
const result = await client.query("user-123", "What does the user like?");

console.log(result.memories);
```

## Configuration

The client accepts these options:

```typescript
const client = new OrthancsClient({
  endpoint: "https://api.orthanc.ai",
  apiKey: "your-api-key",
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  cache: {
    enabled: true,
    ttl: 60000,
    maxSize: 1000,
  },
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| endpoint | string | required | API endpoint URL |
| apiKey | string | required | Your API key |
| timeout | number | 30000 | Request timeout in milliseconds |
| retries | number | 3 | Number of retry attempts |
| retryDelay | number | 1000 | Base delay between retries |
| cache.enabled | boolean | false | Enable query caching |
| cache.ttl | number | 60000 | Cache TTL in milliseconds |
| cache.maxSize | number | 1000 | Maximum cached entries |

## The Protocol

The Orthanc Protocol is the standard interface for agent memory. Any backend that implements the protocol works with this SDK.

See the full protocol documentation in docs/protocol.md.

### Request format

```json
{
  "userId": "user-123",
  "messages": [{ "role": "user", "content": "What do I like?" }],
  "options": {
    "matchThreshold": 0.5,
    "matchCount": 5
  }
}
```

### Response format

```json
{
  "memories": ["User likes spicy food", "User prefers TypeScript"],
  "scores": [0.92, 0.87],
  "count": 2,
  "queryType": "vector_search",
  "latency_ms": 145
}
```

## Examples

The examples folder contains working code for common use cases:

- basic.ts: Simple query and response
- error-handling.ts: Handling all error types
- sync-memories.ts: Ingesting memories from different sources
- batch-operations.ts: Bulk create, update, delete
- export-import.ts: Data portability
- webhooks.ts: Real time notifications
- local-development.ts: Testing without an API
- caching.ts: Query caching
- langchain-integration.ts: Using with LangChain

## Building your own backend

The protocol is open. You can build your own memory backend that speaks the same language.

Your backend needs to implement these endpoints:

- POST /api/context: Query memory
- POST /api/sync: Ingest memory
- POST /api/memories/batch: Batch operations
- GET /api/memories/export: Export data
- POST /api/webhooks: Create webhook
- GET /api/health: Health check

See the protocol documentation for request and response formats.

## Why this matters

Memory is hard. Every project does it differently. Some use databases, some use vectors, some use graphs. The Orthanc Protocol says: here's the interface everyone should use.

Once your agent uses this SDK, switching between a local memory system and a cloud service is literally one line of code change.

This is the whole point. You build once, run anywhere.

## License

Apache 2.0

## Questions

Open an issue on GitHub or reach out on Discord.
