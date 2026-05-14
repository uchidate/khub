/**
 * Base agent runner com loop manual
 * Reutilizável para diferentes contextos
 */
import Anthropic from "@anthropic-ai/sdk";
import { AgentContext, AgentResponse } from "./types";

const client = new Anthropic();

export interface AgentConfig {
  model?: "claude-opus-4-7" | "claude-sonnet-4-6";
  maxIterations?: number;
  maxTokens?: number;
  systemPrompt: string;
  tools: any[]; // betaZodTool[]
}

export async function runAgent(
  userQuery: string,
  config: AgentConfig,
  context?: AgentContext
): Promise<AgentResponse> {
  const {
    model = "claude-opus-4-7",
    maxIterations = 10,
    maxTokens = 16000,
    systemPrompt,
    tools,
  } = config;

  const iterations = { count: 0 };
  const toolCalls: Array<{ name: string; input: unknown; result: any }> =
    [];

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
        tools: tools,
        messages: messages,
      });

      // Claude terminou normalmente
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

      // Verificar se há tool_use
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );

      if (toolUseBlocks.length === 0) {
        // Sem tool_use e sem end_turn = erro inesperado
        const textBlock = response.content.find(
          (b): b is Anthropic.TextBlock => b.type === "text"
        );
        return {
          message: textBlock?.text || "Agente interrompido inesperadamente",
          toolCalls,
          metadata: {
            iterations: iterations.count,
          },
        };
      }

      // Adicionar resposta do assistente
      messages.push({ role: "assistant", content: response.content });

      // Executar ferramentas
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const toolUse of toolUseBlocks) {
        try {
          // Execute the tool using its run method
          const result = await (toolUse as any).run((toolUse as any).input);
          toolCalls.push({
            name: (toolUse as any).name,
            input: (toolUse as any).input,
            result,
          });
          toolResults.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            content: JSON.stringify(result),
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

      // Adicionar resultados
      messages.push({ role: "user", content: toolResults });
    } catch (error) {
      return {
        message: `Erro do agente: ${error instanceof Error ? error.message : "Desconhecido"}`,
        toolCalls,
        metadata: {
          iterations: iterations.count,
        },
      };
    }
  }

  return {
    message: `Agente atingiu limite máximo de iterações (${maxIterations})`,
    toolCalls,
    metadata: {
      iterations: iterations.count,
    },
  };
}
