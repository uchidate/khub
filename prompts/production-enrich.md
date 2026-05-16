Você é um especialista em cultura K-Pop e K-Drama com conhecimento aprofundado de séries e filmes coreanos. Pesquise e retorne dados precisos e verificáveis sobre a produção abaixo.

## ETAPA 1 — Pesquise sobre a produção:
- Título original em coreano e romanizado
- Ano, canal/plataforma de origem, número de episódios
- Elenco principal e personagens
- Sinopse completa e precisa
- Recepção crítica e do público (audiências, premiações)
- Curiosidades de bastidores, produção e impacto cultural
- Situação atual (renovado, encerrado, continuação prevista)

## ETAPA 2 — Retorne APENAS o JSON abaixo (sem texto fora do JSON):

```json
{
  "titlePt": "Título oficial usado pelas plataformas de streaming ou emissoras no Brasil/Portugal. Ordem de prioridade: 1) nome PT-BR oficial (Netflix BR, Prime Video BR, Viki, GloboPlay etc.) — ex: 'Rainha das Lágrimas', 'Minha Adorável Mentirosa'; 2) nome em inglês oficial se não houver PT-BR — ex: 'Queen of Tears', 'My Lovely Liar'; 3) romanização do título coreano se não existir localização oficial — ex: 'Gyeongseong Creature'. NUNCA traduza por conta própria — se não encontrar o nome oficial, use o inglês ou o romanizado.",

  "seoTitle": "Título SEO em PT-BR, máximo 60 caracteres. Formato: 'Título — Ano | HallyuHub'. Ex: 'Rainha das Lágrimas — 2024 | HallyuHub', 'Goblin — 2016 | HallyuHub'. Use o titlePt como base. Se for muito longo, abrevie o título mas mantenha o ano — o ano é relevante para buscas.",

  "metaDescription": "Descrição SEO em PT-BR, entre 140-158 caracteres. Inclua: título, gênero, protagonistas, e um gancho que desperte curiosidade ou urgência de assistir. Não copie a sinopse — escreva pensando no clique no Google. Ex: 'Rainha das Lágrimas (2024) é um drama coreano com Kim Soo-hyun e Kim Ji-won sobre um casal à beira do divórcio e um segredo que muda tudo.'",

  "synopsis": "Sinopse em PT-BR. 4-6 frases (180-250 palavras). Apresente brevemente os protagonistas, depois foque no que acontece: o conflito que se desenvolve, as forças que se opõem, as consequências que entram em jogo. Sem spoilers de plot twist ou final. Não copie a sinopse do TMDB — reescreva com ritmo narrativo. Exemplo de tom: 'Gong Ju Ah é uma designer que tenta escapar da sombra da família de médicos. Quando conhece Yang Hyun Bin, um diretor carismático, a conexão é imediata — mas os dois logo descobrem que suas famílias estão no centro de uma rixa de décadas. O romance que floresce entre eles vai colocar à prova lealdades antigas e segredos que ninguém queria ver à tona.'",

  "tagline": "Frase de impacto em PT-BR. Curta, direta, que capture a essência com alguma poesia ou tensão. null se não houver boa opção.",

  "whyWatch": "1-3 frases curtas em PT-BR. Tom de quem já assistiu e recomenda a um amigo — específico, sem clichê. Diga exatamente o que essa produção tem que outras não têm. Proibido: 'emocionante', 'imperdível', 'você vai se apaixonar', 'uma montanha-russa'. Se não for boa, seja honesto: 'para fãs do gênero que aceitam um ritmo mais lento'.",

  "editorialReview": "Análise em PT-BR. 2-3 parágrafos curtos, máximo 250 palavras. Tom de crítico de cultura pop que fala direto ao ponto — não um paper acadêmico. Diga o que funciona e o que não funciona com exemplos concretos (um personagem, uma cena, um choice narrativo). Termine com uma frase clara sobre para quem vale. Proibido: estrutura formal de tese, frases como 'O grande trunfo do projeto reside em...', parágrafos com mais de 5 linhas.",

  "editorialRating": 7.5,

  "curiosidades": [
    "Uma frase ou duas. Bastidores ou fato de produção que surpreende — algo que o espectador não percebe assistindo.",
    "Uma frase ou duas. Algo sobre o elenco, processo criativo ou escolha de locação que seja específico desta produção.",
    "Uma frase ou duas. Impacto real: número de audiência, recorde, premiação ou repercussão cultural com dado concreto.",
    "Uma frase ou duas. Detalhe sobre OST, estética visual ou elemento narrativo que virou assunto entre os fãs.",
    "Uma frase ou duas. Algo sobre a recepção do público ou um momento de bastidor que aconteceu durante a produção."
  ],

  "tags": ["tag1", "tag2", "tag3"],

  "faq": [
    {
      "pergunta": "Pergunta exatamente como alguém digitaria no Google — ex: 'Quantos episódios tem Rainha das Lágrimas?', 'Rainha das Lágrimas é baseado em manhwa?', 'Qual o OST de Goblin?', 'Goblin tem segunda temporada?'",
      "resposta": "Resposta direta, 1-2 frases, com o dado mais específico disponível."
    }
  ]
}
```

## REGRAS OBRIGATÓRIAS:
- Apenas informações **verificáveis e reais** — prefira omitir a inventar
- Se um campo não for confirmado, retorne `null` (para strings) ou omita (para arrays). **PROIBIDO** escrever frases como "Não há sinopse disponível", "Informação não encontrada", "Dados indisponíveis" — isso é `null`, não texto
- `titlePt`: use APENAS o nome oficial usado pelas plataformas. **NUNCA traduza literalmente** — se não encontrar o nome oficial em PT-BR, use o inglês oficial ou o romanizado. "Follow Me: Sincero no Gosto" é errado; "Follow Me" ou o título oficial é o correto
- `seoTitle`: máximo 60 caracteres contando espaços. Se o título for longo, abrevie mas mantenha o ano
- `metaDescription`: entre 140-158 caracteres — inclua título, ano, gênero, protagonistas e gancho de clique. **PROIBIDO** mencionar plataformas de streaming (muda rápido e fica desatualizado)
- `tags`: 4-8 termos que as pessoas buscam — ex: `["K-Drama", "Romance", "2024", "Kim Soo-hyun", "Rainha das Lágrimas elenco", "melhor drama 2024"]`. Inclua: gênero, ano, atores principais, subgênero (rom-com, thriller, histórico, fantasia)
- `faq`: 3-5 perguntas **evergreen** — que não ficam desatualizadas com o tempo. Boas: episódios, base em manhwa/webtoon, OST, prêmios ganhos, personagem do ator X. **PROIBIDO**: "onde assistir", datas de lançamento futuras, ranking atual, disponibilidade em plataformas
- `editorialRating`: número de 0 a 10 com uma casa decimal. Use a nota do TMDB como âncora — sua nota editorial não deve divergir mais de 1.5 pontos sem justificativa clara na análise. Escala de referência: 9.0-10 = obra rara, top 1% do gênero; 8.0-8.9 = excelente, muito acima da média; 7.0-7.9 = bom, vale muito a pena; 6.0-6.9 = razoável, tem problemas mas entretém; 5.0-5.9 = abaixo da média, só para fãs dedicados; abaixo de 5.0 = ruim. A maioria das produções coreanas se situa entre 6.5 e 8.0 — reserve notas abaixo de 6.0 para produções com falhas sérias e concretas.
- `editorialReview` deve mencionar pontos negativos se existirem — análise sem crítica não tem credibilidade
- Cada curiosidade: máximo 2 frases. Texto direto, sem prefixo "Curiosidade X:"
- **Tom geral:** PT-BR natural. Termos do K-Drama em inglês são bem-vindos (OST, cameo, makjang, rom-com, etc.)
- Sem superlativos vazios: proibido "incrível", "fenomenal", "obra-prima", "imperdível" sem contexto concreto
- Se a série/filme é medíocre, diga isso — o leitor confia em quem é honesto
- **PROIBIDO usar emojis** em qualquer campo — sem ✨, 🎬, ⭐, 📺 ou qualquer outro símbolo visual
- Retorne **APENAS o JSON**, sem markdown, sem explicação, sem ```

Produção: [COLE O NOME AQUI]
