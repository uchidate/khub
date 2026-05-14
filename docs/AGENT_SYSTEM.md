# 🤖 HallyuHub Agent System

Sistema de agentes Claude integrado ao HallyuHub para automação de criação e curação de conteúdo K-culture.

## 📁 Arquitetura

```
lib/ai/
├── agents/           # Orquestração dos agentes
│   ├── types.ts     # Tipos base
│   ├── runner.ts    # Loop manual reutilizável
│   └── blog.ts      # Agente especializado em blog
├── tools/           # Ferramentas (integradas com Prisma)
│   ├── blog.ts      # Blog CRUD + queries
│   └── data.ts      # Search de artistas, grupos, produções
└── prompts/         # System prompts (TBD)

app/api/agents/blog/route.ts  # API endpoint
```

## 🚀 Como Usar

### 1. **Via API**

```bash
curl -X POST http://localhost:3000/api/agents/blog \
  -H "Content-Type: application/json" \
  -d '{"query": "Crie um rascunho sobre a história do BTS"}'
```

### 2. **Resposta**

```json
{
  "success": true,
  "data": {
    "message": "Criei um rascunho intitulado 'A Evolução do BTS: Dos Trainee...' com ID xyz123",
    "toolCalls": [
      {
        "name": "search_groups",
        "input": { "query": "BTS" },
        "result": { "groups": [...] }
      },
      {
        "name": "create_draft_blog",
        "input": { "title": "...", "slug": "..." },
        "result": { "id": "...", "status": "draft" }
      }
    ],
    "metadata": {
      "iterations": 3,
      "tokensUsed": { "input": 2045, "output": 1203 }
    }
  }
}
```

## 🧠 Capacidades Disponíveis

### Tools de Blog

- `get_blog_post` — Buscar artigo por slug
- `list_blog_posts` — Listar artigos com filtro de categoria
- `create_draft_blog` — Criar rascunho (não publicado)
- `update_blog_draft` — Atualizar conteúdo de rascunho

### Tools de Dados

- `search_artists` — Buscar artistas por nome
- `search_groups` — Buscar grupos K-Pop/K-Drama
- `search_productions` — Buscar álbuns, dramas, filmes
- `get_group_details` — Detalhes completos de um grupo

## 📝 Exemplos de Prompts

### Blog Generation
```
"Gere um rascunho sobre BLACKPINK e sua influência no K-Pop global"
```

### Content Research
```
"Liste os 10 grupos K-Pop mais trendando e crie um rascunho comparativo"
```

### Data Enrichment
```
"Busque todos os membros do SEVENTEEN e resuma as informações principais"
```

## ⚙️ Configuração

### Environment

```env
ANTHROPIC_API_KEY=sk-ant-...
```

### Prisma

Agent usa `prisma` singleton definido em `lib/prisma.ts`. Garanta que:
- `DATABASE_URL` está configurado
- `prisma.config.ts` existe (Prisma 7)
- Adapter `@prisma/adapter-pg` está instalado

## 🔧 Estendendo com Novos Agents

### 1. Criar novas tools em `lib/ai/tools/`

```typescript
// lib/ai/tools/custom.ts
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";

export const myCustomTool = betaZodTool({
  name: "my_custom_tool",
  description: "...",
  inputSchema: z.object({ /* ... */ }),
  run: async (input) => { /* ... */ },
});
```

### 2. Criar novo agente em `lib/ai/agents/`

```typescript
// lib/ai/agents/custom.ts
import { runAgent, AgentConfig } from "./runner";
import { myCustomTool } from "@/lib/ai/tools/custom";

export async function runCustomAgent(query: string) {
  return runAgent(query, {
    model: "claude-opus-4-7",
    systemPrompt: "...",
    tools: [myCustomTool],
  });
}
```

### 3. Criar endpoint em `app/api/agents/[name]/route.ts`

```typescript
import { runCustomAgent } from "@/lib/ai/agents/custom";

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  const response = await runCustomAgent(query);
  return NextResponse.json({ success: true, data: response });
}
```

## 📊 Observabilidade

Cada resposta inclui metadata com:
- `iterations` — número de iterações do loop
- `tokensUsed` — `input_tokens` e `output_tokens` consumidos

Para logging e analytics:

```typescript
const { data } = response;
console.log(`Agent iterations: ${data.metadata.iterations}`);
console.log(`Tokens: ${data.metadata.tokensUsed.input} input, ${data.metadata.tokensUsed.output} output`);
```

## ⚠️ Limitações & Roadmap

- ✅ Blog agent (rascunhos)
- ⏳ Admin panel UI (Em progresso)
- ⏳ Conversation history persistence
- 🔄 Admin approval workflow para publicação
- 🔄 Integration com AI enrichment pipeline

## 🐛 Troubleshooting

### `tool is not a function`
- Certifique-se que tools em `runner.ts` usam `async/await`
- Verifique se `betaZodTool` está importado corretamente

### Agente não encontra dados
- Verifique que registros têm `isHidden: false`
- Cheque queries no Prisma Studio

### Timeout após 60s
- Aumente `maxDuration` no route.ts
- Reduza `maxIterations` no AgentConfig
