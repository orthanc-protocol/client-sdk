/**
 * Orthanc Client SDK
 * Universal interface for querying agent memory
 */

export { OrthancsClient } from "./client";
export { LocalClient, LocalMemoryStore } from "./local";
export { QueryCache } from "./cache";

export {
  OrthancsError,
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  RateLimitError,
  UsageLimitError,
  NotFoundError,
  TimeoutError,
  ServerError,
  NetworkError,
  isRetryable,
} from "./errors";

export type {
  QueryType,
  TimeFilter,
  SourceType,
  QueryOptions,
  MemoryQuery,
  Memory,
  MemoryResponse,
  DetailedMemoryResponse,
  SyncOptions,
  SyncRequest,
  SyncResponse,
  BatchOperation,
  BatchRequest,
  BatchResponse,
  ExportOptions,
  ExportResponse,
  WebhookEvent,
  Webhook,
  WebhookCreateRequest,
  HealthResponse,
  ClientConfig,
  CacheConfig,
  RequestMetadata,
} from "./types";
