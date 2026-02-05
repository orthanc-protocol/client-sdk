import { describe, it, expect, beforeEach } from "vitest";
import { QueryCache } from "../cache";

describe("QueryCache", () => {
  let cache: QueryCache;

  beforeEach(() => {
    cache = new QueryCache({
      enabled: true,
      ttl: 1000,
      maxSize: 10,
    });
  });

  describe("get and set", () => {
    it("should store and retrieve values", () => {
      cache.set("user-1", "What do I like?", { memories: ["coffee"] });

      const result = cache.get<{ memories: string[] }>("user-1", "What do I like?");

      expect(result).toEqual({ memories: ["coffee"] });
    });

    it("should return null for missing keys", () => {
      const result = cache.get("user-1", "nonexistent");

      expect(result).toBeNull();
    });

    it("should differentiate by userId", () => {
      cache.set("user-1", "query", { data: "user1" });
      cache.set("user-2", "query", { data: "user2" });

      expect(cache.get("user-1", "query")).toEqual({ data: "user1" });
      expect(cache.get("user-2", "query")).toEqual({ data: "user2" });
    });

    it("should differentiate by query", () => {
      cache.set("user-1", "query-a", { data: "a" });
      cache.set("user-1", "query-b", { data: "b" });

      expect(cache.get("user-1", "query-a")).toEqual({ data: "a" });
      expect(cache.get("user-1", "query-b")).toEqual({ data: "b" });
    });

    it("should differentiate by options", () => {
      cache.set("user-1", "query", { data: "no-opts" });
      cache.set("user-1", "query", { data: "with-opts" }, { limit: 5 });

      expect(cache.get("user-1", "query")).toEqual({ data: "no-opts" });
      expect(cache.get("user-1", "query", { limit: 5 })).toEqual({ data: "with-opts" });
    });
  });

  describe("expiration", () => {
    it("should return null for expired entries", async () => {
      const shortCache = new QueryCache({
        enabled: true,
        ttl: 50,
        maxSize: 10,
      });

      shortCache.set("user-1", "query", { data: "test" });

      expect(shortCache.get("user-1", "query")).toEqual({ data: "test" });

      await new Promise(resolve => setTimeout(resolve, 100));

      expect(shortCache.get("user-1", "query")).toBeNull();
    });
  });

  describe("invalidate", () => {
    it("should remove all entries for a user", () => {
      cache.set("user-1", "query-a", { data: "a" });
      cache.set("user-1", "query-b", { data: "b" });
      cache.set("user-2", "query-a", { data: "c" });

      cache.invalidate("user-1");

      expect(cache.get("user-1", "query-a")).toBeNull();
      expect(cache.get("user-1", "query-b")).toBeNull();
      expect(cache.get("user-2", "query-a")).toEqual({ data: "c" });
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      cache.set("user-1", "query-a", { data: "a" });
      cache.set("user-2", "query-b", { data: "b" });

      cache.clear();

      expect(cache.get("user-1", "query-a")).toBeNull();
      expect(cache.get("user-2", "query-b")).toBeNull();
    });
  });

  describe("max size", () => {
    it("should evict entries when max size is reached", () => {
      const smallCache = new QueryCache({
        enabled: true,
        ttl: 60000,
        maxSize: 3,
      });

      smallCache.set("user-1", "query-1", { data: "1" });
      smallCache.set("user-1", "query-2", { data: "2" });
      smallCache.set("user-1", "query-3", { data: "3" });
      smallCache.set("user-1", "query-4", { data: "4" });

      const results = [
        smallCache.get("user-1", "query-1"),
        smallCache.get("user-1", "query-2"),
        smallCache.get("user-1", "query-3"),
        smallCache.get("user-1", "query-4"),
      ];

      const nonNullCount = results.filter(r => r !== null).length;
      expect(nonNullCount).toBeLessThanOrEqual(3);
    });
  });
});
