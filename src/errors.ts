/**
 * Error handling for the Orthanc Client SDK
 */

export class OrthancsError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly requestId?: string;

  constructor(message: string, code: string, status: number, requestId?: string) {
    super(message);
    this.name = "OrthancsError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    Object.setPrototypeOf(this, OrthancsError.prototype);
  }
}

export class AuthenticationError extends OrthancsError {
  constructor(message: string, requestId?: string) {
    super(message, "AUTHENTICATION_ERROR", 401, requestId);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class AuthorizationError extends OrthancsError {
  constructor(message: string, requestId?: string) {
    super(message, "AUTHORIZATION_ERROR", 403, requestId);
    this.name = "AuthorizationError";
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

export class ValidationError extends OrthancsError {
  public readonly field?: string;

  constructor(message: string, field?: string, requestId?: string) {
    super(message, "VALIDATION_ERROR", 400, requestId);
    this.name = "ValidationError";
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class RateLimitError extends OrthancsError {
  public readonly retryAfter: number;

  constructor(message: string, retryAfter: number, requestId?: string) {
    super(message, "RATE_LIMIT_ERROR", 429, requestId);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class UsageLimitError extends OrthancsError {
  constructor(message: string, requestId?: string) {
    super(message, "USAGE_LIMIT_ERROR", 429, requestId);
    this.name = "UsageLimitError";
    Object.setPrototypeOf(this, UsageLimitError.prototype);
  }
}

export class NotFoundError extends OrthancsError {
  constructor(message: string, requestId?: string) {
    super(message, "NOT_FOUND", 404, requestId);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class TimeoutError extends OrthancsError {
  constructor(message: string, requestId?: string) {
    super(message, "TIMEOUT", 408, requestId);
    this.name = "TimeoutError";
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

export class ServerError extends OrthancsError {
  constructor(message: string, requestId?: string) {
    super(message, "SERVER_ERROR", 500, requestId);
    this.name = "ServerError";
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}

export class NetworkError extends OrthancsError {
  constructor(message: string) {
    super(message, "NETWORK_ERROR", 0);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

export function parseErrorResponse(
  status: number,
  body: { error?: string; code?: string; message?: string },
  requestId?: string
): OrthancsError {
  const message = body.error || body.message || "Unknown error";
  const code = body.code || "UNKNOWN";

  switch (status) {
    case 400:
      return new ValidationError(message, undefined, requestId);
    case 401:
      return new AuthenticationError(message, requestId);
    case 403:
      return new AuthorizationError(message, requestId);
    case 404:
      return new NotFoundError(message, requestId);
    case 408:
      return new TimeoutError(message, requestId);
    case 429:
      if (code === "USAGE_LIMIT_EXCEEDED") {
        return new UsageLimitError(message, requestId);
      }
      return new RateLimitError(message, 60, requestId);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, requestId);
    default:
      return new OrthancsError(message, code, status, requestId);
  }
}

export function isRetryable(error: OrthancsError): boolean {
  if (error instanceof RateLimitError) return true;
  if (error instanceof TimeoutError) return true;
  if (error instanceof NetworkError) return true;
  if (error instanceof ServerError && error.status >= 500) return true;
  return false;
}
