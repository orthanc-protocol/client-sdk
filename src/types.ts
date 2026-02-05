/**
 * Core type definitions for the Orthanc Protocol
 */

export type QueryType = 
  | "graph_relation"
  | "graph_list"
  | "graph_who"
  | "vector_search"
  | "hybrid";

export type TimeFilter = "hour" | "day" | "week" | "month" | "year" | "all";

export type SourceType = 
  | "api"
  | "chat"
  | "voice"
  | "file_upload"
  | "import"
  | "webhook"
  | "sdk";

export interface QueryOptions {
  matchThreshold?: number;
  matchCount?: number;
  timeFilter?: TimeFilter;
  includeMetadata?: boolean;
}

export interface MemoryQuery {
  userId: string;
  query: string;
  options?: QueryOptions;
}

export interface Memory {
  id: string;
  content: string;
  score: number;
  createdAt: string;
  updatedAt?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface MemoryResponse {
  memories: string[];
  scores: number[];
  count: number;
  queryType: QueryType;
  latency_ms: number;
  graphAnswer?: string;
  dateFilter?: {
    detected: boolean;
    startDate?: string;
    endDate?: string;
  };
}

export interface DetailedMemoryResponse {
  memories: Memory[];
  count: number;
  queryType: QueryType;
  latency_ms: number;
  graphAnswer?: string;
  pagination?: {
    offset: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface SyncOptions {
  source?: SourceType;
  sourceName?: string;
  eventTimestamp?: string;
  expiresAt?: string;
  infer?: boolean;
  sync?: boolean;
  tags?: string[];
  importance?: number;
  category?: string;
}

export interface SyncRequest {
  userId: string;
  messages?: Array<{ role: string; content: string }>;
  text?: string;
  options?: SyncOptions;
  metadata?: Record<string, unknown>;
}

export interface SyncResponse {
  status: "queued" | "processing" | "completed";
  message: string;
  inputFormat: "messages" | "text";
  memoriesCreated?: number;
  memoriesUpdated?: number;
  latency_ms?: number;
}

export interface BatchOperation {
  action: "create" | "update" | "delete";
  id?: string;
  text?: string;
  updates?: {
    content?: string;
    category?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
  };
  options?: SyncOptions;
}

export interface BatchRequest {
  userId: string;
  operations: BatchOperation[];
}

export interface BatchResponse {
  processed: number;
  results: {
    created: number;
    updated: number;
    deleted: number;
    failed: number;
  };
  errors?: Array<{
    index: number;
    error: string;
  }>;
}

export interface ExportOptions {
  userId?: string;
  limit?: number;
  offset?: number;
  format?: "json" | "csv";
  includeEmbeddings?: boolean;
}

export interface ExportResponse {
  userId?: string;
  exportedAt: string;
  total: number;
  count: number;
  hasMore: boolean;
  memories: Memory[];
}

export interface WebhookEvent {
  event: 
    | "memory.created"
    | "memory.updated"
    | "memory.deleted"
    | "memory.batch_created"
    | "memory.batch_deleted";
  timestamp: string;
  data: {
    userId: string;
    memories?: string[];
    memoryIds?: string[];
    source?: SourceType;
  };
}

export interface Webhook {
  id: string;
  url: string;
  events: WebhookEvent["event"][];
  enabled: boolean;
  secret?: string;
  name?: string;
  createdAt: string;
}

export interface WebhookCreateRequest {
  url: string;
  events: WebhookEvent["event"][];
  secret?: string;
  name?: string;
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  latency_ms: number;
  services: {
    database: "up" | "down";
    embeddings: "up" | "down";
    inference: "up" | "down";
  };
}

export interface ClientConfig {
  endpoint: string;
  apiKey: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  cache?: CacheConfig;
}

export interface CacheConfig {
  enabled: boolean;
  ttl?: number;
  maxSize?: number;
}

export interface RequestMetadata {
  requestId: string;
  latency_ms: number;
  rateLimitRemaining?: number;
  rateLimitReset?: number;
}
