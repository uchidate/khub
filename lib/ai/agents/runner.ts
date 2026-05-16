/**
 * Base agent runner com loop manual
 * Suporta Anthropic (produção) e Ollama via OpenAI-compat (dev local)
 * AGENT_PROVIDER=anthropic | ollama
 */
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { AgentContext, AgentResponse } from "./types";

const PROVIDER = process.env.AGENT_PROVIDER ?? "anthropic";
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";

export interface AgentConfig {
  model?: "claude-opus-4-7" | "claude-sonnet-4-6";
  maxIterations?: number;
  maxTokens?: number;
  systemPrompt: string;
  tools: any[];
}

// ── Anthropic path ────────────────────────────────────────────────────────────

async function runAnthropicAgent(
  userQuery: string,
  config: AgentConfig,
): Promise<AgentResponse> {
  const { model = "claude-opus-4-7", maxIterations = 10, maxTokens = 8000, systemPrompt, tools } = config;
  const client = new Anthropic();
  const iterations = { count: 0 };
  const toolCalls: Array<{ name: string; input: unknown; result: any }> = [];
  let messages: Anthropic.MessageParam[] = [{ role: "user", content: userQuery }];

  while (iterations.count < maxIterations) {
    iterations.count++;
    try {
      const response = await client.messages.create({ model, max_tokens: maxTokens, system: systemPrompt, tools, messages });

      if (response.stop_reason === "end_turn") {
        const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
        return { message: text?.text || "Nenhuma resposta gerada", toolCalls, metadata: { iterations: iterations.count, tokensUsed: { input: response.usage.input_tokens, output: response.usage.output_tokens } } };
      }

      const toolUseBlocks = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
      if (toolUseBlocks.length === 0) {
        const text = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
        return { message: text?.text || "Agente interrompido inesperadamente", toolCalls, metadata: { iterations: iterations.count } };
      }

      messages.push({ role: "assistant", content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        try {
          const tool = tools.find((t: any) => t.name === toolUse.name);
          if (!tool) throw new Error(`Tool não encontrada: ${toolUse.name}`);
          const result = await (tool as any).run(toolUse.input);
          toolCalls.push({ name: toolUse.name, input: toolUse.input, result });
          toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: typeof result === "string" ? result : JSON.stringify(result) });
        } catch (toolError) {
          toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: `Erro: ${toolError instanceof Error ? toolError.message : "Desconhecido"}`, is_error: true });
        }
      }
      messages.push({ role: "user", content: toolResults });
    } catch (error) {
      return { message: `Erro do agente: ${error instanceof Error ? error.message : "Desconhecido"}`, toolCalls, metadata: { iterations: iterations.count } };
    }
  }
  return { message: `Agente atingiu limite máximo de iterações (${maxIterations})`, toolCalls, metadata: { iterations: iterations.count } };
}

// ── Ollama path (OpenAI-compatible API) ───────────────────────────────────────

function toOpenAITools(tools: AgentConfig["tools"]): OpenAI.Chat.ChatCompletionTool[] {
  return tools.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description ?? "",
      parameters: t.input_schema ?? { type: "object", properties: {} },
    },
  }));
}

async function runOllamaAgent(
  userQuery: string,
  config: AgentConfig,
): Promise<AgentResponse> {
  const { maxIterations = 10, maxTokens = 8000, systemPrompt, tools } = config;
  const client = new OpenAI({ baseURL: OLLAMA_BASE_URL, apiKey: "ollama" });
  const openaiTools = toOpenAITools(tools);
  const iterations = { count: 0 };
  const toolCalls: Array<{ name: string; input: unknown; result: any }> = [];

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userQuery },
  ];

  while (iterations.count < maxIterations) {
    iterations.count++;
    try {
      const response = await client.chat.completions.create({
        model: OLLAMA_MODEL,
        max_tokens: maxTokens,
        tools: openaiTools,
        tool_choice: "auto",
        messages,
      });

      const choice = response.choices[0];
      const msg = choice.message;
      messages.push(msg);

      if (choice.finish_reason === "stop" || !msg.tool_calls?.length) {
        return {
          message: msg.content || "Nenhuma resposta gerada",
          toolCalls,
          metadata: { iterations: iterations.count, tokensUsed: { input: response.usage?.prompt_tokens ?? 0, output: response.usage?.completion_tokens ?? 0 } },
        };
      }

      for (const tc of msg.tool_calls) {
        const fn = (tc as any).function as { name: string; arguments: string };
        const fnName = fn.name;
        let parsed: Record<string, unknown> = {};
        try { parsed = JSON.parse(fn.arguments || "{}"); } catch { /* keep empty */ }

        try {
          const tool = tools.find((t: any) => t.name === fnName);
          if (!tool) throw new Error(`Tool não encontrada: ${fnName}`);
          const result = await (tool as any).run(parsed);
          toolCalls.push({ name: fnName, input: parsed, result });
          messages.push({ role: "tool", tool_call_id: tc.id, content: typeof result === "string" ? result : JSON.stringify(result) });
        } catch (toolError) {
          messages.push({ role: "tool", tool_call_id: tc.id, content: `Erro: ${toolError instanceof Error ? toolError.message : "Desconhecido"}` });
        }
      }
    } catch (error) {
      return { message: `Erro do agente: ${error instanceof Error ? error.message : "Desconhecido"}`, toolCalls, metadata: { iterations: iterations.count } };
    }
  }
  return { message: `Agente atingiu limite máximo de iterações (${maxIterations})`, toolCalls, metadata: { iterations: iterations.count } };
}

// ── Entry point ───────────────────────────────────────────────────────────────

export async function runAgent(
  userQuery: string,
  config: AgentConfig,
  _context?: AgentContext,
): Promise<AgentResponse> {
  return PROVIDER === "ollama"
    ? runOllamaAgent(userQuery, config)
    : runAnthropicAgent(userQuery, config);
}
