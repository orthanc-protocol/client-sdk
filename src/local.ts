/**
 * Local in-memory implementation for testing and development
 * This allows developers to test their agents without hitting an external API
 */

import type {
  QueryOptions,
  MemoryResponse,
  SyncRequest,
  SyncResponse,
  BatchRequest,
  BatchResponse,
  ExportResponse,
  QueryType,
  Memory,
} from "./types";

interface StoredMemory {
  id: string;
  userId: string;
  content: string;
  category?: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class LocalMemoryStore {
  private memories: Map<string, StoredMemory>;
  private idCounter: number;

  constructor() {
    this.memories = new Map();
    this.idCounter = 0;
  }

  private generateId(): string {
    this.idCounter += 1;
    return `mem_${this.idCounter.toString().padStart(8, "0")}`;
  }

  private getMemoriesForUser(userId: string): StoredMemory[] {
    return Array.from(this.memories.values()).filter(m => m.userId === userId);
  }

  private calculateSimilarity(query: string, content: string): number {
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const contentWords = new Set(content.toLowerCase().split(/\s+/));
    
    let matches = 0;
    for (const word of queryWords) {
      if (contentWords.has(word)) {
        matches += 1;
      }
    }

    if (queryWords.size === 0) return 0;
    return matches / queryWords.size;
  }

  private detectQueryType(query: string): QueryType {
    const lower = query.toLowerCase();

    if (/\b(do i|am i|did i)\b.*\b(like|love|hate|have|own|know)\b/.test(lower)) {
      return "graph_relation";
    }

    if (/\b(what do i|list my|show my|what are my)\b/.test(lower)) {
      return "graph_list";
    }

    if (/\b(who is|who are|who's)\b/.test(lower)) {
      return "graph_who";
    }

    return "vector_search";
  }

  async query(
    userId: string,
    query: string,
    options?: QueryOptions
  ): Promise<MemoryResponse> {
    const startTime = Date.now();
    const userMemories = this.getMemoriesForUser(userId);
    const threshold = options?.matchThreshold || 0.1;
    const limit = options?.matchCount || 5;

    const scored = userMemories
      .map(memory => ({
        memory,
        score: this.calculateSimilarity(query, memory.content),
      }))
      .filter(item => item.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const queryType = this.detectQueryType(query);

    return {
      memories: scored.map(s => s.memory.content),
      scores: scored.map(s => s.score),
      count: scored.length,
      queryType,
      latency_ms: Date.now() - startTime,
      requestId: `local_${Date.now()}`,
    };
  }

  async sync(request: SyncRequest): Promise<SyncResponse> {
    const startTime = Date.now();
    let memoriesCreated = 0;

    if (request.text) {
      const sentences = request.text.split(/[.!?]+/).filter(s => s.trim());
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (trimmed.length > 10) {
          const id = this.generateId();
          this.memories.set(id, {
            id,
            userId: request.userId,
            content: trimmed,
            category: request.options?.category,
            tags: request.options?.tags || [],
            metadata: request.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          memoriesCreated += 1;
        }
      }
    }

    if (request.messages) {
      for (const message of request.messages) {
        if (message.role === "user" && message.content.length > 10) {
          const id = this.generateId();
          this.memories.set(id, {
            id,
            userId: request.userId,
            content: message.content,
            category: request.options?.category,
            tags: request.options?.tags || [],
            metadata: request.metadata || {},
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          memoriesCreated += 1;
        }
      }
    }

    return {
      status: "completed",
      message: "Memories synced successfully",
      requestId: `local_${Date.now()}`,
      inputFormat: request.text ? "text" : "messages",
      result: {
        factsExtracted: memoriesCreated,
        memoriesInserted: memoriesCreated,
        memoriesUpdated: 0,
        memoriesSkipped: 0,
        latency_ms: Date.now() - startTime,
      },
    };
  }

  async batch(request: BatchRequest): Promise<BatchResponse> {
    let created = 0;
    let updated = 0;
    let deleted = 0;
    let failed = 0;
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < request.operations.length; i++) {
      const op = request.operations[i];

      try {
        switch (op.action) {
          case "create": {
            if (!op.text) {
              throw new Error("Text is required for create operation");
            }
            const id = this.generateId();
            this.memories.set(id, {
              id,
              userId: request.userId,
              content: op.text,
              category: op.options?.category,
              tags: op.options?.tags || [],
              metadata: {},
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            created += 1;
            break;
          }

          case "update": {
            if (!op.id) {
              throw new Error("ID is required for update operation");
            }
            const memory = this.memories.get(op.id);
            if (!memory || memory.userId !== request.userId) {
              throw new Error("Memory not found");
            }
            if (op.updates?.content) memory.content = op.updates.content;
            if (op.updates?.category) memory.category = op.updates.category;
            if (op.updates?.tags) memory.tags = op.updates.tags;
            memory.updatedAt = new Date();
            updated += 1;
            break;
          }

          case "delete": {
            if (!op.id) {
              throw new Error("ID is required for delete operation");
            }
            const existing = this.memories.get(op.id);
            if (!existing || existing.userId !== request.userId) {
              throw new Error("Memory not found");
            }
            this.memories.delete(op.id);
            deleted += 1;
            break;
          }
        }
      } catch (error) {
        failed += 1;
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return {
      processed: request.operations.length,
      results: { created, updated, deleted, failed },
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async export(userId?: string): Promise<ExportResponse> {
    const memories = userId
      ? this.getMemoriesForUser(userId)
      : Array.from(this.memories.values());

    const formatted: Memory[] = memories.map(m => ({
      id: m.id,
      content: m.content,
      score: 1,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      category: m.category,
      tags: m.tags,
      metadata: m.metadata,
    }));

    return {
      userId,
      exportedAt: new Date().toISOString(),
      total: formatted.length,
      count: formatted.length,
      hasMore: false,
      memories: formatted,
    };
  }

  clear(): void {
    this.memories.clear();
    this.idCounter = 0;
  }

  clearUser(userId: string): void {
    for (const [id, memory] of this.memories.entries()) {
      if (memory.userId === userId) {
        this.memories.delete(id);
      }
    }
  }

  getStats(): { totalMemories: number; users: number } {
    const users = new Set(Array.from(this.memories.values()).map(m => m.userId));
    return {
      totalMemories: this.memories.size,
      users: users.size,
    };
  }
}

export class LocalClient {
  private store: LocalMemoryStore;

  constructor() {
    this.store = new LocalMemoryStore();
  }

  async query(
    userId: string,
    query: string,
    options?: QueryOptions
  ): Promise<MemoryResponse> {
    return this.store.query(userId, query, options);
  }

  async sync(request: SyncRequest): Promise<SyncResponse> {
    return this.store.sync(request);
  }

  async syncMessages(
    userId: string,
    messages: Array<{ role: string; content: string }>,
    options?: SyncRequest["options"]
  ): Promise<SyncResponse> {
    return this.store.sync({ userId, messages, options });
  }

  async syncText(
    userId: string,
    text: string,
    options?: SyncRequest["options"]
  ): Promise<SyncResponse> {
    return this.store.sync({ userId, text, options });
  }

  async batch(request: BatchRequest): Promise<BatchResponse> {
    return this.store.batch(request);
  }

  async createMemory(
    userId: string,
    text: string,
    options?: SyncRequest["options"]
  ): Promise<BatchResponse> {
    return this.store.batch({
      userId,
      operations: [{ action: "create", text, options }],
    });
  }

  async deleteMemory(userId: string, memoryId: string): Promise<BatchResponse> {
    return this.store.batch({
      userId,
      operations: [{ action: "delete", id: memoryId }],
    });
  }

  async export(userId?: string): Promise<ExportResponse> {
    return this.store.export(userId);
  }

  clear(): void {
    this.store.clear();
  }

  clearUser(userId: string): void {
    this.store.clearUser(userId);
  }

  getStats(): { totalMemories: number; users: number } {
    return this.store.getStats();
  }
}
