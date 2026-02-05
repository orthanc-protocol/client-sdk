/**
 * Orthanc Client SDK
 * Universal interface for querying agent memory
 */

import type {
  ClientConfig,
  QueryOptions,
  MemoryResponse,
  DetailedMemoryResponse,
  SyncRequest,
  SyncResponse,
  BatchRequest,
  BatchResponse,
  ExportOptions,
  ExportResponse,
  Webhook,
  WebhookCreateRequest,
  HealthResponse,
  RequestMetadata,
} from "./types";

import {
  OrthancsError,
  NetworkError,
  TimeoutError,
  parseErrorResponse,
  isRetryable,
} from "./errors";

import { QueryCache } from "./cache";

export class OrthancsClient {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly timeout: number;
  private readonly retries: number;
  private readonly retryDelay: number;
  private readonly cache: QueryCache | null;

  constructor(config: ClientConfig) {
    this.endpoint = config.endpoint.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.cache = config.cache?.enabled ? new QueryCache(config.cache) : null;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    attempt: number = 1
  ): Promise<{ data: T; metadata: RequestMetadata }> {
    const url = `${this.endpoint}${path}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const requestId = response.headers.get("X-Request-ID") || undefined;
      const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
      const rateLimitReset = response.headers.get("X-RateLimit-Reset");

      if (!response.ok) {
        let errorBody;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = { error: response.statusText };
        }

        const error = parseErrorResponse(response.status, errorBody, requestId);

        if (isRetryable(error) && attempt < this.retries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
          return this.request<T>(method, path, body, attempt + 1);
        }

        throw error;
      }

      const data = await response.json();
      const metadata: RequestMetadata = {
        requestId: requestId || "",
        latency_ms: data.latency_ms || 0,
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining, 10) : undefined,
        rateLimitReset: rateLimitReset ? parseInt(rateLimitReset, 10) : undefined,
      };

      return { data, metadata };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof OrthancsError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          const timeoutError = new TimeoutError(`Request timed out after ${this.timeout}ms`);
          if (attempt < this.retries) {
            const delay = this.retryDelay * Math.pow(2, attempt - 1);
            await this.sleep(delay);
            return this.request<T>(method, path, body, attempt + 1);
          }
          throw timeoutError;
        }

        const networkError = new NetworkError(error.message);
        if (attempt < this.retries) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          await this.sleep(delay);
          return this.request<T>(method, path, body, attempt + 1);
        }
        throw networkError;
      }

      throw new NetworkError("Unknown network error");
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async query(
    userId: string,
    query: string,
    options?: QueryOptions
  ): Promise<MemoryResponse> {
    if (this.cache) {
      const cached = this.cache.get<MemoryResponse>(userId, query, options);
      if (cached) {
        return cached;
      }
    }

    const { data } = await this.request<MemoryResponse>("POST", "/api/context", {
      userId,
      messages: [{ role: "user", content: query }],
      options,
    });

    if (this.cache) {
      this.cache.set(userId, query, data, options);
    }

    return data;
  }

  async queryDetailed(
    userId: string,
    query: string,
    options?: QueryOptions & { offset?: number; limit?: number }
  ): Promise<DetailedMemoryResponse> {
    const { data } = await this.request<DetailedMemoryResponse>("POST", "/api/context", {
      userId,
      messages: [{ role: "user", content: query }],
      options: {
        ...options,
        includeMetadata: true,
      },
    });

    return data;
  }

  async queryBatch(
    queries: Array<{ userId: string; query: string; options?: QueryOptions }>
  ): Promise<MemoryResponse[]> {
    const results = await Promise.all(
      queries.map(q => this.query(q.userId, q.query, q.options))
    );
    return results;
  }

  async sync(request: SyncRequest): Promise<SyncResponse> {
    const { data } = await this.request<SyncResponse>("POST", "/api/sync", request);

    if (this.cache && request.userId) {
      this.cache.invalidate(request.userId);
    }

    return data;
  }

  async syncMessages(
    userId: string,
    messages: Array<{ role: string; content: string }>,
    options?: SyncRequest["options"]
  ): Promise<SyncResponse> {
    return this.sync({ userId, messages, options });
  }

  async syncText(
    userId: string,
    text: string,
    options?: SyncRequest["options"]
  ): Promise<SyncResponse> {
    return this.sync({ userId, text, options });
  }

  async batch(request: BatchRequest): Promise<BatchResponse> {
    const { data } = await this.request<BatchResponse>("POST", "/api/memories/batch", request);

    if (this.cache) {
      this.cache.invalidate(request.userId);
    }

    return data;
  }

  async createMemory(
    userId: string,
    text: string,
    options?: SyncRequest["options"]
  ): Promise<BatchResponse> {
    return this.batch({
      userId,
      operations: [{ action: "create", text, options }],
    });
  }

  async updateMemory(
    userId: string,
    memoryId: string,
    updates: { content?: string; category?: string; tags?: string[] }
  ): Promise<BatchResponse> {
    return this.batch({
      userId,
      operations: [{ action: "update", id: memoryId, updates }],
    });
  }

  async deleteMemory(userId: string, memoryId: string): Promise<BatchResponse> {
    return this.batch({
      userId,
      operations: [{ action: "delete", id: memoryId }],
    });
  }

  async deleteAllMemories(userId: string, memoryIds: string[]): Promise<BatchResponse> {
    return this.batch({
      userId,
      operations: memoryIds.map(id => ({ action: "delete", id })),
    });
  }

  async export(options?: ExportOptions): Promise<ExportResponse> {
    const params = new URLSearchParams();
    if (options?.userId) params.set("userId", options.userId);
    if (options?.limit) params.set("limit", options.limit.toString());
    if (options?.offset) params.set("offset", options.offset.toString());
    if (options?.format) params.set("format", options.format);
    if (options?.includeEmbeddings) params.set("includeEmbeddings", "true");

    const queryString = params.toString();
    const path = `/api/memories/export${queryString ? `?${queryString}` : ""}`;

    const { data } = await this.request<ExportResponse>("GET", path);
    return data;
  }

  async exportAll(userId: string): Promise<ExportResponse["memories"]> {
    const memories: ExportResponse["memories"] = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    while (hasMore) {
      const response = await this.export({ userId, offset, limit });
      memories.push(...response.memories);
      hasMore = response.hasMore;
      offset += limit;
    }

    return memories;
  }

  async listWebhooks(): Promise<Webhook[]> {
    const { data } = await this.request<{ webhooks: Webhook[] }>("GET", "/api/webhooks");
    return data.webhooks;
  }

  async createWebhook(webhook: WebhookCreateRequest): Promise<Webhook> {
    const { data } = await this.request<{ webhook: Webhook }>("POST", "/api/webhooks", webhook);
    return data.webhook;
  }

  async getWebhook(webhookId: string): Promise<Webhook> {
    const { data } = await this.request<{ webhook: Webhook }>("GET", `/api/webhooks/${webhookId}`);
    return data.webhook;
  }

  async updateWebhook(
    webhookId: string,
    updates: Partial<WebhookCreateRequest> & { enabled?: boolean }
  ): Promise<Webhook> {
    const { data } = await this.request<{ webhook: Webhook }>(
      "PATCH",
      `/api/webhooks/${webhookId}`,
      updates
    );
    return data.webhook;
  }

  async deleteWebhook(webhookId: string): Promise<void> {
    await this.request<void>("DELETE", `/api/webhooks/${webhookId}`);
  }

  async health(): Promise<HealthResponse> {
    const { data } = await this.request<HealthResponse>("GET", "/api/health");
    return data;
  }

  clearCache(): void {
    if (this.cache) {
      this.cache.clear();
    }
  }

  invalidateCache(userId: string): void {
    if (this.cache) {
      this.cache.invalidate(userId);
    }
  }
}
