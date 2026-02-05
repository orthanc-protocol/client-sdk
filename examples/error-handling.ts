/**
 * Error handling example for the Orthanc Client SDK
 */

import {
  OrthancsClient,
  OrthancsError,
  AuthenticationError,
  RateLimitError,
  ValidationError,
  TimeoutError,
  NetworkError,
} from "../src";

async function main() {
  const client = new OrthancsClient({
    endpoint: "https://api.orthanc.ai",
    apiKey: "your-api-key-here",
    timeout: 10000,
    retries: 3,
  });

  try {
    const result = await client.query("user-123", "What do I like?");
    console.log("Success:", result.memories);
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error("Invalid API key. Check your credentials.");
      console.error("Request ID:", error.requestId);
      return;
    }

    if (error instanceof RateLimitError) {
      console.error("Rate limit exceeded. Retry after:", error.retryAfter, "seconds");
      return;
    }

    if (error instanceof ValidationError) {
      console.error("Invalid request:", error.message);
      if (error.field) {
        console.error("Field:", error.field);
      }
      return;
    }

    if (error instanceof TimeoutError) {
      console.error("Request timed out. The server may be overloaded.");
      return;
    }

    if (error instanceof NetworkError) {
      console.error("Network error. Check your internet connection.");
      return;
    }

    if (error instanceof OrthancsError) {
      console.error("API error:", error.message);
      console.error("Code:", error.code);
      console.error("Status:", error.status);
      return;
    }

    console.error("Unexpected error:", error);
  }
}

main();
