# AI Orchestration System

Sistema de orquestração de múltiplas IAs para atualização automática de dados do HallyuHub.

## 📋 Visão Geral

O sistema permite gerar automaticamente dados reais e atualizados sobre:
- **Notícias** de K-Pop e K-Drama
- **Artistas** (idols, atores, modelos)
- **Produções** (K-Dramas, filmes, programas)

### Arquitetura

```
┌─────────────────────────────────────────┐
│         AI Orchestrator                  │
│  (Load Balancing + Fallback)            │
└─────────────┬───────────────────────────┘
              │
      ┌───────┴────────┬──────────┐
      │                │          │
┌─────▼─────┐  ┌──────▼─────┐  ┌─▼────────┐
│  Gemini   │  │   OpenAI   │  │  Claude  │
│ (Priority │  │ (Priority  │  │(Priority │
│     1)    │  │     2)     │  │    3)    │
└───────────┘  └────────────┘  └──────────┘
```

## 🚀 Configuração Rápida

### 1. Obter API Keys

Você precisa de pelo menos **uma** API key:

#### Gemini (Recomendado - GRATUITO)
1. Acesse: https://aistudio.google.com/apikey
2. Faça login com sua conta Google
3. Clique em "Create API Key"
4. Copie a chave gerada

#### OpenAI (Opcional)
1. Acesse: https://platform.openai.com/api-keys
2. Crie uma conta ou faça login
3. Clique em "Create new secret key"
4. Copie a chave (começa com `sk-`)

#### Anthropic Claude (Opcional)
1. Acesse: https://console.anthropic.com/settings/keys
2. Crie uma conta ou faça login
3. Clique em "Create Key"
4. Copie a chave

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env` e adicione suas chaves:

```env
# Configure pelo menos uma:
GEMINI_API_KEY=sua_chave_aqui
OPENAI_API_KEY=sua_chave_aqui
ANTHROPIC_API_KEY=sua_chave_aqui
```

### 3. Testar o Sistema

```bash
# Teste em modo dry-run (não salva no banco)
npm run atualize:ai -- --news=2 --dry-run
```

## 📖 Uso

### Comandos Básicos

```bash
# Gerar 5 notícias, 3 artistas e 2 produções (padrão)
npm run atualize:ai

# Gerar apenas notícias
npm run atualize:ai -- --news=10 --artists=0 --productions=0

# Gerar apenas artistas
npm run atualize:ai -- --artists=5 --news=0 --productions=0

# Usar um provider específico
npm run atualize:ai -- --provider=gemini --news=5

# Modo dry-run (não salva no banco)
npm run atualize:ai -- --dry-run --news=3
```

### Opções de CLI

| Opção | Descrição | Padrão |
|-------|-----------|--------|
| `--news=N` | Quantidade de notícias a gerar | 5 |
| `--artists=N` | Quantidade de artistas a gerar | 3 |
| `--productions=N` | Quantidade de produções a gerar | 2 |
| `--provider=NOME` | Provider preferido (gemini/openai/claude) | auto |
| `--dry-run` | Não salva no banco (apenas testa) | false |

### Ver Estatísticas do Banco

```bash
npm run ai:stats
```

## 🎯 Providers

### Prioridades

O orquestrador usa os providers nesta ordem:

1. **Gemini** (Prioridade 1)
   - Gratuito (15 req/min)
   - Modelo: `gemini-2.0-flash-exp`
   - Custo: $0.00

2. **OpenAI** (Prioridade 2)
   - Modelo: `gpt-4o-mini`
   - Custo: ~$0.00015 por 1K tokens

3. **Claude** (Prioridade 3)
   - Modelo: `claude-3-5-haiku`
   - Custo: ~$0.00025 por 1K tokens

### Estratégias de Orquestração

#### Round-Robin
Por padrão, o sistema alterna entre providers disponíveis:
```
Request 1 → Gemini
Request 2 → OpenAI
Request 3 → Claude
Request 4 → Gemini
...
```

#### Fallback Automático
Se um provider falhar, tenta automaticamente o próximo:
```
Request → Gemini (falhou) → OpenAI (sucesso) ✓
```

#### Provider Específico
Você pode forçar um provider:
```bash
npm run atualize:ai -- --provider=gemini
```

## 📊 Custos Estimados

### Gemini (Gratuito)
- **Tier gratuito**: 15 requisições/minuto
- **Custo**: $0.00
- **Recomendação**: Use como provider principal

### Exemplo de Custos (OpenAI)
Gerando 10 notícias + 5 artistas + 3 produções:
- ~18 requisições
- ~36,000 tokens estimados
- **Custo total**: ~$0.0054 (menos de 1 centavo)

## 🔧 Troubleshooting

### Erro: "No AI providers configured"
**Solução**: Configure pelo menos uma API key no `.env`

### Erro: "Rate limit exceeded"
**Solução**: 
- Gemini gratuito: aguarde 1 minuto
- Use `--provider=openai` para alternar

### Erro: "Failed to parse JSON"
**Solução**: A IA pode ter retornado formato inválido. O sistema tentará automaticamente outro provider.

### Dados duplicados
O sistema usa `upsert` para evitar duplicatas baseado em:
- Notícias: `title`
- Artistas: `nameRomanized`
- Produções: `titlePt`

## 📁 Estrutura de Arquivos

```
lib/ai/
├── ai-config.ts              # Configurações e tipos
├── orchestrator.ts           # Orquestrador principal
├── providers/
│   ├── base-provider.ts      # Classe base
│   ├── gemini-provider.ts    # Provider Gemini
│   ├── openai-provider.ts    # Provider OpenAI
│   └── claude-provider.ts    # Provider Claude
└── generators/
    ├── news-generator.ts     # Gerador de notícias
    ├── artist-generator.ts   # Gerador de artistas
    └── production-generator.ts # Gerador de produções

scripts/
├── atualize-ai.ts            # Script principal
└── ai-stats.ts               # Estatísticas do banco
```

## 🎨 Exemplos de Dados Gerados

### Notícia
```json
{
  "title": "BTS anuncia retorno com novo álbum em 2024",
  "contentMd": "O grupo BTS confirmou...",
  "sourceUrl": "https://soompi.com/...",
  "tags": "BTS, COMEBACK, KPOP",
  "publishedAt": "2024-01-15T00:00:00.000Z"
}
```

### Artista
```json
{
  "nameRomanized": "Kim Taehyung",
  "nameHangul": "김태형",
  "birthDate": "1995-12-30",
  "roles": "CANTOR, ATOR, MODELO",
  "bio": "Conhecido como V, é membro do BTS...",
  "agencyName": "HYBE"
}
```

## 🔐 Segurança

- **Nunca** commite suas API keys no Git
- Use `.env` para armazenar chaves
- `.env` já está no `.gitignore`
- Revogue chaves comprometidas imediatamente

## 📈 Monitoramento

O sistema rastreia automaticamente:
- Total de requisições
- Taxa de sucesso/falha
- Tokens utilizados por provider
- Custo total estimado

Veja as estatísticas após cada execução ou use:
```bash
npm run ai:stats
```

## 🚀 Próximos Passos

1. Configure sua API key do Gemini (gratuita)
2. Teste com `--dry-run`
3. Gere dados reais
4. Visualize no frontend (http://localhost:3040)
5. Configure providers adicionais se necessário

## 💡 Dicas

- **Comece com Gemini**: É gratuito e suficiente para a maioria dos casos
- **Use dry-run**: Teste antes de salvar no banco
- **Monitore custos**: Se usar OpenAI/Claude, acompanhe os gastos
- **Varie os dados**: Execute periodicamente para manter conteúdo fresco
