/**
 * Simple in-memory cache for query results
 */

import type { CacheConfig } from "./types";

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class QueryCache {
  private cache: Map<string, CacheEntry<unknown>>;
  private readonly ttl: number;
  private readonly maxSize: number;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.ttl = config.ttl || 60000;
    this.maxSize = config.maxSize || 1000;
  }

  private generateKey(userId: string, query: string, options?: Record<string, unknown>): string {
    const optionsStr = options ? JSON.stringify(options) : "";
    return `${userId}:${query}:${optionsStr}`;
  }

  get<T>(userId: string, query: string, options?: Record<string, unknown>): T | null {
    const key = this.generateKey(userId, query, options);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set<T>(userId: string, query: string, value: T, options?: Record<string, unknown>): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const key = this.generateKey(userId, query, options);
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
    });
  }

  invalidate(userId: string): void {
    const prefix = `${userId}:`;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  private evictOldest(): void {
    const now = Date.now();
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      } else if (entry.expiresAt < oldestTime) {
        oldestTime = entry.expiresAt;
        oldestKey = key;
      }
    }

    if (oldestKey && this.cache.size >= this.maxSize) {
      this.cache.delete(oldestKey);
    }
  }
}
