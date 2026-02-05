/**
 * Orthanc Client SDK
 * Universal interface for querying agent memory
 */

export interface MemoryQuery {
  userId: string;
  query: string;
  options?: {
    matchThreshold?: number;
    matchCount?: number;
    timeFilter?: "hour" | "day" | "week" | "month" | "year" | "all";
  };
}

export interface MemoryResponse {
  memories: string[];
  scores: number[];
  queryType: "graph_relation" | "graph_list" | "vector_search" | "hybrid";
  latency_ms: number;
  graphAnswer?: string;
  count: number;
}

export interface OrthancsClientConfig {
  endpoint: string;
  apiKey: string;
}

export class OrthancsClient {
  private endpoint: string;
  private apiKey: string;

  constructor(config: OrthancsClientConfig) {
    this.endpoint = config.endpoint;
    this.apiKey = config.apiKey;
  }

  async query(userId: string, query: string, options?: MemoryQuery["options"]): Promise<MemoryResponse> {
    const response = await fetch(`${this.endpoint}/api/context`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        messages: [{ role: "user", content: query }],
        options,
      }),
    });

    if (!response.ok) {
      throw new Error(`Memory query failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      memories: data.memories,
      scores: data.scores,
      queryType: data.queryType,
      latency_ms: data.latency_ms,
      graphAnswer: data.graphAnswer,
      count: data.count,
    };
  }
}
