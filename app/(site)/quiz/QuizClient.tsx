'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Trophy, RefreshCw, ChevronRight, CheckCircle2, XCircle, Sparkles, Share2, Flame, Zap, Clock, BookOpen } from 'lucide-react'

interface Question {
    id: number
    question: string
    options: string[]
    correct: number
    explanation: string
    category: 'k-pop' | 'k-drama' | 'cultura' | 'história'
    relatedHref?: string
    relatedLabel?: string
}

const ALL_QUESTIONS: Question[] = [
    {
        id: 1,
        question: 'Qual grupo de K-Pop detém o recorde de mais álbuns vendidos na história da Coreia do Sul?',
        options: ['EXO', 'BIGBANG', 'BTS', 'BLACKPINK'],
        correct: 2,
        explanation: 'O BTS é o grupo com mais álbuns vendidos na história da Coreia do Sul, com dezenas de milhões de cópias ao redor do mundo.',
        category: 'k-pop',
        relatedHref: '/blog/sm-hybe-yg-jyp-como-as-grandes-agencias-kpop-funcionam',
        relatedLabel: 'Como funcionam as big four do K-Pop',
    },
    {
        id: 2,
        question: 'O que significa "Hallyu"?',
        options: ['Música coreana', 'Onda coreana', 'Cultura pop', 'Drama coreano'],
        correct: 1,
        explanation: '"Hallyu" (한류) significa literalmente "Onda Coreana" e se refere ao fenômeno global de expansão da cultura pop sul-coreana.',
        category: 'cultura',
        relatedHref: '/blog/como-o-kpop-conquistou-o-brasil-historia-numeros',
        relatedLabel: 'Como o K-Pop conquistou o Brasil',
    },
    {
        id: 3,
        question: 'Qual K-Drama foi o primeiro da Netflix a alcançar o 1º lugar em mais de 90 países simultaneamente?',
        options: ['Crash Landing on You', 'Vincenzo', 'Squid Game', 'My Love from the Star'],
        correct: 2,
        explanation: '"Round 6" (Squid Game) estreou em setembro de 2021 e rapidamente se tornou a série mais assistida da Netflix.',
        category: 'k-drama',
        relatedHref: '/blog/squid-game-analise-cultural-netflix-hallyu',
        relatedLabel: 'Squid Game e o que mudou no mundo',
    },
    {
        id: 4,
        question: 'Qual é o nome do fandom oficial do BTS?',
        options: ['Blink', 'ARMY', 'EXO-L', 'Once'],
        correct: 1,
        explanation: 'O fandom do BTS se chama ARMY (Adorable Representative MC for Youth).',
        category: 'k-pop',
        relatedHref: '/blog/fandoms-kpop-light-sticks-fan-chants-fansigns',
        relatedLabel: 'Fandoms de K-Pop: light sticks e fan chants',
    },
    {
        id: 5,
        question: 'Em que ano o PSY lançou "Gangnam Style", música que viralizou globalmente?',
        options: ['2010', '2011', '2012', '2013'],
        correct: 2,
        explanation: '"Gangnam Style" foi lançado em julho de 2012 e se tornou o primeiro vídeo no YouTube a atingir 1 bilhão de visualizações.',
        category: 'história',
    },
    {
        id: 6,
        question: 'Qual atriz protagonizou o drama "Crash Landing on You" ao lado de Hyun Bin?',
        options: ['Park Min-young', 'Son Ye-jin', 'Kim Ji-won', 'Shin Min-a'],
        correct: 1,
        explanation: 'Son Ye-jin interpretou Yoon Se-ri. Ela e Hyun Bin se casaram na vida real em 2022.',
        category: 'k-drama',
    },
    {
        id: 7,
        question: 'Qual é o sistema de entretenimento que formou grupos como EXO, NCT e aespa?',
        options: ['HYBE', 'JYP Entertainment', 'YG Entertainment', 'SM Entertainment'],
        correct: 3,
        explanation: 'A SM Entertainment, fundada em 1995, formou grupos icônicos como EXO, NCT e aespa.',
        category: 'k-pop',
        relatedHref: '/blog/sm-hybe-yg-jyp-como-as-grandes-agencias-kpop-funcionam',
        relatedLabel: 'SM, HYBE, YG e JYP: como funcionam',
    },
    {
        id: 8,
        question: 'O que é "aegyo" na cultura coreana?',
        options: ['Um estilo de dança', 'Um gênero musical', 'Comportamento fofo e encantador', 'Um tipo de maquiagem'],
        correct: 2,
        explanation: '"Aegyo" (애교) se refere a um comportamento deliberadamente fofo e encantador.',
        category: 'cultura',
        relatedHref: '/blog/aegyo-o-que-e-cultura-coreana',
        relatedLabel: 'Aegyo: o que é e por que divide opiniões',
    },
    {
        id: 9,
        question: 'Qual K-Drama histórico (sageuk) é um dos mais amados de todos os tempos?',
        options: ['Goblin', 'Jewel in the Palace (Dae Jang Geum)', 'Signal', 'Reply 1988'],
        correct: 1,
        explanation: '"Jewel in the Palace" (2003) foi transmitido em mais de 90 países, tornando-se marco na exportação de dramas coreanos.',
        category: 'história',
    },
    {
        id: 10,
        question: 'Quantos membros tem o grupo TWICE?',
        options: ['7', '8', '9', '12'],
        correct: 2,
        explanation: 'O TWICE é composto por 9 membros, formado em 2015 pela JYP Entertainment.',
        category: 'k-pop',
    },
    {
        id: 11,
        question: 'Qual grupo lançou o álbum "Map of the Soul: Persona"?',
        options: ['EXO', 'BTS', 'SEVENTEEN', 'GOT7'],
        correct: 1,
        explanation: '"Map of the Soul: Persona" foi lançado pelo BTS em abril de 2019 e bateu recordes de pré-venda.',
        category: 'k-pop',
    },
    {
        id: 12,
        question: 'Em "Goblin", qual ator interpreta o imortal Goblin?',
        options: ['Lee Min-ho', 'Hyun Bin', 'Gong Yoo', 'Ji Chang-wook'],
        correct: 2,
        explanation: 'Gong Yoo interpretou Kim Shin, o Goblin imortal, em "Guardian: The Lonely and Great God" (2016-2017).',
        category: 'k-drama',
        relatedHref: '/blog/gong-yoo-ator-goblin-train-to-busan',
        relatedLabel: 'Gong Yoo: do café ao apocalipse zumbi',
    },
    {
        id: 13,
        question: 'O que é "daebak" em coreano?',
        options: ['Que pena!', 'Incrível / que sorte!', 'Obrigado', 'Com licença'],
        correct: 1,
        explanation: '"Daebak" (대박) significa algo incrível ou uma grande sorte. É muito usada em K-Dramas e pelo fandom.',
        category: 'cultura',
    },
    {
        id: 14,
        question: 'Qual grupo feminino ficou famoso pelo hit "Ddu-Du Ddu-Du"?',
        options: ['TWICE', 'Red Velvet', 'BLACKPINK', 'aespa'],
        correct: 2,
        explanation: '"Ddu-Du Ddu-Du" do BLACKPINK (2018) é um dos MVs de K-Pop feminino mais vistos de todos os tempos.',
        category: 'k-pop',
        relatedHref: '/blog/jennie-blackpink-rainha-k-pop-conquistou-mundo',
        relatedLabel: 'Jennie: a rainha do K-Pop',
    },
    {
        id: 15,
        question: 'Qual drama coreano aborda o tema de jogos mortais por dinheiro?',
        options: ['Alice', 'Sweet Home', 'Squid Game', 'Dark Hole'],
        correct: 2,
        explanation: 'Squid Game (2021) retrata personagens endividados em jogos infantis com consequências letais.',
        category: 'k-drama',
        relatedHref: '/blog/squid-game-analise-cultural-netflix-hallyu',
        relatedLabel: 'Squid Game e o que mudou no mundo',
    },
    {
        id: 16,
        question: 'Qual é a capital da Coreia do Sul, cenário de grande parte dos K-Dramas?',
        options: ['Busan', 'Incheon', 'Seul', 'Daegu'],
        correct: 2,
        explanation: 'Seul (서울) é a capital e maior cidade da Coreia do Sul, com cerca de 10 milhões de habitantes.',
        category: 'cultura',
    },
    {
        id: 17,
        question: 'Qual empresa gerencia o grupo BTS?',
        options: ['SM Entertainment', 'YG Entertainment', 'JYP Entertainment', 'HYBE'],
        correct: 3,
        explanation: 'O BTS é gerenciado pela HYBE (anteriormente Big Hit Entertainment), fundada por Bang Si-hyuk.',
        category: 'k-pop',
    },
    {
        id: 18,
        question: 'O que é "mukbang"?',
        options: ['Dança coreana tradicional', 'Transmissão ao vivo comendo grandes quantidades de comida', 'Estilo de maquiagem', 'Música folclórica'],
        correct: 1,
        explanation: '"Mukbang" (먹방) combina os termos para "comer" e "transmissão" em coreano.',
        category: 'cultura',
    },
    {
        id: 19,
        question: 'Qual ator sul-coreano protagonizou o filme "Parasita", vencedor do Oscar 2020?',
        options: ['Lee Byung-hun', 'Song Kang-ho', 'Choi Min-sik', 'Ha Jung-woo'],
        correct: 1,
        explanation: 'Song Kang-ho é o protagonista de "Parasita" (기생충). O filme ganhou o Oscar de Melhor Filme em 2020.',
        category: 'história',
    },
    {
        id: 20,
        question: 'Qual grupo é conhecido pelo conceito "School Trilogy" em seus primeiros álbuns?',
        options: ['SHINee', 'BTS', 'INFINITE', 'B.A.P'],
        correct: 1,
        explanation: 'O BTS iniciou com a "School Trilogy" (2013-2014), abordando temas de juventude e pressão escolar.',
        category: 'k-pop',
    },
    {
        id: 21,
        question: 'Qual grupo feminino tem como fandom o nome "BLINK"?',
        options: ['TWICE', 'BLACKPINK', 'Red Velvet', 'aespa'],
        correct: 1,
        explanation: 'O fandom oficial do BLACKPINK se chama BLINK, combinando "black" e "pink".',
        category: 'k-pop',
    },
    {
        id: 22,
        question: 'Em qual drama Lee Min-ho interpretou Gu Jun-pyo?',
        options: ['The King: Eternal Monarch', 'Boys Over Flowers', 'Legend of the Blue Sea', 'City Hunter'],
        correct: 1,
        explanation: '"Boys Over Flowers" (2009) tornou Lee Min-ho famoso internacionalmente.',
        category: 'k-drama',
    },
    {
        id: 23,
        question: 'Qual artista é conhecida como "Rainha do K-Pop Solo" e também atua em dramas?',
        options: ['Suzy', 'IU', 'Taeyeon', 'Jisoo'],
        correct: 1,
        explanation: 'IU é considerada a artista mais completa da Coreia, com sucessos como "LILAC" e dramas como "My Mister".',
        category: 'k-pop',
        relatedHref: '/blog/iu-artista-mais-completa-da-coreia',
        relatedLabel: 'IU: cantora, atriz e compositora',
    },
    {
        id: 24,
        question: 'Quantos membros compõem o grupo SEVENTEEN?',
        options: ['12', '13', '17', '9'],
        correct: 1,
        explanation: 'O SEVENTEEN tem 13 membros divididos em três unidades. O nome "17" vem de 13 + 3 unidades + 1 equipe.',
        category: 'k-pop',
    },
    {
        id: 25,
        question: 'Em "My Love from the Star", de qual planeta vem o personagem Do Min-joon?',
        options: ['Marte', 'KMT 184.05', 'Andrômeda', 'Nibiru'],
        correct: 1,
        explanation: 'Do Min-joon veio do planeta KMT 184.05, chegando à Terra em 1609.',
        category: 'k-drama',
    },
    {
        id: 26,
        question: 'Qual é o estilo musical popular mais antigo da Coreia que influenciou o K-Pop?',
        options: ['Pansori', 'Trot', 'Gagok', 'Minyo'],
        correct: 1,
        explanation: 'O Trot (트로트) experimentou um grande revival nos anos 2020 e é o gênero popular mais antigo da Coreia.',
        category: 'história',
    },
    {
        id: 27,
        question: 'Qual grupo lançou o hit "Ko Ko Bop" em 2017?',
        options: ['BTS', 'GOT7', 'EXO', 'MONSTA X'],
        correct: 2,
        explanation: 'O EXO lançou "Ko Ko Bop" como parte do álbum "The War" (2017), um dos álbuns mais vendidos daquele ano.',
        category: 'k-pop',
        relatedHref: '/blog/exo-a-geracao-que-vendeu-30-milhoes-de-albuns',
        relatedLabel: 'EXO: a geração que vendeu 30 milhões de álbuns',
    },
    {
        id: 28,
        question: 'Em qual plataforma de streaming estreou "Squid Game"?',
        options: ['Disney+', 'HBO Max', 'Netflix', 'Apple TV+'],
        correct: 2,
        explanation: '"Squid Game" estreou na Netflix em setembro de 2021, tornando-se a série mais assistida da plataforma.',
        category: 'k-drama',
    },
    {
        id: 29,
        question: 'Qual grupo feminino lançou o hit "Gee" em 2009?',
        options: ['2NE1', 'KARA', 'Girls\' Generation (SNSD)', 'Wonder Girls'],
        correct: 2,
        explanation: '"Gee" do Girls\' Generation ficou 9 semanas no topo das paradas sul-coreanas em 2009.',
        category: 'k-pop',
    },
    {
        id: 30,
        question: 'O que é o sistema de trainee no K-Pop?',
        options: ['Sistema de avaliação de fãs', 'Treinamento intensivo de futuros artistas', 'Programa de bolsas', 'Contrato de distribuição'],
        correct: 1,
        explanation: 'Trainees passam anos treinando canto, dança e idiomas em agências antes de debutar como ídolos.',
        category: 'cultura',
        relatedHref: '/blog/contrato-idol-coreia-do-sul-como-funciona',
        relatedLabel: 'Como funciona um contrato de idol',
    },
    {
        id: 31,
        question: 'Qual ator estrelou tanto "Goblin" quanto "Train to Busan"?',
        options: ['Lee Min-ho', 'Park Seo-joon', 'Gong Yoo', 'Ji Chang-wook'],
        correct: 2,
        explanation: 'Gong Yoo estrelou "Goblin" (2016) e "Train to Busan" (2016).',
        category: 'k-drama',
        relatedHref: '/blog/gong-yoo-ator-goblin-train-to-busan',
        relatedLabel: 'Gong Yoo: do café ao apocalipse zumbi',
    },
    {
        id: 32,
        question: 'Qual bairro de Seul é famoso pela vida cultural e K-Pop?',
        options: ['Gangnam', 'Hongdae', 'Itaewon', 'Insadong'],
        correct: 1,
        explanation: 'Hongdae, ao redor da Universidade Hongik, é famoso por arte de rua, lojas de K-Pop e eventos culturais.',
        category: 'cultura',
    },
    {
        id: 33,
        question: 'Qual grupo de K-Pop foi o primeiro a se apresentar no Grammy Awards?',
        options: ['EXO', 'BIGBANG', 'BTS', 'SHINee'],
        correct: 2,
        explanation: 'O BTS se apresentou no Grammy Awards em 2021, sendo o primeiro grupo sul-coreano a fazê-lo.',
        category: 'história',
    },
    {
        id: 34,
        question: 'Em "Queen of Tears", quem interpreta o protagonista Baek Hyun-woo?',
        options: ['Lee Min-ho', 'Kim Soo-hyun', 'Park Bo-gum', 'Song Joong-ki'],
        correct: 1,
        explanation: 'Kim Soo-hyun interpretou Baek Hyun-woo em "Queen of Tears" (2024), drama que quebrou recordes no tvN.',
        category: 'k-drama',
        relatedHref: '/blog/queen-of-tears-drama-netflix-recordes-2024',
        relatedLabel: 'Queen of Tears: por que quebrou todos os recordes',
    },
    {
        id: 35,
        question: 'Qual é o nome da prática ilegal de comprar álbuns em massa para manipular charts?',
        options: ['Sajaegi', 'Melon Chart', 'Mubank', 'Daesang'],
        correct: 0,
        explanation: '"Sajaegi" (사재기) é a compra ilegal de álbuns ou streams em massa. Já gerou diversos escândalos no K-Pop.',
        category: 'cultura',
    },
    {
        id: 36,
        question: 'Qual foi o primeiro artista coreano a atingir 1 bilhão de views no YouTube?',
        options: ['BTS', 'BIGBANG', 'PSY', 'Girls\' Generation'],
        correct: 2,
        explanation: 'PSY foi o primeiro com "Gangnam Style" em 2012 — também o primeiro vídeo de qualquer artista a atingir essa marca.',
        category: 'história',
    },
    {
        id: 37,
        question: 'Qual drama é baseado no webtoon de Yaongyi e estrelou Cha Eun-woo?',
        options: ['True Beauty', 'Itaewon Class', 'Extraordinary Attorney Woo', 'Weightlifting Fairy'],
        correct: 0,
        explanation: '"True Beauty" (2020) é baseado no webtoon de Yaongyi e estrelou Moon Ga-young e Cha Eun-woo do ASTRO.',
        category: 'k-drama',
        relatedHref: '/blog/webtoons-que-viraram-kdramas-lista-onde-assistir',
        relatedLabel: 'Webtoons que viraram K-Dramas',
    },
    {
        id: 38,
        question: 'Qual é o significado de "oppa" quando usado por uma mulher?',
        options: ['Irmão mais novo', 'Irmão mais velho / homem mais velho próximo', 'Amigo', 'Namorado'],
        correct: 1,
        explanation: '"Oppa" (오빠) é usado por mulheres para se referir a um homem mais velho com quem têm proximidade.',
        category: 'cultura',
        relatedHref: '/blog/oppa-unnie-hyung-noona-termos-coreanos-guia',
        relatedLabel: 'Oppa, unnie, hyung, noona: guia completo',
    },
    {
        id: 39,
        question: 'Qual grupo de 4ª geração debutou com o conceito "Fearless" em 2022?',
        options: ['aespa', 'ITZY', 'LE SSERAFIM', 'NewJeans'],
        correct: 2,
        explanation: 'LE SSERAFIM debutou em 2022 com "FEARLESS". O nome é um anagrama de "I\'M FEARLESS".',
        category: 'k-pop',
    },
    {
        id: 40,
        question: 'Qual ator ganhou o Globo de Ouro por "Squid Game" sendo o primeiro sul-coreano a vencer?',
        options: ['Lee Byung-hun', 'Wi Ha-joon', 'Oh Yeong-su', 'Park Hae-soo'],
        correct: 2,
        explanation: 'Oh Yeong-su ganhou o Globo de Ouro de Melhor Ator Coadjuvante em 2022 pelo papel do Jogador 001.',
        category: 'k-drama',
    },
    {
        id: 41,
        question: 'Qual grupo de K-Pop foi formado pelo reality show "Produce 101" em 2016?',
        options: ['IOI', 'WANNA ONE', 'IZ*ONE', 'X1'],
        correct: 0,
        explanation: 'IOI foi o primeiro grupo formado pelo Produce 101 (2016). Era feminino e temporário.',
        category: 'k-pop',
        relatedHref: '/blog/produce-101-reality-show-kpop-historia-escandalo',
        relatedLabel: 'Produce 101: o reality que reformatou o K-Pop',
    },
    {
        id: 42,
        question: 'O que é "Daesang" no K-Pop?',
        options: ['Um tipo de dança', 'O prêmio máximo das cerimônias musicais', 'Um festival de música', 'Uma gravadora independente'],
        correct: 1,
        explanation: '"Daesang" (대상) significa "Grande Prêmio". É o prêmio máximo em cerimônias como MAMA e Golden Disc.',
        category: 'cultura',
    },
    {
        id: 43,
        question: 'Em que país nasceu a integrante do BLACKPINK Lisa?',
        options: ['Coreia do Sul', 'Japão', 'Tailândia', 'China'],
        correct: 2,
        explanation: 'Lisa (Lalisa Manobal) nasceu na Tailândia em 1997. É a membro mais seguida individualmente nas redes sociais.',
        category: 'k-pop',
        relatedHref: '/blog/lisa-blackpink-trajetoria-carreira-solo',
        relatedLabel: 'Lisa: de Bangkok para o mundo',
    },
    {
        id: 44,
        question: 'Qual K-Drama de 2022 sobre uma advogada com autismo fez sucesso global?',
        options: ['Business Proposal', 'Extraordinary Attorney Woo', 'Our Blues', 'Twenty-Five Twenty-One'],
        correct: 1,
        explanation: '"Extraordinary Attorney Woo" estrelou Park Eun-bin e entrou no Top 10 da Netflix em mais de 50 países.',
        category: 'k-drama',
        relatedHref: '/blog/park-eun-bin-atriz-uma-advogada-extraordinaria',
        relatedLabel: 'Park Eun-bin: de atriz mirim ao fenômeno global',
    },
    {
        id: 45,
        question: 'Qual integrante do BTS é o líder e principal compositor do grupo?',
        options: ['Jin', 'Jungkook', 'RM', 'V'],
        correct: 2,
        explanation: 'RM (Kim Namjoon) é o líder e principal compositor. Também falou em nome do grupo na ONU.',
        category: 'k-pop',
    },
    {
        id: 46,
        question: 'Qual é o prato coreano feito de repolho fermentado com pimenta?',
        options: ['Bibimbap', 'Kimchi', 'Japchae', 'Tteokbokki'],
        correct: 1,
        explanation: 'Kimchi (김치) é o prato mais icônico da culinária coreana: vegetais fermentados temperados com pasta de pimenta.',
        category: 'cultura',
        relatedHref: '/blog/fermentados-coreanos-kimchi-doenjang-ganjang',
        relatedLabel: 'Fermentados coreanos: kimchi e além',
    },
    {
        id: 47,
        question: 'Qual grupo é formado pelas subunidades NCT 127, NCT Dream e WayV?',
        options: ['EXO', 'SUPER JUNIOR', 'NCT', 'BIGBANG'],
        correct: 2,
        explanation: 'O NCT (Neo Culture Technology) é um grupo sem limite de membros da SM Entertainment, dividido em várias subunidades.',
        category: 'k-pop',
    },
    {
        id: 48,
        question: 'Qual drama retrata pais obcecados em fazer os filhos entrarem nas melhores universidades?',
        options: ['Sky Castle', 'Reply 1988', 'School 2015', 'Weightlifting Fairy'],
        correct: 0,
        explanation: '"SKY Castle" (2018-2019) satiriza a pressão extrema da educação coreana e as famílias ricas de Seul.',
        category: 'k-drama',
    },
    {
        id: 49,
        question: 'Qual grupo de K-Pop tem como fandom o nome "ONCE"?',
        options: ['TWICE', 'SHINee', 'MONSTA X', 'GOT7'],
        correct: 0,
        explanation: 'O fandom do TWICE se chama ONCE porque "se você amar o TWICE, elas amarão você de volta duas vezes".',
        category: 'k-pop',
    },
    {
        id: 50,
        question: 'Qual conceito do K-Pop se refere à persona pública cultivada pelos ídolos?',
        options: ['Aegyo', 'Idol persona', 'Han', 'Jeong'],
        correct: 1,
        explanation: 'A "idol persona" é a imagem cuidadosamente construída pelas agências para o público, muitas vezes diferente da personalidade real do artista.',
        category: 'cultura',
        relatedHref: '/blog/idol-vs-artist-diferenca-carreira-kpop',
        relatedLabel: 'Idol vs. Artist: a diferença que define carreiras',
    },
]

const CATEGORY_COLORS: Record<string, string> = {
    'k-pop': 'text-pink-400 bg-pink-400/10 border-pink-400/20',
    'k-drama': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'cultura': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    'história': 'text-amber-400 bg-amber-400/10 border-amber-400/20',
}

const CATEGORY_LABELS: Record<string, string> = {
    'k-pop': 'K-Pop',
    'k-drama': 'K-Drama',
    'cultura': 'Cultura',
    'história': 'História',
}

function shuffle<T>(arr: T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

const QUIZ_SIZE = 10
const TIME_PER_QUESTION = 15

function getResult(score: number, total: number) {
    const pct = score / total
    if (pct === 1) return { title: 'Expert Hallyu! 🏆', desc: 'Perfeito! Você é um verdadeiro especialista em cultura coreana.', color: 'text-amber-400', bg: 'from-amber-500/10 to-amber-500/5' }
    if (pct >= 0.8) return { title: 'Fã dedicado! ⭐', desc: 'Muito bem! Você conhece K-Pop e K-Drama de verdade.', color: 'text-accent', bg: 'from-accent/10 to-accent/5' }
    if (pct >= 0.6) return { title: 'Bom conhecimento! 👏', desc: 'Você sabe bastante sobre o universo Hallyu!', color: 'text-blue-400', bg: 'from-blue-500/10 to-blue-500/5' }
    if (pct >= 0.4) return { title: 'Ainda aprendendo! 📚', desc: 'Explore mais artigos no HallyuHub para aprofundar seu conhecimento.', color: 'text-purple-400', bg: 'from-purple-500/10 to-purple-500/5' }
    return { title: 'Iniciante Hallyu! 🌱', desc: 'Todo mundo começa de algum lugar! Explore nosso site.', color: 'text-muted', bg: 'from-surface to-surface' }
}

function Confetti() {
    const pieces = Array.from({ length: 30 })
    const colors = ['bg-pink-400', 'bg-accent', 'bg-purple-400', 'bg-amber-400', 'bg-blue-400', 'bg-green-400']
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-50">
            {pieces.map((_, i) => (
                <div
                    key={i}
                    className={`absolute w-2 h-2 rounded-sm opacity-0 ${colors[i % colors.length]}`}
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-10px`,
                        animation: `confetti-fall ${1.5 + Math.random() * 2}s ease-in forwards`,
                        animationDelay: `${Math.random() * 0.8}s`,
                        transform: `rotate(${Math.random() * 360}deg)`,
                    }}
                />
            ))}
        </div>
    )
}

export function QuizClient() {
    const [questions, setQuestions] = useState<Question[]>(() => shuffle(ALL_QUESTIONS).slice(0, QUIZ_SIZE))
    const [current, setCurrent] = useState(0)
    const [selected, setSelected] = useState<number | null>(null)
    const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ_SIZE).fill(null))
    const [finished, setFinished] = useState(false)
    const [showExplanation, setShowExplanation] = useState(false)
    const [animating, setAnimating] = useState(false)
    const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION)
    const [streak, setStreak] = useState(0)
    const [points, setPoints] = useState(0)
    const [showStreak, setShowStreak] = useState(false)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const q = questions[current]
    const score = answers.filter((a, i) => a === questions[i]?.correct).length

    const scoreByCategory = useMemo(() => {
        const map: Record<string, { correct: number; total: number }> = {}
        questions.forEach((qu, i) => {
            if (!map[qu.category]) map[qu.category] = { correct: 0, total: 0 }
            map[qu.category].total++
            if (answers[i] === qu.correct) map[qu.category].correct++
        })
        return map
    }, [questions, answers])

    // Categorias onde errou mais — para recomendar conteúdo
    const weakCategories = useMemo(() => {
        return Object.entries(scoreByCategory)
            .filter(([, v]) => v.correct / v.total < 0.6)
            .map(([cat]) => cat)
    }, [scoreByCategory])

    // Links de conteúdo relacionado das perguntas que errou
    const relatedContent = useMemo(() => {
        return questions
            .filter((qu, i) => answers[i] !== qu.correct && qu.relatedHref)
            .slice(0, 3)
            .map(qu => ({ href: qu.relatedHref!, label: qu.relatedLabel! }))
    }, [questions, answers])

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }, [])

    const handleSelect = useCallback((idx: number) => {
        if (selected !== null) return
        stopTimer()
        setSelected(idx)
        setShowExplanation(true)

        const newAnswers = [...answers]
        newAnswers[current] = idx
        setAnswers(newAnswers)

        const isCorrect = idx === questions[current].correct
        if (isCorrect) {
            const timeBonus = Math.floor(timeLeft * 5)
            const newStreak = streak + 1
            setStreak(newStreak)
            setPoints(p => p + 100 + timeBonus)
            if (newStreak >= 2) {
                setShowStreak(true)
                setTimeout(() => setShowStreak(false), 1500)
            }
        } else {
            setStreak(0)
        }
    }, [selected, answers, current, questions, timeLeft, streak, stopTimer])

    // Timer
    useEffect(() => {
        if (selected !== null || finished) return
        setTimeLeft(TIME_PER_QUESTION)
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current!)
                    // Tempo esgotado — marca como errado
                    setSelected(-1)
                    setShowExplanation(true)
                    const newAnswers = [...answers]
                    newAnswers[current] = -1
                    setAnswers(newAnswers)
                    setStreak(0)
                    return 0
                }
                return t - 1
            })
        }, 1000)
        return stopTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, finished])

    const handleNext = useCallback(() => {
        stopTimer()
        setAnimating(true)
        setTimeout(() => {
            if (current < questions.length - 1) {
                setCurrent(c => c + 1)
                setSelected(null)
                setShowExplanation(false)
            } else {
                setFinished(true)
            }
            setAnimating(false)
        }, 200)
    }, [current, questions.length, stopTimer])

    const handleReset = useCallback(() => {
        stopTimer()
        setQuestions(shuffle(ALL_QUESTIONS).slice(0, QUIZ_SIZE))
        setCurrent(0)
        setSelected(null)
        setAnswers(Array(QUIZ_SIZE).fill(null))
        setFinished(false)
        setShowExplanation(false)
        setTimeLeft(TIME_PER_QUESTION)
        setStreak(0)
        setPoints(0)
    }, [stopTimer])

    const shareText = `Fiz o quiz do HallyuHub! Acertei ${score}/${questions.length} e fiz ${points} pontos 🎯 Tente você também:`
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://www.hallyuhub.com.br/quiz'

    const timerPct = (timeLeft / TIME_PER_QUESTION) * 100
    const timerColor = timeLeft > 7 ? 'bg-accent' : timeLeft > 4 ? 'bg-amber-400' : 'bg-red-400'

    if (finished) {
        const result = getResult(score, questions.length)
        return (
            <>
                {score === questions.length && <Confetti />}
                <style>{`
                    @keyframes confetti-fall {
                        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                        100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                    }
                `}</style>
                <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
                    <div className="max-w-md w-full">
                        {/* Header resultado */}
                        <div className={`text-center rounded-2xl bg-gradient-to-b ${result.bg} border border-border p-8 mb-4`}>
                            <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                                <Trophy className="w-10 h-10 text-accent" />
                            </div>
                            <h1 className={`text-2xl font-black mb-1 ${result.color}`}>{result.title}</h1>
                            <div className="text-5xl font-black text-foreground mb-1">
                                {score}<span className="text-xl text-muted font-normal">/{questions.length}</span>
                            </div>
                            <div className="flex items-center justify-center gap-1.5 mb-3">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span className="text-amber-400 font-black text-lg">{points} pts</span>
                            </div>
                            <p className="text-muted text-sm leading-relaxed">{result.desc}</p>
                        </div>

                        {/* Score por categoria */}
                        <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
                            <p className="text-xs font-black uppercase tracking-widest text-muted mb-3">Por categoria</p>
                            <div className="space-y-2.5">
                                {Object.entries(scoreByCategory).map(([cat, { correct, total }]) => (
                                    <div key={cat} className="flex items-center gap-3">
                                        <span className={`text-[10px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 flex-shrink-0 ${CATEGORY_COLORS[cat]}`}>
                                            {CATEGORY_LABELS[cat]}
                                        </span>
                                        <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-accent rounded-full transition-all duration-700"
                                                style={{ width: `${(correct / total) * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold text-foreground w-8 text-right">{correct}/{total}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Conteúdo recomendado — baseado nos erros */}
                        {(relatedContent.length > 0 || weakCategories.length > 0) && (
                            <div className="bg-surface border border-border rounded-2xl p-4 mb-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <BookOpen className="w-3.5 h-3.5 text-accent" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted">Aprenda mais</p>
                                </div>
                                <div className="space-y-2">
                                    {relatedContent.map((item, i) => (
                                        <Link
                                            key={i}
                                            href={item.href}
                                            className="flex items-center gap-2 text-xs text-foreground hover:text-accent transition-colors group"
                                        >
                                            <ChevronRight className="w-3 h-3 text-muted group-hover:text-accent flex-shrink-0" />
                                            <span className="line-clamp-1">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => {
                                    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
                                    window.open(url, '_blank', 'width=550,height=420')
                                }}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[#1DA1F2]/30 bg-[#1DA1F2]/10 text-[#1DA1F2] text-sm font-bold hover:bg-[#1DA1F2]/20 transition-all"
                            >
                                <Share2 className="w-4 h-4" />
                                Compartilhar no Twitter
                            </button>
                            <button
                                onClick={handleReset}
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border bg-surface text-foreground text-sm font-bold hover:bg-surface-hover transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Jogar novamente
                            </button>
                            <Link
                                href="/blog"
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-accent text-white text-sm font-bold hover:opacity-90 transition-all"
                            >
                                <Sparkles className="w-4 h-4" />
                                Explorar artigos
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
            {/* Streak popup */}
            {showStreak && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-500 text-white text-sm font-black px-4 py-2 rounded-full shadow-lg animate-bounce">
                    <Flame className="w-4 h-4" />
                    {streak}x sequência!
                </div>
            )}

            <div
                className="max-w-xl w-full"
                style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(4px)' : 'translateY(0)', transition: 'opacity 0.2s, transform 0.2s' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="text-center flex-1">
                        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5">
                            <Trophy className="w-3.5 h-3.5 text-accent" />
                            <span className="text-xs font-black text-accent uppercase tracking-wider">Quiz Hallyu</span>
                        </div>
                    </div>
                    {/* Pontos e streak */}
                    <div className="flex items-center gap-3 absolute right-4 sm:right-8">
                        <div className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-black text-amber-400">{points}</span>
                        </div>
                        {streak >= 2 && (
                            <div className="flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 text-orange-400" />
                                <span className="text-xs font-black text-orange-400">{streak}x</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress + timer */}
                <div className="mb-5">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-muted font-semibold">Pergunta {current + 1}/{questions.length}</span>
                        <div className="flex items-center gap-1.5">
                            <Clock className={`w-3.5 h-3.5 ${timeLeft <= 4 ? 'text-red-400 animate-pulse' : 'text-muted'}`} />
                            <span className={`text-xs font-black tabular-nums ${timeLeft <= 4 ? 'text-red-400' : 'text-muted'}`}>{timeLeft}s</span>
                        </div>
                    </div>
                    {/* Timer bar */}
                    <div className="h-1 bg-surface rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
                            style={{ width: `${timerPct}%` }}
                        />
                    </div>
                    {/* Mini dots de progresso */}
                    <div className="flex gap-1">
                        {questions.map((_, i) => (
                            <div key={i} className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
                                i < current
                                    ? answers[i] === questions[i].correct ? 'bg-green-400' : 'bg-red-400'
                                    : i === current ? 'bg-accent' : 'bg-surface'
                            }`} />
                        ))}
                    </div>
                </div>

                {/* Question card */}
                <div className="bg-surface border border-border rounded-2xl p-5 mb-3">
                    <div className="flex items-center gap-2 mb-4">
                        <span className={`text-[10px] font-black uppercase tracking-wider border rounded-full px-2.5 py-1 ${CATEGORY_COLORS[q.category]}`}>
                            {CATEGORY_LABELS[q.category]}
                        </span>
                    </div>
                    <p className="text-base font-bold text-foreground leading-snug mb-5">{q.question}</p>

                    <div className="space-y-2">
                        {q.options.map((opt, idx) => {
                            let cls = 'border-border bg-background text-foreground hover:border-accent/40 hover:bg-accent/5'
                            if (selected !== null) {
                                if (idx === q.correct) cls = 'border-green-500/60 bg-green-500/10 text-green-400'
                                else if (idx === selected) cls = 'border-red-500/60 bg-red-500/10 text-red-400'
                                else cls = 'border-border bg-background text-muted opacity-40'
                            }
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(idx)}
                                    disabled={selected !== null}
                                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3 ${cls} ${selected === null ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
                                >
                                    <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px] font-black flex-shrink-0">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="flex-1">{opt}</span>
                                    {selected !== null && idx === q.correct && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                                    {selected !== null && idx === selected && idx !== q.correct && <XCircle className="w-4 h-4 flex-shrink-0" />}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Explicação + link relacionado */}
                {showExplanation && (
                    <div className={`rounded-xl border p-4 mb-3 text-sm leading-relaxed ${selected === q.correct ? 'border-green-500/30 bg-green-500/5 text-green-300' : 'border-red-500/30 bg-red-500/5 text-red-300'}`}>
                        {selected === -1
                            ? <p className="font-bold mb-1">⏱ Tempo esgotado!</p>
                            : <p className="font-bold mb-1">{selected === q.correct ? '✓ Correto!' : '✗ Incorreto'}</p>
                        }
                        <p className="text-xs opacity-90 mb-2">{q.explanation}</p>
                        {q.relatedHref && (
                            <Link
                                href={q.relatedHref}
                                className="inline-flex items-center gap-1 text-[11px] font-bold opacity-80 hover:opacity-100 underline underline-offset-2 transition-opacity"
                            >
                                <BookOpen className="w-3 h-3" />
                                {q.relatedLabel}
                            </Link>
                        )}
                    </div>
                )}

                {/* Next */}
                {selected !== null && (
                    <button
                        onClick={handleNext}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:opacity-90 transition-all active:scale-[0.99]"
                    >
                        {current < questions.length - 1 ? (
                            <><ChevronRight className="w-4 h-4" />Próxima pergunta</>
                        ) : (
                            <><Trophy className="w-4 h-4" />Ver resultado</>
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
