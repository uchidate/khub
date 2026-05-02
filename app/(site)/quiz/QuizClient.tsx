'use client'

import { useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Trophy, RefreshCw, ChevronRight, CheckCircle2, XCircle, Sparkles, Share2 } from 'lucide-react'

interface Question {
    id: number
    question: string
    options: string[]
    correct: number
    explanation: string
    category: 'k-pop' | 'k-drama' | 'cultura' | 'história'
}

const ALL_QUESTIONS: Question[] = [
    {
        id: 1,
        question: 'Qual grupo de K-Pop detém o recorde de mais álbuns vendidos na história da Coreia do Sul?',
        options: ['EXO', 'BIGBANG', 'BTS', 'BLACKPINK'],
        correct: 2,
        explanation: 'O BTS é o grupo com mais álbuns vendidos na história da Coreia do Sul, com dezenas de milhões de cópias ao redor do mundo.',
        category: 'k-pop',
    },
    {
        id: 2,
        question: 'O que significa "Hallyu"?',
        options: ['Música coreana', 'Onda coreana', 'Cultura pop', 'Drama coreano'],
        correct: 1,
        explanation: '"Hallyu" (한류) significa literalmente "Onda Coreana" e se refere ao fenômeno global de expansão da cultura pop sul-coreana.',
        category: 'cultura',
    },
    {
        id: 3,
        question: 'Qual K-Drama foi o primeiro da Netflix a alcançar o 1º lugar em mais de 90 países simultaneamente?',
        options: ['Crash Landing on You', 'Vincenzo', 'Squid Game', 'My Love from the Star'],
        correct: 2,
        explanation: '"Round 6" (Squid Game) estreou em setembro de 2021 e rapidamente se tornou a série mais assistida da Netflix, chegando ao topo em mais de 90 países.',
        category: 'k-drama',
    },
    {
        id: 4,
        question: 'Qual é o nome do fandom oficial do BTS?',
        options: ['Blink', 'ARMY', 'EXO-L', 'Once'],
        correct: 1,
        explanation: 'O fandom do BTS se chama ARMY (Adorable Representative MC for Youth). O nome foi escolhido por simbolizar a parceria entre o grupo e seus fãs.',
        category: 'k-pop',
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
        explanation: 'Son Ye-jin interpretou Yoon Se-ri em "Crash Landing on You" (2019-2020). Ela e Hyun Bin se casaram na vida real em 2022.',
        category: 'k-drama',
    },
    {
        id: 7,
        question: 'Qual é o sistema de entretenimento que formou grupos como EXO, NCT e aespa?',
        options: ['HYBE', 'JYP Entertainment', 'YG Entertainment', 'SM Entertainment'],
        correct: 3,
        explanation: 'A SM Entertainment, fundada em 1995, formou grupos icônicos como H.O.T., TVXQ, Super Junior, Girls\' Generation, EXO, NCT e aespa.',
        category: 'k-pop',
    },
    {
        id: 8,
        question: 'O que é "aegyo" na cultura coreana?',
        options: ['Um estilo de dança', 'Um gênero musical', 'Comportamento fofo e encantador', 'Um tipo de maquiagem'],
        correct: 2,
        explanation: '"Aegyo" (애교) se refere a um comportamento deliberadamente fofo e encantador, muito comum entre ídolos de K-Pop como forma de se conectar com os fãs.',
        category: 'cultura',
    },
    {
        id: 9,
        question: 'Qual K-Drama histórico (sageuk) é um dos mais amados de todos os tempos?',
        options: ['Goblin', 'Jewel in the Palace (Dae Jang Geum)', 'Signal', 'Reply 1988'],
        correct: 1,
        explanation: '"Jewel in the Palace" (Daejanggeum / 대장금, 2003) foi um marco na exportação de dramas coreanos, sendo transmitido em mais de 90 países.',
        category: 'história',
    },
    {
        id: 10,
        question: 'Quantos membros tem o grupo TWICE?',
        options: ['7', '8', '9', '12'],
        correct: 2,
        explanation: 'O TWICE é composto por 9 membros: Nayeon, Jeongyeon, Momo, Sana, Jihyo, Mina, Dahyun, Chaeyoung e Tzuyu. O grupo foi formado em 2015 pela JYP Entertainment.',
        category: 'k-pop',
    },
    {
        id: 11,
        question: 'Qual grupo lançou o álbum "Map of the Soul: Persona"?',
        options: ['EXO', 'BTS', 'SEVENTEEN', 'GOT7'],
        correct: 1,
        explanation: '"Map of the Soul: Persona" foi lançado pelo BTS em abril de 2019 e bateu recordes de pré-venda na Coreia do Sul.',
        category: 'k-pop',
    },
    {
        id: 12,
        question: 'Em "Goblin", qual ator interpreta o imortal Goblin?',
        options: ['Lee Min-ho', 'Hyun Bin', 'Gong Yoo', 'Ji Chang-wook'],
        correct: 2,
        explanation: 'Gong Yoo interpretou Kim Shin, o Goblin imortal, no drama "Guardian: The Lonely and Great God" (2016-2017), um dos mais assistidos da história do tvN.',
        category: 'k-drama',
    },
    {
        id: 13,
        question: 'O que é "daebak" em coreano?',
        options: ['Que pena!', 'Incrível / que sorte!', 'Obrigado', 'Com licença'],
        correct: 1,
        explanation: '"Daebak" (대박) é uma expressão popular que significa algo incrível, impressionante ou uma grande sorte. É muito usada em K-Dramas e pelo fandom.',
        category: 'cultura',
    },
    {
        id: 14,
        question: 'Qual grupo feminino ficou famoso pelo hit "Ddu-Du Ddu-Du"?',
        options: ['TWICE', 'Red Velvet', 'BLACKPINK', 'aespa'],
        correct: 2,
        explanation: '"Ddu-Du Ddu-Du" do BLACKPINK foi lançado em 2018 e se tornou um dos MVs de K-Pop feminino mais vistos de todos os tempos no YouTube.',
        category: 'k-pop',
    },
    {
        id: 15,
        question: 'Qual drama coreano aborda o tema de estudantes num jogo mortal por dinheiro?',
        options: ['Alice', 'Sweet Home', 'Squid Game', 'Dark Hole'],
        correct: 2,
        explanation: 'Squid Game (오징어 게임) retrata personagens endividados competindo em jogos infantis com consequências letais. Lançado em 2021, tornou-se fenômeno global.',
        category: 'k-drama',
    },
    {
        id: 16,
        question: 'Qual é a capital da Coreia do Sul, cenário de grande parte dos K-Dramas?',
        options: ['Busan', 'Incheon', 'Seul', 'Daegu'],
        correct: 2,
        explanation: 'Seul (서울) é a capital e maior cidade da Coreia do Sul, com cerca de 10 milhões de habitantes. É o centro cultural e econômico do país.',
        category: 'cultura',
    },
    {
        id: 17,
        question: 'Qual empresa gerencia o grupo BTS?',
        options: ['SM Entertainment', 'YG Entertainment', 'JYP Entertainment', 'HYBE'],
        correct: 3,
        explanation: 'O BTS é gerenciado pela HYBE (anteriormente Big Hit Entertainment). A empresa foi fundada por Bang Si-hyuk e abriu capital na bolsa sul-coreana em 2020.',
        category: 'k-pop',
    },
    {
        id: 18,
        question: 'O que é "mukbang"?',
        options: ['Dança coreana tradicional', 'Transmissão ao vivo comendo grandes quantidades de comida', 'Estilo de maquiagem', 'Tipo de música folclórica'],
        correct: 1,
        explanation: '"Mukbang" (먹방) combina os termos coreanos para "comer" e "transmissão". É um formato de conteúdo onde o criador come grandes quantidades de comida ao vivo.',
        category: 'cultura',
    },
    {
        id: 19,
        question: 'Qual ator sul-coreano protagonizou o filme "Parasita", vencedor do Oscar 2020?',
        options: ['Lee Byung-hun', 'Song Kang-ho', 'Choi Min-sik', 'Ha Jung-woo'],
        correct: 1,
        explanation: 'Song Kang-ho é o protagonista de "Parasita" (기생충), dirigido por Bong Joon-ho. O filme ganhou o Oscar de Melhor Filme em 2020, sendo o primeiro filme não anglófono a vencer.',
        category: 'história',
    },
    {
        id: 20,
        question: 'Qual grupo é conhecido pelo conceito "School Trilogy" em seus primeiros álbuns?',
        options: ['SHINee', 'BTS', 'INFINITE', 'B.A.P'],
        correct: 1,
        explanation: 'O BTS iniciou sua carreira com a "School Trilogy" (2013-2014): "2 Cool 4 Skool", "O!RUL8,2?" e "Skool Luv Affair", abordando temas de juventude e pressão escolar.',
        category: 'k-pop',
    },
    {
        id: 21,
        question: 'Qual grupo feminino tem como fandom o nome "BLINK"?',
        options: ['TWICE', 'BLACKPINK', 'Red Velvet', 'aespa'],
        correct: 1,
        explanation: 'O fandom oficial do BLACKPINK se chama BLINK, combinando as palavras "black" e "pink", as cores do grupo.',
        category: 'k-pop',
    },
    {
        id: 22,
        question: 'Em qual drama Lee Min-ho interpretou um herdeiro rico chamado Gu Jun-pyo?',
        options: ['The King: Eternal Monarch', 'Boys Over Flowers', 'Legend of the Blue Sea', 'City Hunter'],
        correct: 1,
        explanation: '"Boys Over Flowers" (꽃보다 남자, 2009) foi o drama que tornou Lee Min-ho famoso internacionalmente. A série foi baseada no mangá japonês "Hana Yori Dango".',
        category: 'k-drama',
    },
    {
        id: 23,
        question: 'Qual artista é conhecida como "Rainha do K-Pop Solo" e também atua em dramas?',
        options: ['Suzy', 'IU', 'Taeyeon', 'Jisoo'],
        correct: 1,
        explanation: 'IU (이지은) é considerada uma das artistas mais completas da Coreia, com sucessos musicais como "LILAC" e "Celebrity", além de protagonizar dramas como "My Mister" e "Hotel Del Luna".',
        category: 'k-pop',
    },
    {
        id: 24,
        question: 'Quantos membros compõem o grupo SEVENTEEN?',
        options: ['12', '13', '17', '9'],
        correct: 1,
        explanation: 'O SEVENTEEN tem 13 membros divididos em três unidades: Hip-Hop (4), Vocal (4) e Performance (5). O nome "17" vem de 13 membros + 3 unidades + 1 equipe.',
        category: 'k-pop',
    },
    {
        id: 25,
        question: 'Em "My Love from the Star", de qual planeta vem o personagem Do Min-joon?',
        options: ['Marte', 'KMT 184.05', 'Andrômeda', 'Nibiru'],
        correct: 1,
        explanation: 'Do Min-joon veio do planeta KMT 184.05, chegando à Terra em 1609. O drama estrelou Kim Soo-hyun e Jun Ji-hyun e foi um fenômeno na Ásia.',
        category: 'k-drama',
    },
    {
        id: 26,
        question: 'Qual é o nome do estilo de música tradicional coreana que influenciou o K-Pop?',
        options: ['Pansori', 'Trot', 'Gagok', 'Minyo'],
        correct: 1,
        explanation: 'O Trot (트로트) é o gênero musical popular mais antigo da Coreia, com influências da música folclórica japonesa. Experimentou um grande revival nos anos 2020.',
        category: 'história',
    },
    {
        id: 27,
        question: 'Qual grupo lançou o álbum "Repackage: The War"?',
        options: ['BTS', 'GOT7', 'EXO', 'MONSTA X'],
        correct: 2,
        explanation: 'O EXO lançou "The War" em 2017, um dos álbuns mais vendidos daquele ano na Coreia. A faixa principal "Ko Ko Bop" foi um grande sucesso.',
        category: 'k-pop',
    },
    {
        id: 28,
        question: 'Em qual plataforma de streaming estreou "Squid Game"?',
        options: ['Disney+', 'HBO Max', 'Netflix', 'Apple TV+'],
        correct: 2,
        explanation: '"Squid Game" estreou na Netflix em setembro de 2021 e rapidamente se tornou a série mais assistida da plataforma, superando "Bridgerton" em poucos dias.',
        category: 'k-drama',
    },
    {
        id: 29,
        question: 'Qual duo feminino lançou o hit "Gee" em 2009?',
        options: ['2NE1', 'KARA', 'Girls\' Generation (SNSD)', 'Wonder Girls'],
        correct: 2,
        explanation: '"Gee" do Girls\' Generation (소녀시대) ficou 9 semanas no topo das paradas sul-coreanas em 2009, um recorde na época. O grupo tem 9 membros.',
        category: 'k-pop',
    },
    {
        id: 30,
        question: 'O que é o "Idol trainee system" no K-Pop?',
        options: ['Sistema de avaliação de fãs', 'Sistema de treinamento intensivo de futuros artistas', 'Programa de bolsas universitárias', 'Contrato de distribuição musical'],
        correct: 1,
        explanation: 'O sistema de trainee é onde jovens selecionados por agências passam anos treinando canto, dança, idiomas e atuação antes de debutar como ídolos.',
        category: 'cultura',
    },
    {
        id: 31,
        question: 'Qual ator sul-coreano protagonizou "Goblin" e "Train to Busan"?',
        options: ['Lee Min-ho', 'Park Seo-joon', 'Gong Yoo', 'Ji Chang-wook'],
        correct: 2,
        explanation: 'Gong Yoo estrelou "Goblin" (2016) como o imortal Kim Shin e "Train to Busan" (2016) como o pai que tenta salvar a filha no apocalipse zumbi.',
        category: 'k-drama',
    },
    {
        id: 32,
        question: 'Qual cidade da Coreia do Sul é famosa pela sua cultura pop e pelo bairro Hongdae?',
        options: ['Busan', 'Seul', 'Incheon', 'Daejeon'],
        correct: 1,
        explanation: 'Seul abriga Hongdae, bairro ao redor da Universidade Hongik, famoso pela vida noturna, arte de rua, lojas de K-Pop e eventos culturais.',
        category: 'cultura',
    },
    {
        id: 33,
        question: 'Qual grupo de K-Pop foi o primeiro a se apresentar no Grammy Awards?',
        options: ['EXO', 'BIGBANG', 'BTS', 'SHINee'],
        correct: 2,
        explanation: 'O BTS se apresentou no Grammy Awards em 2021 (cerimônia referente a 2020), tornando-se o primeiro grupo sul-coreano a se apresentar no evento.',
        category: 'história',
    },
    {
        id: 34,
        question: 'Em "Queen of Tears", quem interpreta o protagonista Baek Hyun-woo?',
        options: ['Lee Min-ho', 'Kim Soo-hyun', 'Park Bo-gum', 'Song Joong-ki'],
        correct: 1,
        explanation: 'Kim Soo-hyun interpretou Baek Hyun-woo em "Queen of Tears" (2024), drama que quebrou recordes de audiência no tvN.',
        category: 'k-drama',
    },
    {
        id: 35,
        question: 'Qual é o nome do processo de fãs comprarem álbuns em massa para aumentar as vendas?',
        options: ['Sajaegi', 'Melon Chart', 'Mubank', 'Daesang'],
        correct: 0,
        explanation: '"Sajaegi" (사재기) é a prática ilegal de comprar álbuns ou streamings em massa para manipular charts. Já gerou diversos escândalos no K-Pop.',
        category: 'cultura',
    },
    {
        id: 36,
        question: 'Qual foi o primeiro grupo de K-Pop a atingir 1 bilhão de views no YouTube?',
        options: ['BTS', 'BIGBANG', 'PSY', 'Girls\' Generation'],
        correct: 2,
        explanation: 'PSY foi o primeiro artista sul-coreano a atingir 1 bilhão de views com "Gangnam Style" em 2012. Foi também o primeiro vídeo de qualquer artista a alcançar essa marca.',
        category: 'história',
    },
    {
        id: 37,
        question: 'Qual drama coreano é baseado no webtoon "Yaongyi"?',
        options: ['True Beauty', 'Itaewon Class', 'Extraordinary Attorney Woo', 'Weightlifting Fairy'],
        correct: 0,
        explanation: '"True Beauty" (여신강림, 2020) é baseado no webtoon de mesmo nome de Yaongyi. A série estrelou Moon Ga-young e Cha Eun-woo do ASTRO.',
        category: 'k-drama',
    },
    {
        id: 38,
        question: 'Qual é o significado de "oppa" quando usado por uma mulher?',
        options: ['Irmão mais novo', 'Irmão mais velho / homem mais velho próximo', 'Amigo', 'Namorado'],
        correct: 1,
        explanation: '"Oppa" (오빠) é usado por mulheres para se referir a um homem mais velho com quem têm proximidade. Pode ser um irmão mais velho, amigo ou interesse amoroso.',
        category: 'cultura',
    },
    {
        id: 39,
        question: 'Qual grupo de 4ª geração é conhecido pelo conceito "Fearless"?',
        options: ['aespa', 'ITZY', 'LE SSERAFIM', 'NewJeans'],
        correct: 2,
        explanation: 'LE SSERAFIM debutou em 2022 com o single "FEARLESS", com o conceito de ser corajosa e não ter medo do julgamento. O nome do grupo vem de um anagrama de "I\'M FEARLESS".',
        category: 'k-pop',
    },
    {
        id: 40,
        question: 'Qual ator interpretou o vilão Oh Yeong-su em "Squid Game"?',
        options: ['Lee Byung-hun', 'Wi Ha-joon', 'Oh Yeong-su', 'Park Hae-soo'],
        correct: 2,
        explanation: 'Oh Yeong-su interpretou o Jogador 001 (Oh Il-nam) em "Squid Game". Ele ganhou o Globo de Ouro de Melhor Ator Coadjuvante em 2022, sendo o primeiro sul-coreano a vencer a categoria.',
        category: 'k-drama',
    },
    {
        id: 41,
        question: 'Qual grupo de K-Pop foi formado pelo reality show "Produce 101"?',
        options: ['IOI', 'WANNA ONE', 'IZ*ONE', 'Todas as anteriores'],
        correct: 3,
        explanation: 'Os três grupos foram formados pela franquia Produce 101: IOI (feminino, 2016), WANNA ONE (masculino, 2017) e IZ*ONE (feminino, 2018). Todos foram grupos-projeto temporários.',
        category: 'k-pop',
    },
    {
        id: 42,
        question: 'O que é "Daesang" no K-Pop?',
        options: ['Um tipo de dança', 'O prêmio mais prestigioso das cerimônias musicais', 'Um festival de música', 'Uma gravadora independente'],
        correct: 1,
        explanation: '"Daesang" (대상) significa "Grande Prêmio" em coreano. É o prêmio máximo nas cerimônias de música como Melon Music Awards, Mnet Asian Music Awards e Golden Disc Awards.',
        category: 'cultura',
    },
    {
        id: 43,
        question: 'Qual ator de "Itaewon Class" também protagonizou "Midnight Runner"?',
        options: ['Lee Je-hoon', 'Park Seo-joon', 'Yoo Ah-in', 'Nam Joo-hyuk'],
        correct: 1,
        explanation: 'Park Seo-joon protagonizou "Midnight Runner" (2017) e "Itaewon Class" (2020), tornando-se um dos atores mais populares de sua geração.',
        category: 'k-drama',
    },
    {
        id: 44,
        question: 'Em que país nasceu a integrante do BLACKPINK Lisa?',
        options: ['Coreia do Sul', 'Japão', 'Tailândia', 'China'],
        correct: 2,
        explanation: 'Lisa (Lalisa Manobal) nasceu na Tailândia em 1997. Ela é a única membro estrangeira do BLACKPINK e a mais seguida individualmente nas redes sociais.',
        category: 'k-pop',
    },
    {
        id: 45,
        question: 'Qual é o nome do prêmio anual mais importante do cinema coreano?',
        options: ['Blue Dragon Film Awards', 'Baeksang Arts Awards', 'Grand Bell Awards', 'Wildflower Film Awards'],
        correct: 1,
        explanation: 'O Baeksang Arts Awards (백상예술대상) é considerado o prêmio mais prestigi oso das artes coreanas, cobrindo cinema, TV e teatro desde 1965.',
        category: 'história',
    },
    {
        id: 46,
        question: 'Qual K-Drama de 2022 sobre uma advogada com autismo fez sucesso global?',
        options: ['Business Proposal', 'Extraordinary Attorney Woo', 'Our Blues', 'Twenty-Five Twenty-One'],
        correct: 1,
        explanation: '"Extraordinary Attorney Woo" (이상한 변호사 우영우, 2022) estrelou Park Eun-bin como Woo Young-woo, advogada com autismo. O drama estreou no Top 10 da Netflix em mais de 50 países.',
        category: 'k-drama',
    },
    {
        id: 47,
        question: 'Qual integrante do BTS é conhecido por sua habilidade de composição e rap?',
        options: ['Jin', 'Jungkook', 'RM', 'V'],
        correct: 2,
        explanation: 'RM (Kim Namjoon) é o líder e principal compositor do BTS. Ele também fala inglês fluentemente e foi o porta-voz do grupo em discursos na ONU.',
        category: 'k-pop',
    },
    {
        id: 48,
        question: 'Qual é o prato coreano feito de repolho fermentado com pimenta?',
        options: ['Bibimbap', 'Kimchi', 'Japchae', 'Tteokbokki'],
        correct: 1,
        explanation: 'Kimchi (김치) é o prato mais icônico da culinária coreana: vegetais fermentados, principalmente repolho napa, temperados com pasta de pimenta, alho e gengibre.',
        category: 'cultura',
    },
    {
        id: 49,
        question: 'Qual grupo de K-Pop é formado pelas unidades "Dream", "127" e "WayV"?',
        options: ['EXO', 'SUPER JUNIOR', 'NCT', 'BIGBANG'],
        correct: 2,
        explanation: 'O NCT (Neo Culture Technology) é um grupo sem limite de membros da SM Entertainment, dividido em subunidades: NCT U, NCT 127, NCT Dream, WayV e mais recentemente NCT Wish.',
        category: 'k-pop',
    },
    {
        id: 50,
        question: 'Qual drama coreano mostra a vida de estudantes preparando-se para o vestibular (Suneung)?',
        options: ['Sky Castle', 'Reply 1988', 'School 2015', 'Weightlifting Fairy'],
        correct: 0,
        explanation: '"SKY Castle" (SKY 캐슬, 2018-2019) retrata pais obcecados em fazer os filhos entrarem nas melhores universidades da Coreia, satirizando a pressão extrema da educação coreana.',
        category: 'k-drama',
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

function getResult(score: number, total: number) {
    const pct = score / total
    if (pct === 1) return { title: 'Expert Hallyu! 🏆', desc: 'Você é um verdadeiro especialista! Seu conhecimento sobre a cultura coreana é impressionante.', color: 'text-amber-400' }
    if (pct >= 0.8) return { title: 'Fã dedicado! ⭐', desc: 'Muito bem! Você conhece K-Pop e K-Drama de verdade. Só faltou um pouquinho para a perfeição.', color: 'text-accent' }
    if (pct >= 0.6) return { title: 'Bom conhecimento! 👏', desc: 'Você sabe bastante sobre o universo Hallyu! Continue explorando o site para aprender mais.', color: 'text-blue-400' }
    if (pct >= 0.4) return { title: 'Ainda aprendendo! 📚', desc: 'Você está no caminho certo! Explore mais artigos no HallyuHub para aprofundar seu conhecimento.', color: 'text-purple-400' }
    return { title: 'Iniciante Hallyu! 🌱', desc: 'Todo mundo começa de algum lugar! Explore nosso site para descobrir o universo do K-Pop e K-Drama.', color: 'text-muted' }
}

export function QuizClient() {
    const [questions, setQuestions] = useState<Question[]>(() => shuffle(ALL_QUESTIONS).slice(0, QUIZ_SIZE))
    const [current, setCurrent] = useState(0)
    const [selected, setSelected] = useState<number | null>(null)
    const [answers, setAnswers] = useState<(number | null)[]>(Array(QUIZ_SIZE).fill(null))
    const [finished, setFinished] = useState(false)
    const [showExplanation, setShowExplanation] = useState(false)
    const [animating, setAnimating] = useState(false)

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

    const handleSelect = useCallback((idx: number) => {
        if (selected !== null) return
        setSelected(idx)
        setShowExplanation(true)
        const newAnswers = [...answers]
        newAnswers[current] = idx
        setAnswers(newAnswers)
    }, [selected, answers, current])

    const handleNext = useCallback(() => {
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
    }, [current, questions.length])

    const handleReset = useCallback(() => {
        setQuestions(shuffle(ALL_QUESTIONS).slice(0, QUIZ_SIZE))
        setCurrent(0)
        setSelected(null)
        setAnswers(Array(QUIZ_SIZE).fill(null))
        setFinished(false)
        setShowExplanation(false)
    }, [])

    const shareText = `Fiz o quiz do HallyuHub e acertei ${score} de ${questions.length} perguntas sobre K-Pop e K-Drama! 🎵 Tente você também:`
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://www.hallyuhub.com.br/quiz'

    if (finished) {
        const result = getResult(score, questions.length)
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
                <div className="max-w-md w-full text-center">
                    <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <Trophy className="w-10 h-10 text-accent" />
                    </div>
                    <h1 className={`text-3xl font-black mb-2 ${result.color}`}>{result.title}</h1>
                    <div className="text-6xl font-black text-foreground mb-2">
                        {score}<span className="text-2xl text-muted font-normal">/{questions.length}</span>
                    </div>
                    <p className="text-muted text-sm mb-8 leading-relaxed">{result.desc}</p>

                    {/* Score por categoria */}
                    <div className="bg-surface border border-border rounded-2xl p-4 mb-4 text-left">
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
                                    <span className="text-xs font-bold text-foreground w-10 text-right">{correct}/{total}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Resumo por questão */}
                    <div className="bg-surface border border-border rounded-2xl p-4 mb-6 text-left">
                        <p className="text-xs font-black uppercase tracking-widest text-muted mb-3">Resumo</p>
                        <div className="space-y-1.5">
                            {questions.map((qu, i) => (
                                <div key={qu.id} className="flex items-center gap-2">
                                    {answers[i] === qu.correct
                                        ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                        : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                                    <span className="text-xs text-foreground truncate">{qu.question.slice(0, 55)}…</span>
                                </div>
                            ))}
                        </div>
                    </div>

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
                            Jogar novamente (perguntas novas)
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
        )
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
            <div className={`max-w-xl w-full transition-opacity duration-200 ${animating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}
                style={{ transition: 'opacity 0.2s, transform 0.2s' }}>
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-3">
                        <Trophy className="w-3.5 h-3.5 text-accent" />
                        <span className="text-xs font-black text-accent uppercase tracking-wider">Quiz Hallyu</span>
                    </div>
                    <h1 className="text-2xl font-black text-foreground mb-1">Teste seus conhecimentos</h1>
                    <p className="text-muted text-sm">K-Pop, K-Drama e cultura coreana</p>
                </div>

                {/* Progress */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-muted font-semibold">Pergunta {current + 1} de {questions.length}</span>
                        <span className="text-xs text-accent font-bold">{score} acerto{score !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div
                            className="h-full bg-accent rounded-full transition-all duration-500"
                            style={{ width: `${(current / questions.length) * 100}%` }}
                        />
                    </div>
                    <div className="flex gap-1 mt-2">
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
                <div className="bg-surface border border-border rounded-2xl p-6 mb-4">
                    <div className="flex items-center gap-2 mb-4">
                        <span className={`text-[10px] font-black uppercase tracking-wider border rounded-full px-2.5 py-1 ${CATEGORY_COLORS[q.category]}`}>
                            {CATEGORY_LABELS[q.category]}
                        </span>
                    </div>
                    <p className="text-base font-bold text-foreground leading-snug mb-6">{q.question}</p>

                    <div className="space-y-2.5">
                        {q.options.map((opt, idx) => {
                            let cls = 'border-border bg-background text-foreground hover:border-accent/40 hover:bg-accent/5'
                            if (selected !== null) {
                                if (idx === q.correct) cls = 'border-green-500/50 bg-green-500/10 text-green-400'
                                else if (idx === selected) cls = 'border-red-500/50 bg-red-500/10 text-red-400'
                                else cls = 'border-border bg-background text-muted opacity-40'
                            }
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelect(idx)}
                                    disabled={selected !== null}
                                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3 ${cls} ${selected === null ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
                                >
                                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[11px] font-black flex-shrink-0">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    {opt}
                                    {selected !== null && idx === q.correct && <CheckCircle2 className="w-4 h-4 ml-auto flex-shrink-0" />}
                                    {selected !== null && idx === selected && idx !== q.correct && <XCircle className="w-4 h-4 ml-auto flex-shrink-0" />}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Explanation */}
                {showExplanation && (
                    <div className={`rounded-xl border p-4 mb-4 text-sm leading-relaxed transition-all duration-300 ${selected === q.correct ? 'border-green-500/30 bg-green-500/5 text-green-300' : 'border-red-500/30 bg-red-500/5 text-red-300'}`}>
                        <p className="font-bold mb-1">{selected === q.correct ? '✓ Correto!' : '✗ Incorreto'}</p>
                        <p className="text-xs opacity-90">{q.explanation}</p>
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
