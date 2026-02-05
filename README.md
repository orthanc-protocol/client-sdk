# Orthanc Client SDK

The open source SDK for querying agent memory. Build with a standard interface that works everywhere.

## What is this

Orthanc Client SDK is a universal way to query long term memory for AI agents. Whether you're building a chatbot, a support agent, or an autonomous system, this SDK gives you one interface that works locally or in the cloud.

Think of it like this: instead of every AI project building memory differently, they all speak the same language through the Orthanc Protocol.

## Why it matters

Memory is hard. Every project does it differently. Some use databases, some use vectors, some use graphs. The Orthanc Protocol says: here's the interface everyone should use.

Once your agent uses this SDK, switching between a local memory system and a cloud service is literally one line of code change.

## Quick start

Install the SDK:

```bash
npm install @orthanc-protocol/client
```

Use it in your agent:

```typescript
import { OrthancsClient } from '@orthanc-protocol/client';

const client = new OrthancsClient({
  endpoint: 'https://api.orthanc.ai',
  apiKey: 'your-api-key'
});

// Query memory
const memories = await client.query('user-123', 'What do I like?');
console.log(memories);
```

That's it. Your agent now has access to long term memory.

## How it works

When you call client.query(), the SDK sends a standardized request to your memory backend. The backend returns relevant memories in a standard format.

The backend could be running locally on your machine, on your own servers, or on Orthanc's cloud platform. The SDK doesn't care. The interface is the same.

This is the whole point. You build once, run anywhere.

## The Protocol

The Orthanc Protocol is simple. Every memory backend accepts these requests:

```json
{
  "userId": "user-123",
  "query": "What do I like?",
  "options": {
    "matchThreshold": 0.5,
    "matchCount": 5
  }
}
```

And returns results like this:

```json
{
  "memories": [
    "User likes spicy food",
    "User prefers TypeScript over Python"
  ],
  "scores": [0.92, 0.87],
  "queryType": "vector_search",
  "latency_ms": 145
}
```

That's the entire protocol. Simple, standardized, works everywhere.

## Use cases

Local development. You can run the full memory stack locally to test your agent without hitting any external APIs.

Cloud production. Switch to api.orthanc.ai when you're ready to scale. Same code, just a different endpoint.

Self hosted. Run your own memory backend on your infrastructure. The protocol means you can still use this SDK.

## Building your own backend

The protocol is open. You can build your own memory backend that speaks the same language as Orthanc.

Check out the reference implementation to see how. It covers graph lookups, vector search, re ranking, and more.

## Next steps

Read the full protocol documentation to understand the request and response formats.

Check the examples folder to see real world usage patterns.

Join the community to discuss memory systems and share what you're building.

## License

Apache 2.0. You're free to use this however you want.

## Questions

Reach out on Discord or open an issue on GitHub. The community is here to help.
