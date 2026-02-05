import { describe, it, expect, beforeEach } from "vitest";
import { LocalClient, LocalMemoryStore } from "../local";

describe("LocalMemoryStore", () => {
  let store: LocalMemoryStore;

  beforeEach(() => {
    store = new LocalMemoryStore();
  });

  describe("query", () => {
    it("should return empty results for empty store", async () => {
      const result = await store.query("user-1", "What do I like?");

      expect(result.memories).toEqual([]);
      expect(result.count).toBe(0);
    });

    it("should find matching memories", async () => {
      await store.sync({
        userId: "user-1",
        text: "User likes coffee. User likes hiking.",
      });

      const result = await store.query("user-1", "coffee");

      expect(result.count).toBeGreaterThan(0);
      expect(result.memories.some(m => m.toLowerCase().includes("coffee"))).toBe(true);
    });

    it("should only return memories for the specified user", async () => {
      await store.sync({ userId: "user-1", text: "User likes coffee" });
      await store.sync({ userId: "user-2", text: "User likes tea" });

      const result = await store.query("user-1", "likes");

      expect(result.memories.every(m => !m.toLowerCase().includes("tea"))).toBe(true);
    });

    it("should respect matchCount option", async () => {
      await store.sync({
        userId: "user-1",
        text: "Fact one. Fact two. Fact three. Fact four. Fact five.",
      });

      const result = await store.query("user-1", "fact", { matchCount: 2 });

      expect(result.memories.length).toBeLessThanOrEqual(2);
    });

    it("should include latency_ms in response", async () => {
      const result = await store.query("user-1", "test");

      expect(typeof result.latency_ms).toBe("number");
      expect(result.latency_ms).toBeGreaterThanOrEqual(0);
    });

    it("should detect query type", async () => {
      await store.sync({ userId: "user-1", text: "User likes pizza" });

      const relationResult = await store.query("user-1", "Do I like pizza?");
      expect(relationResult.queryType).toBe("graph_relation");

      const listResult = await store.query("user-1", "What do I like?");
      expect(listResult.queryType).toBe("graph_list");

      const whoResult = await store.query("user-1", "Who is my friend?");
      expect(whoResult.queryType).toBe("graph_who");

      const vectorResult = await store.query("user-1", "Tell me about my preferences");
      expect(vectorResult.queryType).toBe("vector_search");
    });
  });

  describe("sync", () => {
    it("should sync text and split into sentences", async () => {
      const result = await store.sync({
        userId: "user-1",
        text: "First sentence here. Second sentence here. Third one.",
      });

      expect(result.status).toBe("completed");
      expect(result.inputFormat).toBe("text");
      expect(result.memoriesCreated).toBeGreaterThan(0);
    });

    it("should sync messages", async () => {
      const result = await store.sync({
        userId: "user-1",
        messages: [
          { role: "user", content: "I love programming in TypeScript" },
          { role: "assistant", content: "That's great!" },
        ],
      });

      expect(result.status).toBe("completed");
      expect(result.inputFormat).toBe("messages");
      expect(result.memoriesCreated).toBe(1);
    });

    it("should ignore short text segments", async () => {
      const result = await store.sync({
        userId: "user-1",
        text: "Hi. Ok. Yes. This is a longer sentence that should be stored.",
      });

      expect(result.memoriesCreated).toBe(1);
    });
  });

  describe("batch", () => {
    it("should create memories", async () => {
      const result = await store.batch({
        userId: "user-1",
        operations: [
          { action: "create", text: "User likes coffee" },
          { action: "create", text: "User likes tea" },
        ],
      });

      expect(result.processed).toBe(2);
      expect(result.results.created).toBe(2);
      expect(result.results.failed).toBe(0);
    });

    it("should update memories", async () => {
      await store.sync({ userId: "user-1", text: "User likes coffee very much" });

      const exported = await store.export("user-1");
      const memoryId = exported.memories[0].id;

      const result = await store.batch({
        userId: "user-1",
        operations: [
          { action: "update", id: memoryId, updates: { category: "food" } },
        ],
      });

      expect(result.results.updated).toBe(1);
    });

    it("should delete memories", async () => {
      await store.sync({ userId: "user-1", text: "User likes coffee very much" });

      const exported = await store.export("user-1");
      const memoryId = exported.memories[0].id;

      const result = await store.batch({
        userId: "user-1",
        operations: [{ action: "delete", id: memoryId }],
      });

      expect(result.results.deleted).toBe(1);

      const afterDelete = await store.export("user-1");
      expect(afterDelete.memories.length).toBe(0);
    });

    it("should report errors for invalid operations", async () => {
      const result = await store.batch({
        userId: "user-1",
        operations: [
          { action: "create", text: "Valid memory" },
          { action: "delete", id: "nonexistent-id" },
          { action: "update", id: "also-nonexistent" },
        ],
      });

      expect(result.results.created).toBe(1);
      expect(result.results.failed).toBe(2);
      expect(result.errors?.length).toBe(2);
    });

    it("should fail create without text", async () => {
      const result = await store.batch({
        userId: "user-1",
        operations: [{ action: "create" }],
      });

      expect(result.results.failed).toBe(1);
      expect(result.errors?.[0].error).toContain("Text is required");
    });
  });

  describe("export", () => {
    it("should export all memories for a user", async () => {
      await store.sync({ userId: "user-1", text: "Memory one. Memory two." });
      await store.sync({ userId: "user-2", text: "Memory three." });

      const result = await store.export("user-1");

      expect(result.memories.length).toBe(2);
      expect(result.total).toBe(2);
      expect(result.hasMore).toBe(false);
    });

    it("should export all memories when no user specified", async () => {
      await store.sync({ userId: "user-1", text: "Memory one here." });
      await store.sync({ userId: "user-2", text: "Memory two here." });

      const result = await store.export();

      expect(result.memories.length).toBe(2);
    });

    it("should include memory metadata", async () => {
      await store.sync({
        userId: "user-1",
        text: "User likes coffee very much",
        options: { category: "food", tags: ["preference"] },
      });

      const result = await store.export("user-1");
      const memory = result.memories[0];

      expect(memory.id).toBeDefined();
      expect(memory.content).toBeDefined();
      expect(memory.createdAt).toBeDefined();
    });
  });

  describe("clear", () => {
    it("should remove all memories", async () => {
      await store.sync({ userId: "user-1", text: "Memory one here." });
      await store.sync({ userId: "user-2", text: "Memory two here." });

      store.clear();

      const result = await store.export();
      expect(result.memories.length).toBe(0);
    });
  });

  describe("clearUser", () => {
    it("should remove only specified user memories", async () => {
      await store.sync({ userId: "user-1", text: "Memory one here." });
      await store.sync({ userId: "user-2", text: "Memory two here." });

      store.clearUser("user-1");

      const result = await store.export();
      expect(result.memories.length).toBe(1);
    });
  });

  describe("getStats", () => {
    it("should return correct stats", async () => {
      await store.sync({ userId: "user-1", text: "Memory one. Memory two." });
      await store.sync({ userId: "user-2", text: "Memory three." });

      const stats = store.getStats();

      expect(stats.totalMemories).toBe(3);
      expect(stats.users).toBe(2);
    });
  });
});

describe("LocalClient", () => {
  let client: LocalClient;

  beforeEach(() => {
    client = new LocalClient();
  });

  it("should provide same interface as OrthancsClient", async () => {
    expect(typeof client.query).toBe("function");
    expect(typeof client.sync).toBe("function");
    expect(typeof client.syncMessages).toBe("function");
    expect(typeof client.syncText).toBe("function");
    expect(typeof client.batch).toBe("function");
    expect(typeof client.createMemory).toBe("function");
    expect(typeof client.deleteMemory).toBe("function");
    expect(typeof client.export).toBe("function");
    expect(typeof client.clear).toBe("function");
    expect(typeof client.clearUser).toBe("function");
    expect(typeof client.getStats).toBe("function");
  });

  it("should work end to end", async () => {
    await client.syncText("user-1", "User loves hiking in the mountains");
    await client.createMemory("user-1", "User has a dog named Max");

    const result = await client.query("user-1", "What does the user love?");

    expect(result.count).toBeGreaterThan(0);

    const exported = await client.export("user-1");
    expect(exported.memories.length).toBe(2);

    const stats = client.getStats();
    expect(stats.totalMemories).toBe(2);
    expect(stats.users).toBe(1);

    client.clear();
    expect(client.getStats().totalMemories).toBe(0);
  });
});
