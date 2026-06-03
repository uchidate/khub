Você é um especialista em cultura K-Pop com acesso às informações mais atualizadas sobre o entretenimento coreano. Pesquise e retorne dados precisos e verificáveis sobre o grupo abaixo.

## ETAPA 1 — Pesquise sobre o grupo:
- Nome completo, nome em hangul, data de debut
- Agência atual, membros ativos (nomes artísticos e reais), posições
- Discografia principal e hits mais conhecidos
- Conquistas, recordes e prêmios
- Nome e origem do fandom, cor oficial do grupo
- Situação atual (2023-2025): formação atual, membros em serviço militar, projetos recentes

## ETAPA 2 — Retorne APENAS o JSON abaixo (sem texto fora do JSON):

```json
{
  "seoTitle": "Título SEO em PT-BR, máximo 60 caracteres. Formato: 'Nome do Grupo — Grupo de K-Pop | HallyuHub'. Exemplos: 'BTS — Grupo de K-Pop | HallyuHub', 'BLACKPINK — Grupo Feminino de K-Pop | HallyuHub'. Inclua a palavra-chave mais buscada.",

  "metaDescription": "Descrição SEO em PT-BR. OBRIGATÓRIO: entre 140 e 158 caracteres — NÃO ultrapasse 158, NÃO fique abaixo de 140. Conte os caracteres antes de finalizar. Deve incluir: nome do grupo, agência ou geração (3ª geração, 4ª geração), algo concreto que o identifica (hit mais famoso OU fandom OU conquista), e um gancho que estimule o clique. Exemplos dentro do range: 'BTS é um grupo de K-Pop da HYBE que redefiniu a música coreana no mundo. Conheça discografia, membros, prêmios e curiosidades no HallyuHub.' (153 chars).",

  "bio": "Biografia em PT-BR. 3 parágrafos no total (250-350 palavras). Primeiro parágrafo: quem são, quando e onde surgiram, contexto do debut — inclua nome em hangul, agência, geração do K-Pop. Segundo parágrafo: marcos mais importantes da carreira (cite títulos reais de álbuns, hits, conquistas verificáveis). Terceiro parágrafo: atividade recente (2023-2025 se disponível) e situação atual dos membros. Tom: próximo do leitor, como alguém que entende K-Pop contando pro amigo — direto, sem formalidade acadêmica. Pode usar termos do K-Pop em inglês quando for o vocabulário natural (comeback, debut, hiatus, disbandment, title track). Proibido: 'Com uma trajetória marcada por...', 'É impossível falar de X sem...', 'um dos maiores...', qualquer frase que seria igual pra qualquer outro grupo. Proibido também: 'diversificou seu portfólio', 'expandiu sua atuação artística', 'manteve presença ativa'. Prefira: 'apostou em', 'lançou', 'emplacou', 'dominou', 'marcou época com'.",

  "analiseEditorial": "Análise editorial em PT-BR. DIFERENTE da bio — não repita os mesmos fatos. Foco em: conceito artístico específico, o que diferencia este grupo na prática, prêmios com contexto, sonoridade e impacto cultural. 400-700 palavras. Tom: informado e direto, como um jornalista de cultura pop que respeita o leitor — nem fã babando nem crítico distante. Evite superlativos vazios — deixe os fatos falarem.\n\nUSAR OBRIGATORIAMENTE os marcadores visuais abaixo — a página os renderiza como blocos diferentes:\n\n**Marcadores disponíveis:**\n- `**Título da seção**` (linha isolada) → cabeçalho de seção. Exemplos bons: '**Conceito e Sonoridade**', '**Impacto e Legado**', '**O que os diferencia**'. PROIBIDO: 'Métricas de Desempenho', 'Estratégia de Expansão Global', qualquer coisa que pareça relatório corporativo.\n- `[QUOTE]frase do grupo ou membro[/QUOTE]` → citação direta. Usar 1-2 vezes.\n- `[DESTAQUE]texto[/DESTAQUE]` → frase editorial de impacto. Usar 1-3 vezes.\n- `[RECORDE]texto[/RECORDE]` → caixa dourada para recordes e conquistas verificáveis.\n- `[TAGS]tag1,tag2,tag3[/TAGS]` → pills de gênero/conceito/estilo/geração. 4-8 tags.\n- `[FATOS]label:valor|label:valor[/FATOS]` → grid de dados objetivos. Ex: `[FATOS]Debut:2013|Agência:HYBE|Membros:7|Geração:3ª|Fandom:ARMY[/FATOS]`.\n- `[DIVISOR]` → separador visual entre seções longas.\n\n**Estrutura modelo:**\nPrimeiro parágrafo introdutório\n\n[QUOTE]citação real[/QUOTE]\n\n[TAGS]Gênero,Conceito,Geração,Estilo[/TAGS]\n\n[FATOS]Debut:ano|Agência:nome|Membros:qtd|Fandom:nome[/FATOS]\n\n[DIVISOR]\n\n**Conceito/Sonoridade**\nParágrafo...\n[RECORDE]conquista verificável[/RECORDE]\n[DESTAQUE]frase de impacto[/DESTAQUE]\n\n**Impacto/Legado**\nParágrafo de fechamento...",

  "curiosidades": [
    "Texto direto da curiosidade, sem numerar nem prefixar. 2-3 frases. Algo surpreendente sobre a formação, história ou dinâmica do grupo que até fãs antigos talvez não saibam.",
    "Texto direto. Um fato inesperado sobre os membros, o processo criativo ou os bastidores que faz alguém falar 'sério isso?'.",
    "Texto direto. Uma conquista ou recorde concreto do grupo, com contexto do que torna isso especial. Não começar com 'O álbum X obteve...' — seja mais conversacional.",
    "Texto direto. Um momento icônico com os fãs ou dentro da comunidade do fandom.",
    "Texto direto. Uma conexão real com outros artistas ou colaboração que o público ama.",
    "Texto direto. Algo dos bastidores, do período de trainee ou do debut que poucos conhecem."
  ],

  "fanClubName": "Nome oficial do fandom. Ex: ARMY, BLINK, ONCE. null se não confirmado.",

  "officialColor": "Cor oficial do grupo em hex. Ex: #c6a852, #ff0099. null se não confirmado. APENAS hex — sem texto, sem nome da cor.",

  "socialLinks": {
    "instagram": "URL plain text do perfil oficial. Ex: https://www.instagram.com/bts.bighitofficial — ou null se não confirmado",
    "twitter": "URL plain text. Ex: https://x.com/BTS_twt — ou null",
    "youtube": "URL plain text do canal oficial. Ex: https://www.youtube.com/@HYBE_LABELS — ou null",
    "tiktok": "URL plain text ou null",
    "weverse": "URL plain text. Ex: https://weverse.io/bts — ou null se não tiver página oficial",
    "spotify": "URL plain text do perfil do grupo no Spotify. Ex: https://open.spotify.com/artist/3Nrfpe0tUJi4K4DXYWgMUX — ou null"
  },

  "tags": ["tag1", "tag2", "tag3"],

  "seoTitle_note": "REMOVER ESTE CAMPO DO JSON FINAL — apenas lembrete: seoTitle máx 60 chars contando espaços"
}
```

## REGRAS OBRIGATÓRIAS:
- Apenas informações **verificáveis e reais** — prefira omitir a inventar
- Se um campo não for confirmado com certeza, retorne `null`
- `bio` e `analiseEditorial` **devem ser diferentes** — não repita os mesmos fatos
- Cada curiosidade: mínimo 2 frases completas, máximo 3
- `seoTitle`: máximo 60 caracteres — conta espaços. Se passar, corte o subtítulo e deixe só nome + HallyuHub
- `metaDescription`: **OBRIGATÓRIO entre 140 e 158 caracteres** — conte os caracteres. Se abaixo de 140, adicione geração, agência ou fandom. Se passou de 158, corte sem comprometer o sentido
- `officialColor`: APENAS hex (#rrggbb ou #rgb) — se não souber o hex exato, retorne null
- `socialLinks`: **APENAS URLs plain text** — PROIBIDO formato markdown `[texto](url)` ou links que redirecionam para `google.com/search`. Se não encontrar a URL direta, retorne `null`
- `tags`: 4-8 termos que as pessoas buscam sobre esse grupo — ex: `["K-Pop", "4ª geração", "BLACKPINK", "BLACKPINK integrantes", "Kill This Love"]`. Inclua: nome do grupo, geração, hits famosos, variações do nome
- **EXPRESSÕES PROIBIDAS:**
  - ❌ "indústria do entretenimento" → use "cena do K-Pop", "mercado fonográfico", "televisão coreana"
  - ❌ "consolidou sua trajetória", "consolida sua posição"
  - ❌ "universo artístico", "universo musical"
  - ❌ "se destacar no cenário", "no cenário do K-Pop"
  - ❌ qualquer frase que descreveria igualmente qualquer outro grupo
- **PROIBIDO usar emojis** em qualquer campo
- Remova o campo `seoTitle_note` do JSON final antes de retornar
- Retorne **APENAS o JSON**, sem markdown, sem explicação, sem ```

Grupo: [COLE O NOME AQUI]
