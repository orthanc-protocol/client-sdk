# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-04

### Added

- Initial release of the Orthanc Client SDK
- OrthancsClient for connecting to Orthanc API
  - query() for retrieving memories
  - queryDetailed() for detailed memory responses with metadata
  - queryBatch() for multiple queries in parallel
  - sync() for ingesting memories
  - syncMessages() for chat message format
  - syncText() for raw text format
  - batch() for bulk operations
  - createMemory() for single memory creation
  - updateMemory() for updating existing memories
  - deleteMemory() for removing memories
  - deleteAllMemories() for bulk deletion
  - export() for paginated memory export
  - exportAll() for complete user export
  - listWebhooks() for webhook management
  - createWebhook() for webhook creation
  - getWebhook() for webhook details
  - updateWebhook() for webhook updates
  - deleteWebhook() for webhook removal
  - health() for backend health check
- LocalClient for testing without API
  - Same interface as OrthancsClient
  - In-memory storage
  - No network required
- QueryCache for response caching
  - Configurable TTL
  - Max size limits
  - User-level invalidation
- Error handling
  - AuthenticationError for 401 responses
  - AuthorizationError for 403 responses
  - ValidationError for 400 responses
  - RateLimitError for 429 responses
  - UsageLimitError for usage limit exceeded
  - NotFoundError for 404 responses
  - TimeoutError for request timeouts
  - ServerError for 5xx responses
  - NetworkError for connection failures
- Automatic retry with exponential backoff
- Request timeout configuration
- Full TypeScript type definitions
- Protocol documentation
- Examples for common use cases
  - Basic usage
  - Error handling
  - Memory sync
  - Batch operations
  - Export and import
  - Webhooks
  - Local development
  - Caching
  - LangChain integration

[Unreleased]: https://github.com/orthanc-protocol/client-sdk/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/orthanc-protocol/client-sdk/releases/tag/v0.1.0
