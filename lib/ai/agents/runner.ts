/**
 * Base agent runner com loop manual
 * Suporta Anthropic (produção) e Ollama (dev local) via AGENT_PROVIDER env var
 */
import Anthropic from "@anthropic-ai/sdk";
import { AgentContext, AgentResponse } from "./types";

const PROVIDER = process.env.AGENT_PROVIDER ?? "anthropic"; // 'anthropic' | 'ollama'
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";

function makeClient() {
  if (PROVIDER === "ollama") {
    return new Anthropic({
      baseURL: OLLAMA_BASE_URL,
      apiKey: "ollama",
    });
  }
  return new Anthropic();
}

export interface AgentConfig {
  model?: "claude-opus-4-7" | "claude-sonnet-4-6";
  maxIterations?: number;
  maxTokens?: number;
  systemPrompt: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tools: any[];
}

export async function runAgent(
  userQuery: string,
  config: AgentConfig,
  context?: AgentContext
): Promise<AgentResponse> {
  const {
    model: anthropicModel = "claude-opus-4-7",
    maxIterations = 10,
    maxTokens = 8000,
    systemPrompt,
    tools,
  } = config;

  const client = makeClient();
  const model = PROVIDER === "ollama" ? OLLAMA_MODEL : anthropicModel;

  const iterations = { count: 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const toolCalls: Array<{ name: string; input: unknown; result: any }> = [];

  let messages: Anthropic.MessageParam[] = [
    { role: "user", content: userQuery },
  ];

  while (iterations.count < maxIterations) {
    iterations.count++;

    try {
      const response = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        tools,
        messages,
      });

      if (response.stop_reason === "end_turn") {
        const textBlock = response.content.find(
          (b): b is Anthropic.TextBlock => b.type === "text"
        );
        return {
          message: textBlock?.text || "Nenhuma resposta gerada",
          toolCalls,
          metadata: {
            iterations: iterations.count,
            tokensUsed: {
              input: response.usage.input_tokens,
              output: response.usage.output_tokens,
            },
          },
        };
      }

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) {
        const textBlock = response.content.find(
          (b): b is Anthropic.TextBlock => b.type === "text"
        );
        return {
          message: textBlock?.text || "Agente interrompido inesperadamente",
          toolCalls,
          metadata: { iterations: iterations.count },
        };
      }

      messages.push({ role: "assistant", content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tool = tools.find((t: any) => t.name === toolUse.name);
          if (!tool) throw new Error(`Tool não encontrada: ${toolUse.name}`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const result = await (tool as any).run(toolUse.input);
          toolCalls.push({ name: toolUse.name, input: toolUse.input, result });
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: typeof result === "string" ? result : JSON.stringify(result),
          });
        } catch (toolError) {
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: `Erro: ${toolError instanceof Error ? toolError.message : "Desconhecido"}`,
            is_error: true,
          });
        }
      }

      messages.push({ role: "user", content: toolResults });
    } catch (error) {
      return {
        message: `Erro do agente: ${error instanceof Error ? error.message : "Desconhecido"}`,
        toolCalls,
        metadata: { iterations: iterations.count },
      };
    }
  }

  return {
    message: `Agente atingiu limite máximo de iterações (${maxIterations})`,
    toolCalls,
    metadata: { iterations: iterations.count },
  };
}
