// Real-feel blog data based on HallyuHub posts.
window.POSTS = [
  // K-Drama
  { cat: "K-Drama", format: "Análise", title: "Queen of Tears: por que o drama quebrou todos os recordes", dek: "O drama sobre um casal prestes a se divorciar se tornou o k-drama mais assistido da Netflix em 2024.", author: "Redação", date: "27 mar 2026", read: "12 min", featured: true, hot: true },
  { cat: "K-Drama", format: "Perfil", title: "Park Bo-young: A Rainha Eterna do K-Drama Romântico", dek: "De Scandal Makers a Light Shop, Park Bo-young conquistou o coração do público com talento e carisma.", author: "Ana Tanaka", date: "26 mar 2026", read: "9 min" },
  { cat: "K-Drama", format: "Análise", title: "Squid Game e o que mudou no mundo com dois botões", dek: "Squid Game não foi só uma série. Foi o momento em que o mundo parou de tratar conteúdo coreano como nicho.", author: "Redação", date: "10 mar 2026", read: "11 min" },
  { cat: "K-Drama", format: "Review", title: "Quando o Telefone Toca: guia sem spoilers", dek: "Um drama do SBS que está dando o que falar — e nosso veredito sobre se vale o tempo.", author: "Lucas R.", date: "06 mai 2026", read: "6 min" },
  { cat: "K-Drama", format: "Notícia", title: "Lee Yu Bi e a rotina extrema antes de ensaio em Tóquio", dek: "A atriz revelou rotina rigorosa: jejum, suplementos e atenção constante ao corpo.", author: "Redação", date: "18 mai 2026", read: "4 min", hot: true },
  { cat: "K-Drama", format: "Lista", title: "9 protagonistas de K-Drama que combinam com qualquer par", dek: "Os atores que conseguem química com qualquer co-star — e por quê.", author: "Carla M.", date: "12 mai 2026", read: "8 min" },
  { cat: "K-Drama", format: "Notícia", title: "Arquivando o Amor: o novo K-drama do tvN que virou febre", dek: "Estreia surpresa do tvN dispara nas paradas e divide os fandoms.", author: "Redação", date: "08 mai 2026", read: "5 min" },

  // K-Pop
  { cat: "K-Pop", format: "Notícia", title: "'APT.' de Rosé e Bruno Mars bate 2,4 bilhões no YouTube", dek: "A colaboração quebra novo recorde global no plataforma e reacende discussão sobre o teto de carreira.", author: "Redação", date: "19 mai 2026", read: "4 min", hot: true },
  { cat: "K-Pop", format: "Perfil", title: "Jennie: A Rainha do K-Pop que Conquistou o Mundo", dek: "De Seoul à Nova Zelândia e de volta ao topo: a trajetória de Kim Jennie, multifacetada por escolha.", author: "Ana Tanaka", date: "25 mar 2026", read: "9 min", featured: true },
  { cat: "K-Pop", format: "Notícia", title: "Ranking KBRI: BTS domina abril com salto de 90,72%", dek: "Mesmo em pausa, o grupo segue dominando o ranking de reputação de marca da Coreia.", author: "Redação", date: "02 mai 2026", read: "3 min" },
  { cat: "K-Pop", format: "Perfil", title: "NewJeans: Do debut ao estrelato global", dek: "Como o NewJeans quebrou recordes em tempo recorde e o que esperar dos próximos passos.", author: "Redação", date: "25 mar 2026", read: "8 min" },
  { cat: "K-Pop", format: "Notícia", title: "G-Dragon usa camisa com slur racial em Macau e pede desculpas", dek: "O ídolo de 2ª geração se manifestou após reação de fãs no Twitter.", author: "Redação", date: "15 mai 2026", read: "3 min" },
  { cat: "K-Pop", format: "Análise", title: "O que é a quarta geração do K-Pop e por que domina agora", dek: "Cinco anos depois do BTS abrir o mercado global, a Gen-4 está redefinindo o que significa ser idol.", author: "Lucas R.", date: "20 abr 2026", read: "10 min" },

  // Artistas
  { cat: "Artistas", format: "Perfil", title: "Kim Soo-hyun: De Dream High à Rainha das Lágrimas", dek: "De Dream High ao recorde histórico de cachê em Queen of Tears, ele redefiniu o que significa ser ator pago do K-drama.", author: "Redação", date: "27 mar 2026", read: "14 min", featured: true },
  { cat: "Artistas", format: "Perfil", title: "Lee Jong-suk: do desfile em Milão ao Big Mouth", dek: "Modelo aos 20, ator revelação aos 23, ícone do k-drama. A carreira que não seguiu nenhum roteiro convencional.", author: "Ana Tanaka", date: "20 mar 2026", read: "12 min" },
  { cat: "Artistas", format: "Perfil", title: "Gong Yoo: do café ao apocalipse zumbi", dek: "De Coffee Prince a Train to Busan, o ator que recusou ser galã e virou âncora do cinema coreano.", author: "Carla M.", date: "15 mar 2026", read: "11 min" },
  { cat: "Artistas", format: "Perfil", title: "Jinyoung: do GOT7 ao Baeksang como ator", dek: "Quando o GOT7 saiu da JYP em 2021, Jinyoung ficou. E trocou o palco pela tela com um Baeksang no bolso.", author: "Redação", date: "10 mar 2026", read: "9 min" },
  { cat: "Artistas", format: "Perfil", title: "IU: cantora, atriz e compositora coreana", dek: "Como Lee Ji-eun construiu a carreira solo mais bem-sucedida da Coreia moderna.", author: "Ana Tanaka", date: "05 mar 2026", read: "10 min" },

  // Cultura
  { cat: "Cultura", format: "Guia", title: "Oppa, unnie, hyung, noona: o guia dos termos coreanos", dek: "O que significam, quando usar e por que são centrais no k-drama e no k-pop.", author: "Lucas R.", date: "15 abr 2026", read: "7 min", featured: true },
  { cat: "Cultura", format: "Análise", title: "Como o K-Pop conquistou o Brasil — história e números", dek: "O Brasil é o maior mercado de K-Pop fora da Ásia. Como isso aconteceu — e o que os números revelam.", author: "Redação", date: "10 abr 2026", read: "13 min" },
  { cat: "Cultura", format: "Guia", title: "Hangeul em 30 minutos: guia básico para fãs brasileiros", dek: "O alfabeto coreano tem 24 letras e foi criado por decreto real — aqui está como ler.", author: "Carla M.", date: "20 mar 2026", read: "8 min" },
  { cat: "Cultura", format: "Análise", title: "SM, HYBE, YG e JYP: como as Big Four do K-Pop funcionam", dek: "Os quatro conglomerados que ditam o ritmo do mercado coreano — explicados.", author: "Lucas R.", date: "08 abr 2026", read: "11 min" },
  { cat: "Cultura", format: "Guia", title: "Chuseok, Seollal e as festas tradicionais coreanas", dek: "As duas maiores festas da Coreia do Sul paralisam o país por dias e revelam muito sobre cultura e valores.", author: "Ana Tanaka", date: "28 fev 2026", read: "6 min" },

  // K-Beauty
  { cat: "K-Beauty", format: "Guia", title: "Skincare coreana: o guia da rotina de 10 passos", dek: "A rotina que conquistou o mundo, explicada passo a passo — incluindo o que pular se você for iniciante.", author: "Carla M.", date: "12 mai 2026", read: "9 min" },
  { cat: "K-Beauty", format: "Análise", title: "Glass skin, honey skin, cloudless skin: o que cada tendência significa", dek: "Três estéticas, três rotinas, três objetivos. A briga interna do K-Beauty pelo padrão de pele.", author: "Redação", date: "10 mai 2026", read: "7 min" },
  { cat: "K-Beauty", format: "Análise", title: "Sunscreen coreano: por que o mundo trocou o protetor solar", dek: "Texturas leves, FPS alto e filtros que não existem no Brasil — o que faz dele tão superior.", author: "Carla M.", date: "09 mai 2026", read: "6 min" },

  // Webtoons
  { cat: "Webtoons", format: "Guia", title: "Como ler webtoons em português — guia para iniciantes", dek: "As plataformas, os títulos essenciais e como começar sem se perder.", author: "Lucas R.", date: "25 abr 2026", read: "8 min" },
  { cat: "Webtoons", format: "Lista", title: "Webtoons que viraram K-Dramas — lista completa com onde assistir", dek: "Da fonte direta para a tela — 32 dramas adaptados e onde encontrar cada um.", author: "Redação", date: "20 abr 2026", read: "12 min" },
  { cat: "Webtoons", format: "Análise", title: "Do webtoon para o K-Drama: como funciona o pipeline criativo", dek: "Por que tantos dramas dos últimos anos saíram do papel digital — e o que isso muda na produção.", author: "Ana Tanaka", date: "15 abr 2026", read: "10 min" },

  // Grupos
  { cat: "Grupos", format: "Perfil", title: "SHINee: legado, perda e por que ainda importam", dek: "Quase 20 anos, cinco membros, um luto que mudou a indústria. Por que SHINee segue referência.", author: "Lucas R.", date: "02 mai 2026", read: "13 min" },
  { cat: "Grupos", format: "Perfil", title: "Girls' Generation: a trajetória das rainhas do K-pop da SM", dek: "Como nove garotas construíram o blueprint que toda menina do k-pop seguiu pelos 15 anos seguintes.", author: "Ana Tanaka", date: "28 abr 2026", read: "14 min" },
  { cat: "Grupos", format: "Análise", title: "TWICE: Trajetória, Discografia e Dez Anos de K-pop (2015–2025)", dek: "Uma década do TWICE — singles, evolução vocal, transição global.", author: "Redação", date: "20 abr 2026", read: "16 min" },
];

window.BLOG_STATS = {
  total: 847,
  categories: [
    { name: "K-Drama", count: 287, color: "#ee2244" },
    { name: "K-Pop", count: 198, color: "#0a0a0a" },
    { name: "Artistas", count: 156, color: "#ee2244" },
    { name: "Cultura", count: 89, color: "#0a0a0a" },
    { name: "K-Beauty", count: 47, color: "#ee2244" },
    { name: "Webtoons", count: 38, color: "#0a0a0a" },
    { name: "Grupos", count: 32, color: "#ee2244" },
  ],
  formats: [
    { name: "Perfil", count: 124 }, { name: "Análise", count: 187 },
    { name: "Notícia", count: 312 }, { name: "Lista", count: 89 },
    { name: "Guia", count: 76 }, { name: "Review", count: 59 },
  ],
};
