import { describe, it, expect } from "vitest";
import {
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
  parseErrorResponse,
  isRetryable,
} from "../errors";

describe("OrthancsError", () => {
  it("should create error with all properties", () => {
    const error = new OrthancsError("Test error", "TEST_CODE", 400, "req-123");

    expect(error.message).toBe("Test error");
    expect(error.code).toBe("TEST_CODE");
    expect(error.status).toBe(400);
    expect(error.requestId).toBe("req-123");
    expect(error.name).toBe("OrthancsError");
  });

  it("should be instanceof Error", () => {
    const error = new OrthancsError("Test", "TEST", 400);
    expect(error instanceof Error).toBe(true);
    expect(error instanceof OrthancsError).toBe(true);
  });
});

describe("AuthenticationError", () => {
  it("should have correct defaults", () => {
    const error = new AuthenticationError("Invalid API key");

    expect(error.code).toBe("AUTHENTICATION_ERROR");
    expect(error.status).toBe(401);
    expect(error.name).toBe("AuthenticationError");
  });
});

describe("AuthorizationError", () => {
  it("should have correct defaults", () => {
    const error = new AuthorizationError("Not authorized");

    expect(error.code).toBe("AUTHORIZATION_ERROR");
    expect(error.status).toBe(403);
    expect(error.name).toBe("AuthorizationError");
  });
});

describe("ValidationError", () => {
  it("should include field when provided", () => {
    const error = new ValidationError("Invalid value", "userId");

    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.status).toBe(400);
    expect(error.field).toBe("userId");
  });

  it("should work without field", () => {
    const error = new ValidationError("Invalid request");

    expect(error.field).toBeUndefined();
  });
});

describe("RateLimitError", () => {
  it("should include retryAfter", () => {
    const error = new RateLimitError("Too many requests", 60);

    expect(error.code).toBe("RATE_LIMIT_ERROR");
    expect(error.status).toBe(429);
    expect(error.retryAfter).toBe(60);
  });
});

describe("UsageLimitError", () => {
  it("should have correct defaults", () => {
    const error = new UsageLimitError("Monthly limit exceeded");

    expect(error.code).toBe("USAGE_LIMIT_ERROR");
    expect(error.status).toBe(429);
  });
});

describe("NotFoundError", () => {
  it("should have correct defaults", () => {
    const error = new NotFoundError("Memory not found");

    expect(error.code).toBe("NOT_FOUND");
    expect(error.status).toBe(404);
  });
});

describe("TimeoutError", () => {
  it("should have correct defaults", () => {
    const error = new TimeoutError("Request timed out");

    expect(error.code).toBe("TIMEOUT");
    expect(error.status).toBe(408);
  });
});

describe("ServerError", () => {
  it("should have correct defaults", () => {
    const error = new ServerError("Internal server error");

    expect(error.code).toBe("SERVER_ERROR");
    expect(error.status).toBe(500);
  });
});

describe("NetworkError", () => {
  it("should have correct defaults", () => {
    const error = new NetworkError("Connection refused");

    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.status).toBe(0);
  });
});

describe("parseErrorResponse", () => {
  it("should return ValidationError for 400", () => {
    const error = parseErrorResponse(400, { error: "Invalid input" }, "req-1");

    expect(error instanceof ValidationError).toBe(true);
    expect(error.message).toBe("Invalid input");
  });

  it("should return AuthenticationError for 401", () => {
    const error = parseErrorResponse(401, { error: "Invalid API key" });

    expect(error instanceof AuthenticationError).toBe(true);
  });

  it("should return AuthorizationError for 403", () => {
    const error = parseErrorResponse(403, { error: "Not authorized" });

    expect(error instanceof AuthorizationError).toBe(true);
  });

  it("should return NotFoundError for 404", () => {
    const error = parseErrorResponse(404, { error: "Not found" });

    expect(error instanceof NotFoundError).toBe(true);
  });

  it("should return TimeoutError for 408", () => {
    const error = parseErrorResponse(408, { error: "Timeout" });

    expect(error instanceof TimeoutError).toBe(true);
  });

  it("should return UsageLimitError for 429 with usage limit code", () => {
    const error = parseErrorResponse(429, {
      error: "Limit exceeded",
      code: "USAGE_LIMIT_EXCEEDED",
    });

    expect(error instanceof UsageLimitError).toBe(true);
  });

  it("should return RateLimitError for 429 without usage limit code", () => {
    const error = parseErrorResponse(429, { error: "Too many requests" });

    expect(error instanceof RateLimitError).toBe(true);
  });

  it("should return ServerError for 500", () => {
    const error = parseErrorResponse(500, { error: "Server error" });

    expect(error instanceof ServerError).toBe(true);
  });

  it("should return ServerError for 502, 503, 504", () => {
    expect(parseErrorResponse(502, {}) instanceof ServerError).toBe(true);
    expect(parseErrorResponse(503, {}) instanceof ServerError).toBe(true);
    expect(parseErrorResponse(504, {}) instanceof ServerError).toBe(true);
  });

  it("should return generic OrthancsError for unknown status", () => {
    const error = parseErrorResponse(418, { error: "I'm a teapot" });

    expect(error instanceof OrthancsError).toBe(true);
    expect(error.status).toBe(418);
  });

  it("should use message field if error is not present", () => {
    const error = parseErrorResponse(400, { message: "Bad request" });

    expect(error.message).toBe("Bad request");
  });
});

describe("isRetryable", () => {
  it("should return true for RateLimitError", () => {
    const error = new RateLimitError("Too many requests", 60);
    expect(isRetryable(error)).toBe(true);
  });

  it("should return true for TimeoutError", () => {
    const error = new TimeoutError("Timeout");
    expect(isRetryable(error)).toBe(true);
  });

  it("should return true for NetworkError", () => {
    const error = new NetworkError("Connection failed");
    expect(isRetryable(error)).toBe(true);
  });

  it("should return true for ServerError with 5xx status", () => {
    const error = new ServerError("Server error");
    expect(isRetryable(error)).toBe(true);
  });

  it("should return false for AuthenticationError", () => {
    const error = new AuthenticationError("Invalid key");
    expect(isRetryable(error)).toBe(false);
  });

  it("should return false for ValidationError", () => {
    const error = new ValidationError("Invalid input");
    expect(isRetryable(error)).toBe(false);
  });

  it("should return false for NotFoundError", () => {
    const error = new NotFoundError("Not found");
    expect(isRetryable(error)).toBe(false);
  });
});
