# The Orthanc Protocol

This document describes the complete interface for querying agent memory systems.

## Overview

The Orthanc Protocol defines how agents request memory and how memory systems respond. By implementing this protocol, your memory backend becomes compatible with any client built on the Orthanc SDK.

## Authentication

All requests require a Bearer token in the Authorization header:

```
Authorization: Bearer sk-mem-xxx
```

The token is issued when you create an account and is tied to your project.

## Endpoints

### Query Memory

Retrieve relevant memories for a user query.

```
POST /api/context
```

Request body:

```json
{
  "userId": "user-123",
  "messages": [
    { "role": "user", "content": "What do I like?" }
  ],
  "options": {
    "matchThreshold": 0.5,
    "matchCount": 5,
    "timeFilter": "all",
    "includeMetadata": false
  }
}
```

Response:

```json
{
  "memories": [
    "User likes spicy food",
    "User prefers TypeScript over Python"
  ],
  "scores": [0.92, 0.87],
  "count": 2,
  "queryType": "question_match",
  "latency_ms": 145,
  "requestId": "abc123",
  "dateFilter": {
    "startDate": null,
    "endDate": null,
    "detected": false,
    "originalPhrase": null
  },
  "piiRedacted": true
}
```

### Sync Memory

Ingest new memories from messages or text.

```
POST /api/sync
```

Request body with messages:

```json
{
  "userId": "user-123",
  "messages": [
    { "role": "user", "content": "I love hiking and my dog is named Max" },
    { "role": "assistant", "content": "That's great!" }
  ],
  "options": {
    "source": "chat",
    "sourceName": "Mobile App",
    "infer": true,
    "sync": false,
    "tags": ["preference"],
    "importance": 8,
    "category": "hobby"
  },
  "metadata": {
    "conversation_id": "conv-456"
  }
}
```

Request body with raw text:

```json
{
  "userId": "user-123",
  "text": "User loves hiking and has a dog named Max",
  "options": {
    "source": "import",
    "infer": false
  }
}
```

Response:

```json
{
  "status": "queued",
  "message": "Memory sync queued for processing",
  "requestId": "a7e3da27",
  "inputFormat": "messages",
  "result": {
    "factsExtracted": 3,
    "memoriesInserted": 3,
    "memoriesUpdated": 0,
    "memoriesSkipped": 0,
    "latency_ms": 975
  }
}
```

### Batch Operations

Perform multiple memory operations in a single request.

```
POST /api/memories/batch
```

Request body:

```json
{
  "userId": "user-123",
  "operations": [
    {
      "action": "create",
      "text": "User likes coffee"
    },
    {
      "action": "update",
      "id": "mem-uuid-1",
      "updates": {
        "category": "food",
        "tags": ["preference", "beverage"]
      }
    },
    {
      "action": "delete",
      "id": "mem-uuid-2"
    }
  ]
}
```

Response:

```json
{
  "processed": 3,
  "results": {
    "created": 1,
    "updated": 1,
    "deleted": 1,
    "failed": 0
  }
}
```

With errors:

```json
{
  "processed": 3,
  "results": {
    "created": 1,
    "updated": 0,
    "deleted": 1,
    "failed": 1
  },
  "errors": [
    {
      "index": 1,
      "error": "Memory not found"
    }
  ]
}
```

### Export Memories

Export memories for data portability.

```
GET /api/memories/export?userId=user-123&limit=100&offset=0&format=json
```

Query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| userId | string | none | Filter by user |
| limit | number | 100 | Max memories to return |
| offset | number | 0 | Pagination offset |
| format | string | json | Response format (json or csv) |
| includeEmbeddings | boolean | false | Include embedding vectors |

Response:

```json
{
  "userId": "user-123",
  "exportedAt": "2026-02-04T12:00:00Z",
  "total": 247,
  "count": 100,
  "hasMore": true,
  "memories": [
    {
      "id": "mem-uuid",
      "content": "User likes coffee",
      "score": 1,
      "createdAt": "2026-01-15T10:30:00Z",
      "category": "food",
      "tags": ["preference"],
      "metadata": {}
    }
  ]
}
```

### Webhooks

Create webhooks for real-time notifications.

```
POST /api/webhooks
```

Request body:

```json
{
  "url": "https://your-server.com/webhook",
  "events": ["memory.created", "memory.updated", "memory.deleted"],
  "secret": "your-hmac-secret",
  "name": "Production Webhook"
}
```

Response:

```json
{
  "webhook": {
    "id": "wh-uuid",
    "url": "https://your-server.com/webhook",
    "events": ["memory.created", "memory.updated", "memory.deleted"],
    "enabled": true,
    "createdAt": "2026-02-04T12:00:00Z"
  }
}
```

List webhooks:

```
GET /api/webhooks
```

Get webhook:

```
GET /api/webhooks/{id}
```

Update webhook:

```
PATCH /api/webhooks/{id}
```

Delete webhook:

```
DELETE /api/webhooks/{id}
```

### Health Check

Check the status of the memory backend.

```
GET /api/health
```

Response:

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "latency_ms": 5,
  "services": {
    "database": "up",
    "embeddings": "up",
    "inference": "up"
  }
}
```

## Query Types

The protocol supports different query types for different question patterns.

### graph_relation

Pattern: "Do I like X?" "Am I allergic to X?" "Do I own X?"

These queries look up a specific relationship in a graph structure. Very fast, usually under 10ms.

Response includes graphAnswer with the direct result.

### graph_list

Pattern: "What do I love?" "What are my allergies?" "List my pets"

These queries traverse a graph to find all items matching a relationship.

Response includes graphAnswer with a summary.

### graph_who

Pattern: "Who is my wife?" "Who is my manager?"

These queries look up a specific entity relationship.

Response includes graphAnswer with the name or identifier.

### question_match

Pattern: "What is my job?" "What are my hobbies?" "Where do I live?"

These queries match against pre-computed question embeddings for ultra-fast retrieval. This is the most common query type and the fastest path.

No graphAnswer, but scores indicate relevance. Typical latency: 100-150ms.

### vector_search

Pattern: "Tell me about my projects" "What have I been working on?"

These queries use semantic search to find related memories when question_match doesn't find results.

No graphAnswer, but scores indicate relevance.

### hybrid

Pattern: Long complex queries with multiple topics.

These queries combine both graph and vector search for comprehensive results.

May include graphAnswer plus additional vector results.

## Time Filters

The timeFilter option restricts results to a specific time window:

| Value | Description |
|-------|-------------|
| hour | Last 60 minutes |
| day | Last 24 hours |
| week | Last 7 days |
| month | Last 30 days |
| year | Last 365 days |
| all | No time restriction |

## Source Types

When syncing memories, the source field tracks where the memory came from:

| Value | Description |
|-------|-------------|
| api | Direct API call |
| chat | Chat conversation |
| voice | Voice transcription |
| file_upload | Uploaded file |
| import | Bulk import |
| webhook | External webhook |
| sdk | SDK client |

## Webhook Events

Webhooks can subscribe to these events:

| Event | Description |
|-------|-------------|
| memory.created | New memory stored |
| memory.updated | Memory updated (contradiction resolved) |
| memory.deleted | Memory removed |
| memory.batch_created | Batch operation created memories |
| memory.batch_deleted | Batch operation deleted memories |

Webhook payload:

```json
{
  "event": "memory.created",
  "timestamp": "2026-02-04T12:00:00Z",
  "data": {
    "userId": "user-123",
    "memories": ["User likes coffee"],
    "source": "chat"
  }
}
```

If a secret is provided, requests include an X-Webhook-Signature header with HMAC-SHA256 signature.

## Error Responses

All errors follow this format:

```json
{
  "error": "Description of what went wrong",
  "code": "ERROR_CODE",
  "requestId": "abc123"
}
```

Error codes:

| Code | Status | Description |
|------|--------|-------------|
| MISSING_AUTH | 401 | No Authorization header |
| INVALID_AUTH | 401 | Invalid API key |
| AUTHORIZATION_ERROR | 403 | Not authorized for this resource |
| VALIDATION_ERROR | 400 | Invalid request body |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMIT_ERROR | 429 | Too many requests |
| USAGE_LIMIT_ERROR | 429 | Monthly usage limit exceeded |
| TIMEOUT | 408 | Request timed out |
| SERVER_ERROR | 500 | Internal server error |

## Rate Limiting

Rate limits are enforced per API key:

| Plan | Requests per minute |
|------|---------------------|
| Starter | 60 |
| Pro | 600 |
| Scale | 3000 |

Rate limit headers are included in all responses:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1707048000
```

## Standards

All memory systems using the Orthanc Protocol should follow these standards:

1. Latency target: under 350ms for 95th percentile
2. Scores: Always return between 0 and 1
3. Timestamps: Store all memories with created_at in ISO 8601 format
4. User isolation: Ensure queries only return that user's memories
5. Error handling: Return appropriate HTTP status codes with error details
6. Request IDs: Include X-Request-ID header in all responses

## Implementing the Protocol

To build a memory backend that speaks Orthanc:

1. Accept POST requests at /api/context with the query format
2. Accept POST requests at /api/sync with the sync format
3. Accept POST requests at /api/memories/batch with the batch format
4. Accept GET requests at /api/memories/export with query parameters
5. Implement webhook management at /api/webhooks
6. Return responses in the documented formats
7. Include rate limit headers
8. Include request ID headers

The reference implementation in this repository shows how to do all of this.
