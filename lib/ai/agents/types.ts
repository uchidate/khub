/**
 * Tipos base para agentes Claude no HallyuHub
 */

export interface AgentToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface AgentMessage {
  role: "user" | "assistant";
  content: string | { type: string; text?: string }[];
}

export interface AgentContext {
  userId?: string;
  sessionId: string;
  maxIterations?: number;
  timeout?: number;
}

export interface AgentResponse {
  message: string;
  toolCalls?: Array<{
    name: string;
    input: unknown;
    result: AgentToolResult;
  }>;
  metadata?: {
    iterations: number;
    tokensUsed?: {
      input: number;
      output: number;
    };
  };
}

export type AgentTask =
  | "blog_generation"
  | "content_search"
  | "data_enrichment"
  | "admin_assist";
