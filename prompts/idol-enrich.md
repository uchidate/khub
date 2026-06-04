Você é um especialista em cultura K-Pop e K-Drama com acesso às informações mais atualizadas sobre o entretenimento coreano. Pesquise e retorne dados precisos e verificáveis sobre o artista abaixo.

## ETAPA 1 — Pesquise sobre o artista:
- Nome completo real (nome de nascimento em coreano e romanizado)
- Data e local de nascimento, altura, tipo sanguíneo, nacionalidade
- Data de debut (solo ou no primeiro grupo)
- Grupo(s) musical(is), agência atual
- Nome do fandom e cor oficial
- Linha do tempo da carreira (eventos reais com anos)
- Projetos mais relevantes (dramas, filmes, álbuns, solos)
- Curiosidades reais e surpreendentes
- Situação atual (2024-2026)

## ETAPA 2 — Retorne APENAS o JSON abaixo (sem texto fora do JSON):

```json
{
  "nameRomanized": "Nome romanizado conforme padrão coreano (ex: Park Bo-gum)",
  "nameHangul": "이름 한글",
  "birthName": "Nome de nascimento em hangul, se diferente do nome artístico",
  "height": "altura em cm, apenas número (ex: 183)",
  "bloodType": "tipo sanguíneo — A, B, AB ou O. null se não confirmado",
  "nationality": "Nacionalidade em inglês (ex: South Korean, Thai, Chinese). null se incerto",
  "debutDate": "Data de debut no formato YYYY-MM-DD. Debut solo ou no primeiro grupo — o que vier primeiro. null se não confirmado",
  "placeOfBirth": "Cidade, Província, South Korea (em inglês)",
  "gender": "Gênero do artista — use exatamente: 'male', 'female', ou 'non-binary'. null se incerto.",

  "seoTitle": "Título SEO em PT-BR, máximo 60 caracteres. Formato recomendado: 'Nome — Papel Principal | HallyuHub'. Exemplos: 'Park Bo-gum — Ator e Cantor | HallyuHub', 'IU — Cantora e Atriz | HallyuHub', 'BTS — Grupo de K-Pop | HallyuHub'. Inclua a palavra-chave mais buscada sobre o artista.",

  "metaDescription": "Descrição SEO em PT-BR. OBRIGATÓRIO: entre 140 e 158 caracteres — NÃO ultrapasse 158, NÃO fique abaixo de 140. Conte os caracteres antes de finalizar. Deve incluir: nome completo, papel principal (ator/cantor/idol), algo concreto que o identifica (drama mais famoso OU álbum mais conhecido OU grupo), e um gancho que estimule o clique. Não copie a bio — escreva como se fosse o texto que aparece no Google abaixo do título. Exemplos dentro do range: 'Park Bo-gum é um ator e cantor sul-coreano conhecido por Reply 1988 e Encounter. Confira carreira, dramas, discografia e curiosidades no HallyuHub.' (148 chars) | 'IU é cantora, atriz e compositora sul-coreana, conhecida por My Mister e Hotel de Luna. Veja discografia, dramas, prêmios e curiosidades no HallyuHub.' (152 chars). Se passar de 158: remova adjetivos ou encurte o gancho final. Se ficar abaixo de 140: adicione o país, o grupo ou a plataforma do drama.",

  "bio": "Biografia em PT-BR para a seção Perfil da página pública. APENAS ESTE CAMPO — não criar campos extras como bio2023_2025, bio_recente ou similares. Exatamente 3 parágrafos separados por linha em branco (use \\n\\n entre eles), 220-320 palavras no total. Cada parágrafo deve ter 2-4 frases curtas; evite blocos longos. Primeiro parágrafo: quem é, de onde veio, como surgiu na cena — inclua nome completo, origem e contexto do debut. Segundo parágrafo: projetos de maior impacto e o que os tornou relevantes (cite títulos reais). Terceiro parágrafo: atividade recente (2023-2026 se disponível) e situação atual. Não use markdown, títulos, listas, bullets, [TAGS], [FATOS], [QUOTE] ou emojis dentro de bio. Tom: próximo do leitor, como alguém que entende K-Pop contando pro amigo — direto, sem formalidade acadêmica. Pode usar termos do K-Pop em inglês quando for o vocabulário natural (idol, comeback, debut). Proibido: 'Com uma trajetória marcada por...', 'É impossível falar de X sem...', 'um dos maiores...', qualquer frase que seria igual pra qualquer outro artista. Proibido também linguagem corporativa disfarçada de natural: 'diversificou seu portfólio', 'expandiu sua atuação artística', 'manteve sua rotina de gravações ativa', 'envolvendo-se no desenvolvimento de novos projetos'. Prefira: 'partiu para', 'apostou em', 'foi escalado/a para', 'lançou', 'está trabalhando em'.",

  "analiseEditorial": "Análise editorial em PT-BR. DIFERENTE da bio — não repita os mesmos fatos na mesma ordem. A página pública renderiza este campo em blocos editoriais: Essência, Viradas e Por onde começar. Por isso, escreva conteúdo valioso, direto e compacto: cada marcador precisa revelar algo relevante sobre o artista, não decorar a página. Foco em: estilo artístico específico, o que esse artista faz de diferente na prática, prêmios com contexto do que representam, influências concretas, viradas de carreira e obras que funcionam como porta de entrada. 300-480 palavras. Tom: informado e direto, como um jornalista de cultura pop que respeita o leitor — nem fã babando nem crítico distante. Evite superlativos vazios — deixe os fatos falarem.\n\nUSAR OS MARCADORES VISUAIS COM FUNÇÃO EDITORIAL — eles devem aparecer exatamente neste formato, sem variações de nome:\n\n**Modelo renderizado na página:**\n- Essência: vem de `[MOMENTO]` e `[DESTAQUE]`. Use frases de impacto com fato concreto.\n- Perfil: vem do campo `bio`. Não recontar a bio aqui.\n- Viradas: vem de `[TIMELINE]`. Mostre evolução lógica da carreira.\n- Por onde começar: vem da seção `**Por onde começar**`. Recomende obras específicas para novos leitores.\n- Detalhes: vem de `curiosidades`. Não repetir curiosidades neste campo.\n\n**Marcadores disponíveis:**\n- `[MOMENTO]rótulo:texto[/MOMENTO]` → frase compacta sobre a virada real mais interessante. Usar 1 vez. O texto deve ter até 140 caracteres e conter fato específico, não elogio genérico.\n- `[DESTAQUE]texto[/DESTAQUE]` → frase editorial de impacto. Usar 1 vez. Deve explicar por que o leitor deveria se importar em até 160 caracteres.\n- `[RECORDE]texto[/RECORDE]` → conquista verificável. Usar 0-1 vez, só quando houver dado forte e conferível.\n- `[TAGS]tag1,tag2,tag3[/TAGS]` → termos de estilo/influência. Use 0-1 vez, 4-6 tags, somente se acrescentarem leitura.\n- `[FATOS]label:valor|label:valor[/FATOS]` → dados objetivos. Use 0-1 vez, 3-5 itens curtos, sem repetir ficha técnica básica.\n- `[TIMELINE]ano:texto|ano:texto[/TIMELINE]` → linha do tempo compacta com 4-5 marcos verificáveis. Textos com no máximo 80 caracteres cada.\n- `[QUOTE]frase do artista[/QUOTE]` → citação direta real, curta e verificável. Use só se tiver certeza; caso contrário, omita.\n- `[DIVISOR]` → separador visual. Usar no máximo 1 vez.\n- `**Por onde começar**` → título obrigatório para a seção final. Depois dele, escreva 1 parágrafo curto recomendando 2-4 obras/músicas/dramas específicos e dizendo o motivo de cada entrada.\n\n**Estrutura obrigatória:**\nParágrafo introdutório curto, com 2-3 frases e um gancho factual.\n\n[MOMENTO]Rótulo curto:frase específica sobre a virada mais interessante[/MOMENTO]\n\n[DESTAQUE]frase que explica o valor artístico ou cultural do artista com fato concreto[/DESTAQUE]\n\n[RECORDE]conquista verificável e específica — omitir se não houver dado forte[/RECORDE]\n\n[TAGS]tag1,tag2,tag3,tag4,tag5[/TAGS]\n\n[FATOS]Obra-chave:título|Virada:evento|Assinatura:traço artístico|Porta de entrada:obra[/FATOS]\n\n[TIMELINE]ano:marco verificável|ano:marco verificável|ano:marco verificável|ano:marco verificável|ano:marco verificável[/TIMELINE]\n\n**Por onde começar**\n1 parágrafo compacto com recomendações específicas para quem quer entender o artista sem pesquisar em outro lugar.",

  "curiosidades": [
    "Texto direto da curiosidade, sem numerar nem prefixar. 2-3 frases. Algo surpreendente sobre personalidade ou história que até fãs antigos talvez não saibam.",
    "Texto direto. Um talento ou hábito inesperado — o tipo de coisa que faz alguém falar 'sério isso?'.",
    "Texto direto. Uma conquista ou recorde concreto, com contexto do que torna isso especial. Não começar com 'A faixa X obteve...' — seja mais conversacional.",
    "Texto direto. Um momento icônico com os fãs ou dentro do fandom.",
    "Texto direto. Uma conexão real com outros artistas ou amizade que o público ama.",
    "Texto direto. Algo dos bastidores, da época de trainee ou do debut que poucos conhecem."
  ],

  "fanInfo": {
    "fanName": "Nome oficial do fandom",
    "fanColor": "Cor oficial em hex ou nome (ex: #FFE5CC, Rose Gold)",
    "lightstick": "Descrição do lightstick oficial, se existir. null se não tiver."
  },

  "socialLinks": {
    "instagram": "URL plain text, sem markdown. Ex: https://www.instagram.com/dlwlrma — ou null se não confirmado",
    "twitter": "URL plain text, sem markdown. Ex: https://x.com/_IUofficial — ou null",
    "youtube": "URL plain text do canal oficial. Ex: https://www.youtube.com/@dlwlrma — ou null",
    "tiktok": "URL plain text ou null",
    "weverse": "URL plain text. Ex: https://weverse.io/iu — ou null se não tiver página oficial",
    "spotify": "URL plain text do perfil do artista no Spotify. Ex: https://open.spotify.com/artist/3Y7MC3jscZg6GlgnvJmY4X — ou null"
  },

  "roles": ["ATOR", "CANTOR", "MODELO"],

  "musicalStyle": "2-3 frases sobre o estilo musical ou de atuação. Seja específico: cite referências reais, sonoridades concretas, comparações que façam sentido pra quem ouve K-Pop/assiste K-Drama. Nada de 'mistura de influências variadas' — diga quais. null se não aplicável.",

  "destaques": {
    "dramas": [
      {"titulo": "Nome do drama", "ano": 2023, "personagem": "Nome do personagem", "nota": "Plataforma ou canal. Uma frase sobre o papel."}
    ],
    "filmes": [
      {"titulo": "Nome do filme", "ano": 2024, "nota": "Uma frase sobre o papel."}
    ],
    "albuns": [
      {"titulo": "Nome do álbum/EP", "ano": 2023, "tipo": "Mini Album / Single / Full Album", "destaque": "Música principal ou feat."}
    ]
  },

  "awards": [
    {"premio": "Nome do prêmio (ex: Baeksang Arts Awards)", "categoria": "Melhor Ator", "ano": 2023},
    {"premio": "Outro prêmio", "categoria": "Categoria", "ano": 2024}
  ],

  "tags": ["tag1", "tag2", "tag3"],

  "faq": [
    {
      "pergunta": "Pergunta 1 exatamente como alguém digitaria no Google",
      "resposta": "Resposta direta, 1-2 frases."
    },
    {
      "pergunta": "Pergunta 2",
      "resposta": "Resposta 2."
    },
    {
      "pergunta": "Pergunta 3",
      "resposta": "Resposta 3."
    }
  ],

  "videos": [
    {"title": "Título do MV ou performance mais famoso(a)", "url": "https://www.youtube.com/watch?v=ID"},
    {"title": "Segundo MV ou trilha sonora relevante", "url": "https://www.youtube.com/watch?v=ID"},
    {"title": "Terceiro vídeo relevante (trailer, live, OST)", "url": "https://www.youtube.com/watch?v=ID"}
  ]
}
```

## REGRAS OBRIGATÓRIAS:
- Apenas informações **verificáveis e reais** — prefira omitir a inventar
- Se um campo não for confirmado com certeza, retorne `null`
- `bio` e `analiseEditorial` **devem ser diferentes** — não repita os mesmos fatos
- `bio` deve ser texto corrido limpo, com exatamente 3 parágrafos separados por `\n\n`; não inclua subtítulos, markdown, tags visuais nem listas
- `analiseEditorial` deve usar `[MOMENTO]`, `[DESTAQUE]`, `[TAGS]`, `[FATOS]`, `[TIMELINE]` e a seção `**Por onde começar**`. `[RECORDE]` e `[DIVISOR]` são opcionais
- Na página, `[MOMENTO]`, `[DESTAQUE]`, `[TAGS]` e `[FATOS]` viram o bloco **Essência**. Escreva esses marcadores como peças complementares: impacto, leitura de estilo e dados rápidos, sem repetir a ficha técnica
- Em `[FATOS]`, não use Debut/Estreia, Agência, Nascimento, Local, Altura, Tipo sanguíneo ou Nacionalidade. Esses dados pertencem ao hero/ficha técnica; em `[FATOS]`, prefira Obra-chave, Virada, Assinatura, Papel marcante, Prêmio relevante ou Porta de entrada
- `[MOMENTO]`, `[DESTAQUE]` e `[RECORDE]` devem ser frases de impacto: informação importante, verificável, direta e compacta. Proibido frase bonita sem dado concreto
- Não invente citações para `[QUOTE]`; se não houver frase real confirmada, omita esse marcador
- Nunca misture marcadores dentro de outros marcadores; cada marcador deve ficar sozinho em seu próprio bloco
- **Organização lógica do conteúdo:** `bio` conta a evolução em ordem cronológica; `analiseEditorial` interpreta por que essa evolução importa; `curiosidades` traz detalhes laterais que ainda não apareceram na bio nem na análise
- **Regra anti-repetição:** cada fato forte deve ter uma função principal. Exemplo: se "Good Day" aparece na bio como virada de carreira, na análise ele pode aparecer só na timeline ou como recomendação, mas não em todos os blocos. Não repita a mesma obra em `[MOMENTO]`, `[FATOS]`, `[TIMELINE]`, `[DESTAQUE]` e curiosidades ao mesmo tempo
- **Progressão obrigatória da leitura:** origem/debut → virada → maturidade artística → obras de entrada. Não comece a análise repetindo nascimento, agência e debut; isso já é papel da bio e do grid de fatos
- Cada curiosidade: mínimo 2 frases completas, máximo 3
- `roles` em maiúsculo: `ATOR`, `CANTOR`, `MODELO`, `IDOL`, `APRESENTADOR`, `DANÇARINO`
- `seoTitle`: máximo 60 caracteres — conta espaços. Se passar, corte o papel e deixe só o nome + HallyuHub
- `metaDescription`: **OBRIGATÓRIO entre 140 e 158 caracteres** — conte os caracteres antes de escrever o JSON. Se tiver abaixo de 140, expanda com mais contexto (ex: plataforma do drama, ano de debut, grupo). Se passar de 158, corte sem comprometer o sentido
- `tags`: 4-8 termos em português/inglês que as pessoas buscam sobre esse artista — ex: `["K-Drama", "Ator", "Park Bo-gum dramas", "Goblin elenco", "Reply 1988"]`. Inclua: gênero, papel, dramas/grupos famosos, nome completo se tiver variação conhecida
- `faq`: 3-5 perguntas **evergreen** (que não ficam desatualizadas) — ex: "Qual o nome real de X?", "Quando X fez debut?", "X é casado?", "Qual o grupo de X?". **PROIBIDO** perguntas sobre streaming, datas de lançamento futuras ou ranking atual
- **CRÍTICO — faq keys:** TODOS os itens do faq DEVEM usar exatamente `"pergunta"` e `"resposta"`. **JAMAIS** use `"sn"`, `"r"`, `"answer"`, `"resp"` ou qualquer variação — isso causa erro de validação. Copie o padrão do schema acima para todos os itens
- `videos`: 2-4 entradas com os MVs/performances mais relevantes do artista no YouTube. Usar apenas URLs do formato `https://www.youtube.com/watch?v=ID` que sejam uploads oficiais (canal do artista, gravadora ou rede de TV). Não inventar URLs — se não tiver certeza do ID, omitir o item. Títulos curtos e descritivos (ex: "IU — Celebrity MV", "BTS — Dynamite (Official MV)")
- `height`: apenas número, sem "cm"
- `bloodType`: apenas A, B, AB, O ou null
- `gender`: apenas `"male"`, `"female"`, `"non-binary"` ou null — NUNCA traduzir
- `placeOfBirth`: Seul é uma cidade autônoma — use `"Seoul, South Korea"`, NÃO `"Seoul, Gyeonggi Province"`
- `socialLinks`: **APENAS URLs plain text** — PROIBIDO formato markdown `[texto](url)` ou links que redirecionam para `google.com/search`. Se não encontrar a URL direta do perfil, retorne `null`
- Datas nos `awards` e `destaques`: ano inteiro (ex: 2023)
- **Tom geral:** PT-BR natural do fã brasileiro. Termos do K-Pop em inglês são bem-vindos quando fazem parte do vocabulário da cultura (comeback, debut, stan, bias, maknae, bridge, high note, choreography, etc.). Evite traduzir à força o que todo mundo fala em inglês mesmo — "ponte musical" não é como ninguém fala, "bridge" é.
- Sem superlativos vazios: proibido usar "incrível", "fenomenal", "o maior", "incomparável", "sensação", "talentoso" e similares sem contexto concreto que justifique
- Sem linguagem de press release ou fanzine — o leitor vai ler dezenas de bios, então quem exagera perde credibilidade
- Se o artista tem algo realmente notável, mostre com fatos; se não tem, não invente
- **EXPRESSÕES PROIBIDAS por soarem artificiais ou robóticas:**
  - ❌ "indústria do entretenimento" → use "televisão coreana", "mercado fonográfico", "cena do K-Pop", "setor audiovisual" ou simplesmente o contexto direto
  - ❌ "consolidou sua trajetória", "consolidou sua carreira", "consolida sua posição"
  - ❌ "se traduz em", "se traduz como"
  - ❌ "profissional", "o/a profissional" referindo-se ao artista — use o nome ou "a atriz", "o cantor", "ela", "ele"
  - ❌ "universo artístico", "universo musical", "universo criativo"
  - ❌ "retrospecto", "trajetória ascendente", "jornada artística"
  - ❌ "voltados para o streaming global", "conteúdo de alcance global"
  - ❌ "se destacar no cenário", "no cenário do K-Pop/K-Drama"
  - ❌ qualquer frase que descreveria igualmente qualquer outro artista do mesmo gênero
- **PROIBIDO usar emojis** em qualquer campo — sem ✨, 🎤, ⭐, 🎬 ou qualquer outro símbolo visual
- Retorne **APENAS o JSON**, sem markdown, sem explicação, sem ```

Artista: [COLE O NOME AQUI]
