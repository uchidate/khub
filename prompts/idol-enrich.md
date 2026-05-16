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
- Situação atual (2024-2025)

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

  "bio": "Biografia em PT-BR. 2 parágrafos. 150-200 palavras total. Primeiro parágrafo: quem é, de onde veio, como surgiu na cena. Segundo parágrafo: o que está fazendo agora (2023-2025). Tom: direto e factual, como uma boa Wikipedia em português — sem exagero, sem adjetivo solto. Pode usar termos do K-Pop em inglês quando for o vocabulário natural (idol, comeback, debut). Proibido: 'Com uma trajetória marcada por...', 'É impossível falar de X sem...', 'um dos maiores...', qualquer frase que seria igual pra qualquer outro artista.",

  "analiseEditorial": "Análise editorial em PT-BR. DIFERENTE da bio — não repita os mesmos fatos. Foco em: estilo artístico específico, o que esse artista faz de diferente na prática, prêmios com contexto do que representam, influências concretas. 2 parágrafos com títulos em negrito. 200-300 palavras. Tom: informado e direto, como um jornalista de cultura pop que respeita o leitor — nem fã babando nem crítico distante. Evite superlativos vazios ('o maior', 'incomparável', 'sensação mundial') — deixe os fatos falarem.\n\nTítulos: devem ser simples e temáticos, não corporativos. Exemplos bons: '**Voz e Composição**', '**Na tela**', '**O que a diferencia**', '**Carreira solo**'. Exemplos ruins (PROIBIDO): 'Métricas de Desempenho', 'Validação Institucional', 'Gestão de Imagem', 'Posicionamento Estratégico' — qualquer coisa que pareça relatório de negócios.\n\nFormato:\n**Título 1**\nConteúdo\n\n**Título 2**\nConteúdo",

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
    "instagram": "URL completa ou null",
    "twitter": "URL completa ou null",
    "youtube": "URL completa do canal ou null",
    "tiktok": "URL completa ou null",
    "weverse": "URL completa ou null",
    "spotify": "URL completa do perfil ou null"
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
  ]
}
```

## REGRAS OBRIGATÓRIAS:
- Apenas informações **verificáveis e reais** — prefira omitir a inventar
- Se um campo não for confirmado com certeza, retorne `null`
- `bio` e `analiseEditorial` **devem ser diferentes** — não repita os mesmos fatos
- Cada curiosidade: mínimo 2 frases completas, máximo 3
- `roles` em maiúsculo: `ATOR`, `CANTOR`, `MODELO`, `IDOL`, `APRESENTADOR`, `DANÇARINO`
- `height`: apenas número, sem "cm"
- `bloodType`: apenas A, B, AB, O ou null
- Datas nos `awards` e `destaques`: ano inteiro (ex: 2023)
- **Tom geral:** PT-BR natural do fã brasileiro. Termos do K-Pop em inglês são bem-vindos quando fazem parte do vocabulário da cultura (comeback, debut, stan, bias, maknae, bridge, high note, choreography, etc.). Evite traduzir à força o que todo mundo fala em inglês mesmo — "ponte musical" não é como ninguém fala, "bridge" é.
- Sem superlativos vazios: proibido usar "incrível", "fenomenal", "o maior", "incomparável", "sensação", "talentoso" e similares sem contexto concreto que justifique
- Sem linguagem de press release ou fanzine — o leitor vai ler dezenas de bios, então quem exagera perde credibilidade
- Se o artista tem algo realmente notável, mostre com fatos; se não tem, não invente
- **PROIBIDO usar emojis** em qualquer campo — sem ✨, 🎤, ⭐, 🎬 ou qualquer outro símbolo visual
- Retorne **APENAS o JSON**, sem markdown, sem explicação, sem ```

Artista: [COLE O NOME AQUI]
