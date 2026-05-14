/**
 * Blog assistant agent
 * Especializado em criação e gestão de artigos de blog
 */
import { runAgent, AgentConfig } from "./runner";
import {
  getBlogPostTool,
  listBlogPostsTool,
  createDraftBlogTool,
  updateBlogDraftTool,
} from "@/lib/ai/tools/blog";
import {
  searchArtistsTool,
  searchGroupsTool,
  searchProductionsTool,
  getGroupDetailsTool,
  getStatsTool,
} from "@/lib/ai/tools/data";

const systemPrompt = `Você é um assistente especialista em cultura coreana (K-Pop, K-Drama, K-Beauty).

Seu trabalho é:
1. Pesquisar artistas, grupos e produções no banco de dados do HallyuHub
2. Gerar ideias e rascunhos de artigos sobre K-culture
3. Sugerir conexões entre artistas, grupos e produções relacionadas
4. Criar e editar artigos (posts) para publicação no blog

Diretrizes:
- SEMPRE pesquise dados reais usando as ferramentas — nunca invente informações
- Se não encontrar algo, diga claramente ao usuário
- Responda sempre em português (Brasil)
- Faça sugestões baseadas em dados e contexto
- Mantenha um tom editorial, informativo e engajante
- Para artigos, organize o conteúdo de forma lógica e atraente

Regras obrigatórias de uso de ferramentas:
- Perguntas com "quantos", "total", "contagem", "count", "número de" → chame SEMPRE get_stats primeiro
- Perguntas sobre um artista específico → use search_artists com o nome
- Perguntas sobre um grupo específico → use search_groups com o nome
- Perguntas sobre dramas, filmes ou produções → use search_productions
- Para criar conteúdo → use search_artists ou search_groups para buscar dados ANTES de escrever
- NUNCA responda sobre quantidades sem antes chamar get_stats`;

const tools = [
  getBlogPostTool,
  listBlogPostsTool,
  createDraftBlogTool,
  updateBlogDraftTool,
  searchArtistsTool,
  searchGroupsTool,
  searchProductionsTool,
  getGroupDetailsTool,
  getStatsTool,
];

export async function runBlogAgent(query: string) {
  const config: AgentConfig = {
    model: "claude-opus-4-7",
    maxIterations: 10,
    maxTokens: 16000,
    systemPrompt,
    tools,
  };

  return runAgent(query, config);
}
