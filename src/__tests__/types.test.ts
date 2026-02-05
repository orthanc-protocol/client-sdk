import { describe, it, expect } from "vitest";
import type {
  QueryType,
  TimeFilter,
  SourceType,
  QueryOptions,
  MemoryQuery,
  Memory,
  MemoryResponse,
  SyncRequest,
  SyncResponse,
  BatchOperation,
  BatchRequest,
  BatchResponse,
  ClientConfig,
} from "../types";

describe("Type definitions", () => {
  describe("QueryType", () => {
    it("should accept valid query types", () => {
      const types: QueryType[] = [
        "graph_relation",
        "graph_list",
        "graph_who",
        "vector_search",
        "hybrid",
      ];

      expect(types.length).toBe(5);
    });
  });

  describe("TimeFilter", () => {
    it("should accept valid time filters", () => {
      const filters: TimeFilter[] = [
        "hour",
        "day",
        "week",
        "month",
        "year",
        "all",
      ];

      expect(filters.length).toBe(6);
    });
  });

  describe("SourceType", () => {
    it("should accept valid source types", () => {
      const sources: SourceType[] = [
        "api",
        "chat",
        "voice",
        "file_upload",
        "import",
        "webhook",
        "sdk",
      ];

      expect(sources.length).toBe(7);
    });
  });

  describe("QueryOptions", () => {
    it("should allow partial options", () => {
      const options: QueryOptions = {
        matchThreshold: 0.5,
      };

      expect(options.matchThreshold).toBe(0.5);
      expect(options.matchCount).toBeUndefined();
    });

    it("should allow all options", () => {
      const options: QueryOptions = {
        matchThreshold: 0.5,
        matchCount: 10,
        timeFilter: "week",
        includeMetadata: true,
      };

      expect(options.timeFilter).toBe("week");
    });
  });

  describe("MemoryQuery", () => {
    it("should require userId and query", () => {
      const query: MemoryQuery = {
        userId: "user-123",
        query: "What do I like?",
      };

      expect(query.userId).toBe("user-123");
      expect(query.query).toBe("What do I like?");
    });
  });

  describe("Memory", () => {
    it("should have required fields", () => {
      const memory: Memory = {
        id: "mem-123",
        content: "User likes coffee",
        score: 0.95,
        createdAt: "2026-02-04T12:00:00Z",
      };

      expect(memory.id).toBeDefined();
      expect(memory.content).toBeDefined();
      expect(memory.score).toBeDefined();
      expect(memory.createdAt).toBeDefined();
    });

    it("should allow optional fields", () => {
      const memory: Memory = {
        id: "mem-123",
        content: "User likes coffee",
        score: 0.95,
        createdAt: "2026-02-04T12:00:00Z",
        updatedAt: "2026-02-04T13:00:00Z",
        category: "food",
        tags: ["preference"],
        metadata: { source: "chat" },
      };

      expect(memory.category).toBe("food");
      expect(memory.tags).toContain("preference");
    });
  });

  describe("MemoryResponse", () => {
    it("should have required fields", () => {
      const response: MemoryResponse = {
        memories: ["User likes coffee"],
        scores: [0.95],
        count: 1,
        queryType: "vector_search",
        latency_ms: 150,
        requestId: "test-123",
      };

      expect(response.memories.length).toBe(1);
      expect(response.scores.length).toBe(1);
      expect(response.requestId).toBe("test-123");
    });
  });

  describe("SyncRequest", () => {
    it("should allow messages format", () => {
      const request: SyncRequest = {
        userId: "user-123",
        messages: [
          { role: "user", content: "I like coffee" },
        ],
      };

      expect(request.messages?.length).toBe(1);
    });

    it("should allow text format", () => {
      const request: SyncRequest = {
        userId: "user-123",
        text: "User likes coffee",
      };

      expect(request.text).toBeDefined();
    });
  });

  describe("SyncResponse", () => {
    it("should have required fields", () => {
      const response: SyncResponse = {
        status: "completed",
        message: "Sync completed",
        requestId: "test-123",
        inputFormat: "messages",
      };

      expect(response.status).toBe("completed");
      expect(response.requestId).toBe("test-123");
    });
  });

  describe("BatchOperation", () => {
    it("should support create action", () => {
      const op: BatchOperation = {
        action: "create",
        text: "New memory",
      };

      expect(op.action).toBe("create");
    });

    it("should support update action", () => {
      const op: BatchOperation = {
        action: "update",
        id: "mem-123",
        updates: { category: "food" },
      };

      expect(op.action).toBe("update");
    });

    it("should support delete action", () => {
      const op: BatchOperation = {
        action: "delete",
        id: "mem-123",
      };

      expect(op.action).toBe("delete");
    });
  });

  describe("BatchRequest", () => {
    it("should have userId and operations", () => {
      const request: BatchRequest = {
        userId: "user-123",
        operations: [
          { action: "create", text: "Memory" },
        ],
      };

      expect(request.operations.length).toBe(1);
    });
  });

  describe("BatchResponse", () => {
    it("should have processed count and results", () => {
      const response: BatchResponse = {
        processed: 3,
        results: {
          created: 1,
          updated: 1,
          deleted: 1,
          failed: 0,
        },
      };

      expect(response.processed).toBe(3);
      expect(response.results.created).toBe(1);
    });
  });

  describe("ClientConfig", () => {
    it("should require endpoint and apiKey", () => {
      const config: ClientConfig = {
        endpoint: "https://api.orthanc.ai",
        apiKey: "sk-test",
      };

      expect(config.endpoint).toBeDefined();
      expect(config.apiKey).toBeDefined();
    });

    it("should allow optional fields", () => {
      const config: ClientConfig = {
        endpoint: "https://api.orthanc.ai",
        apiKey: "sk-test",
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
        cache: {
          enabled: true,
          ttl: 60000,
          maxSize: 1000,
        },
      };

      expect(config.timeout).toBe(30000);
      expect(config.cache?.enabled).toBe(true);
    });
  });
});
