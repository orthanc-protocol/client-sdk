# The Orthanc Protocol

This document describes the standard interface for querying agent memory systems.

## Overview

The Orthanc Protocol defines how agents request memory and how memory systems respond. It's simple, universal, and works everywhere.

By implementing this protocol, your memory backend becomes compatible with any client built on the Orthanc SDK.

## Request Format

Every memory query follows this structure:

```json
{
  "userId": "user-123",
  "query": "What do I like?",
  "options": {
    "matchThreshold": 0.5,
    "matchCount": 5,
    "timeFilter": "all"
  }
}
```

Field descriptions:

- userId: Your application's user identifier. This is how the memory system knows which user's memories to search.
- query: What the agent is asking for. Can be a question, a statement, or anything that helps identify relevant memories.
- options: Optional configuration for the query behavior.
  - matchThreshold: Minimum relevance score (0 to 1). Lower values return more results but less relevant ones.
  - matchCount: Maximum number of memories to return. Default is 5.
  - timeFilter: How far back to search. Options are hour, day, week, month, year, or all.

## Response Format

Every memory backend returns results in this format:

```json
{
  "memories": [
    "User likes spicy food",
    "User prefers TypeScript over Python"
  ],
  "scores": [0.92, 0.87],
  "count": 2,
  "queryType": "vector_search",
  "latency_ms": 145,
  "graphAnswer": null
}
```

Field descriptions:

- memories: Array of relevant memories as strings.
- scores: Relevance scores for each memory (0 to 1, where 1 is perfect match).
- count: Number of memories returned.
- queryType: How the query was answered. Can be graph_relation, graph_list, vector_search, or hybrid.
- latency_ms: How long the query took in milliseconds.
- graphAnswer: If the query was answered by a graph lookup, this contains the direct answer. Otherwise null.

## Query Types

The protocol supports different query types for different question patterns:

### graph_relation

Pattern: "Do I like X?" "Am I allergic to X?" "Do I own X?"

These queries look up a specific relationship in a graph structure. Very fast, usually under 10ms.

Response includes graphAnswer with the direct result.

### graph_list

Pattern: "What do I love?" "What are my allergies?" "List my pets"

These queries traverse a graph to find all items matching a relationship.

Response includes graphAnswer with a summary.

### vector_search

Pattern: "Tell me about my projects" "What have I been working on?" Open ended questions

These queries use semantic search to find related memories.

No graphAnswer, but scores indicate relevance.

### hybrid

Pattern: Long complex queries with multiple topics

These queries combine both graph and vector search for comprehensive results.

May include graphAnswer plus additional vector results.

## Implementing the Protocol

To build a memory backend that speaks Orthanc, you need to:

1. Accept POST requests at /api/context with the request format above
2. Parse userId and query
3. Detect the query type (you can use heuristics or a classifier)
4. For graph queries, perform graph lookups
5. For vector queries, embed the query and search similar memories
6. Return results in the response format above

The reference implementation shows how to do all of this.

## Standards

All memory systems using the Orthanc Protocol should follow these standards:

- Latency target: under 350ms for 95th percentile
- Scores: Always return between 0 and 1
- Timestamps: Store all memories with created_at
- User isolation: Ensure queries only return that user's memories
- Error handling: Return HTTP 400 for bad requests, 500 for server errors

## Why this matters

By standardizing the interface, we make it possible to:

- Build once, run anywhere. Your code doesn't change when you switch backends.
- Compare different memory systems. They all speak the same language.
- Focus on what matters. You think about your agent's behavior, not memory infrastructure.
- Create a community ecosystem. Anyone can build a memory backend or integrate with Orthanc.

This is the goal. Make agent memory a solved problem.
