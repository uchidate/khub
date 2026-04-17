/**
 * Script: Cria posts de amostra no blog (privados)
 *
 * Posts são publicados mas invisíveis no blog público (isPrivate=true).
 * Acessíveis em /blog/preview/[slug] para admins.
 *
 * Uso:
 *   npx tsx scripts/seed-blog-samples.ts
 */

import prisma from '../lib/prisma'

async function main() {
  // Pegar o primeiro admin
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
    select: { id: true, name: true },
  })
  if (!admin) {
    console.error('Nenhum usuário ADMIN encontrado. Abortar.')
    process.exit(1)
  }
  console.log(`Usando autor: ${admin.name} (${admin.id})`)

  // Criar categorias se não existirem
  const categoryMap: Record<string, string> = {}
  for (const { name, slug } of [
    { name: 'K-pop', slug: 'k-pop' },
    { name: 'K-drama', slug: 'k-drama' },
    { name: 'Análise', slug: 'analise' },
    { name: 'Ranking', slug: 'ranking' },
  ]) {
    const cat = await prisma.blogCategory.upsert({
      where: { slug },
      create: { name, slug },
      update: {},
      select: { id: true },
    })
    categoryMap[slug] = cat.id
  }

  const posts = [
    // ────────────────────────────────────────────────────────────────────────
    // 1. IDOL BIO — BTS
    // ────────────────────────────────────────────────────────────────────────
    {
      slug: 'bts-trajetoria-10-anos-kpop',
      title: 'BTS: A Trajetória de 10 Anos Que Mudou o K-pop Para Sempre',
      excerpt: 'De um grupo debutante de uma pequena agência a um fenômeno global com recordes no Billboard e apresentações no UN General Assembly — a história do BTS é uma das mais extraordinárias da música contemporânea.',
      categoryId: categoryMap['k-pop'],
      tags: ['BTS', 'HYBE', 'K-pop', 'Billboard', 'ARMY'],
      template: 'idol_bio',
      readingTimeMin: 8,
      blocks: [
        { type: 'blog_heading', level: 2, text: 'Do Início Improvável ao Topo Mundial' },
        { type: 'blog_paragraph', text: 'Em 13 de junho de 2013, sete jovens subiram ao palco pela primeira vez sob o nome BTS (Bangtan Sonyeondan). Ninguém poderia prever que aquele grupo de uma agência pequena, a Big Hit Entertainment, viria a se tornar o grupo musical mais influente do século XXI.' },
        { type: 'blog_paragraph', text: 'RM, Jin, Suga, J-Hope, Jimin, V e Jungkook cresceram juntos — artisticamente e pessoalmente — diante de milhões de fãs ao redor do mundo. Sua jornada é marcada por rejeições, recomeços e uma conexão única com o público que transcende barreiras de língua e cultura.' },
        { type: 'blog_quote', text: 'A música é a linguagem que fala diretamente ao coração, independente de onde você estiver.', author: 'RM, BTS' },
        { type: 'blog_heading', level: 2, text: 'Os Marcos Que Definiram Uma Geração' },
        { type: 'blog_stats_row', items: [
          { label: 'Debut', value: '13 de junho de 2013' },
          { label: 'Agência', value: 'HYBE (ex-Big Hit)' },
          { label: 'Integrantes', value: '7 (RM, Jin, Suga, J-Hope, Jimin, V, Jungkook)' },
          { label: 'Álbuns de estúdio', value: '9 (coreano + inglês)' },
          { label: '#1 no Billboard Hot 100', value: '6 músicas' },
          { label: 'Seguidores no Twitter/X', value: +50000000 + ' (conta oficial)' },
        ]},
        { type: 'blog_heading', level: 2, text: 'O Impacto Cultural Beyond Music' },
        { type: 'blog_paragraph', text: 'O BTS não é apenas um grupo musical — é um movimento cultural. Em 2021, os membros discursaram na 76ª Assembleia Geral das Nações Unidas, tornando-se Embaixadores Especiais Presidenciais da Coreia do Sul para as gerações jovens. Sua campanha "Love Myself" em parceria com a UNICEF angariou mais de 3 milhões de dólares para combater violência contra jovens.' },
        { type: 'blog_paragraph', text: 'O ARMY — a fanbase oficial do grupo — é reconhecida mundialmente por sua organização e impacto social. Quando o grupo fez uma doação de 1 milhão de dólares para o movimento Black Lives Matter, os fãs organizaram um esforço coletivo e doaram o mesmo valor em menos de 24 horas.' },
        { type: 'blog_heading', level: 2, text: 'A Era Solo e o Futuro do Grupo' },
        { type: 'blog_paragraph', text: 'Em 2022, o BTS anunciou uma pausa nas atividades como grupo enquanto os membros cumprem o serviço militar obrigatório da Coreia do Sul — um momento que emocionou fãs globalmente. Paralelamente, cada integrante lançou projetos solo que demonstram a versatilidade artística do grupo.' },
        { type: 'blog_paragraph', text: 'A reunião completa do grupo está prevista para 2025, e a expectativa da comunidade ARMY é imensa. Seja qual for o próximo capítulo, o legado do BTS já está gravado na história da música pop.' },
        { type: 'blog_rating', score: 9.8, label: 'Impacto Cultural', summary: 'O BTS redefiniu o que um grupo de K-pop pode alcançar, abrindo portas para toda uma geração de artistas coreanos no mercado internacional.' },
      ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // 2. REVIEW — Crash Landing on You
    // ────────────────────────────────────────────────────────────────────────
    {
      slug: 'crash-landing-on-you-review-drama-que-conquistou-mundo',
      title: 'Review: Crash Landing on You — O Drama Que Fez o Mundo Se Apaixonar pela Coreia',
      excerpt: 'Com uma premissa impossível — uma herdeira sul-coreana acidentalmente aterrissa na Coreia do Norte — "Crash Landing on You" se tornou o K-drama mais assistido da história da Netflix na época de seu lançamento. Mas por quê funciona tão bem?',
      categoryId: categoryMap['k-drama'],
      tags: ['Crash Landing on You', 'Hyun Bin', 'Son Ye-jin', 'Netflix', 'K-drama', 'Romance'],
      template: 'review',
      readingTimeMin: 6,
      blocks: [
        { type: 'blog_heading', level: 2, text: 'A Premissa Impossível Que Funciona' },
        { type: 'blog_paragraph', text: '"Crash Landing on You" (사랑의 불시착) estreou em 2019 na tvN e rapidamente virou febre global. Yoon Se-ri (Son Ye-jin), uma empresária e herdeira sul-coreana, perde o controle de seu parapente durante uma tempestade e aterra acidentalmente na Zona Desmilitarizada — do lado norte-coreano.' },
        { type: 'blog_paragraph', text: 'Lá, ela é encontrada pelo capitão Ri Jeong-hyeok (Hyun Bin), um oficial do exército norte-coreano que, por razões que só o drama pode explicar, decide protegê-la e ajudá-la a voltar para casa. O problema? Ele começa a se apaixonar por ela.' },
        { type: 'blog_quote', text: 'Você caiu do céu na minha vida. Que posso fazer senão te proteger?', author: 'Ri Jeong-hyeok, Crash Landing on You' },
        { type: 'blog_heading', level: 2, text: 'Por Que Funciona Tão Bem' },
        { type: 'blog_paragraph', text: 'O que diferencia CLOY de outros romances é a riqueza de contexto. O drama não usa a divisão das Coreias apenas como pano de fundo — ela é o coração da trama. A vida cotidiana da Coreia do Norte é retratada com um mix de humor e melancolia que raramente vemos na ficção.' },
        { type: 'blog_paragraph', text: 'A química entre Hyun Bin e Son Ye-jin é inegável — tanto que eles acabaram se casando na vida real em 2022. Mas além do romance, os personagens secundários roubam a cena: os soldados companheiros de Jeong-hyeok e as vizinhas fofoqueiras são alguns dos personagens mais adorados da história dos K-dramas.' },
        { type: 'blog_stats_row', items: [
          { label: 'Onde assistir', value: 'Netflix' },
          { label: 'Episódios', value: '16 (~1h10min cada)' },
          { label: 'Classificação indicativa', value: '12 anos' },
          { label: 'Gênero', value: 'Romance, Drama' },
          { label: 'Nota MyDramaList', value: '9.1/10' },
          { label: 'Elenco principal', value: 'Hyun Bin, Son Ye-jin' },
        ]},
        { type: 'blog_heading', level: 2, text: 'Pontos Altos e Baixos' },
        { type: 'blog_paragraph', text: 'O ritmo dos primeiros episódios é perfeito — não há um momento de tédio. Os episódios centrais ganham mais camadas dramáticas, e os dois últimos episódios entregam um final que deixou muitos fãs em prantos.' },
        { type: 'blog_paragraph', text: 'O único ponto fraco: a representação da Coreia do Norte, embora feita com cuidado, é inevitavelmente romantizada. Mas para os fins do drama — e do coração — funciona.' },
        { type: 'blog_rating', score: 9.2, label: 'Nota HallyuHub', summary: 'Um dos K-dramas mais completos já feitos. Perfeito para iniciantes no gênero e indispensável para fãs veteranos. Tenha lenços à mão.' },
      ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // 3. RANKING — Top K-dramas 2024
    // ────────────────────────────────────────────────────────────────────────
    {
      slug: 'top-10-kdramas-2024-melhores-do-ano',
      title: 'Top 10 K-dramas de 2024: Os Melhores da Temporada Segundo os Fãs',
      excerpt: 'De thrillers eletrizantes a romances que pararam o coração, 2024 foi um ano excepcional para os K-dramas. Listamos os 10 mais impactantes do ano com notas, sinopses e onde assistir.',
      categoryId: categoryMap['ranking'],
      tags: ['K-drama', 'Ranking', '2024', 'Netflix', 'Disney Plus', 'tvN'],
      template: 'ranking',
      readingTimeMin: 7,
      blocks: [
        { type: 'blog_paragraph', text: '2024 foi um ano extraordinário para os K-dramas. Com produções cada vez mais ambiciosas, narrativas inovadoras e elencos estelares, a indústria de doramas continuou dominando as conversas globais. Separamos os 10 títulos que mais impactaram fãs e críticos ao longo do ano.' },
        { type: 'blog_heading', level: 2, text: '#1 — Queen of Tears' },
        { type: 'blog_paragraph', text: 'Protagonizado por Kim Soo-hyun e Kim Ji-won, "Queen of Tears" dominou as audiências da tvN e se tornou o segundo drama mais assistido da história do canal. A história de um casal à beira do divórcio que precisa redescobrir o amor é contada com maestria — alterando drama pesado com humor delicioso.' },
        { type: 'blog_stats_row', items: [
          { label: 'Plataforma', value: 'Netflix / tvN' },
          { label: 'Episódios', value: '16' },
          { label: 'Nota', value: '9.4/10' },
        ]},
        { type: 'blog_heading', level: 2, text: '#2 — The Glory: Parte 2' },
        { type: 'blog_paragraph', text: 'A segunda parte da história de vingança protagonizada por Song Hye-kyo entregou tudo que os fãs esperavam. Com um final tenso e satisfatório, "The Glory" consolidou-se como um dos melhores thrillers psicológicos do K-drama moderno.' },
        { type: 'blog_heading', level: 2, text: '#3 — Doctor Slump' },
        { type: 'blog_paragraph', text: 'Park Hyung-sik e Park Shin-hye protagonizam essa história reconfortante sobre dois ex-prodígios que entram em colapso e se encontram no processo de reconstrução. Leve, engraçado e surpreendentemente profundo sobre saúde mental.' },
        { type: 'blog_heading', level: 2, text: '#4 — Lovely Runner' },
        { type: 'blog_paragraph', text: 'Uma das surpresas do ano. Com viagem no tempo e uma história de amor que transcende décadas, "Lovely Runner" conquistou um público massivo e lançou Byeon Woo-seok ao estrelato global — sua música "Sudden Shower" virou hit nas paradas.' },
        { type: 'blog_heading', level: 2, text: '#5 — Exhuma' },
        { type: 'blog_paragraph', text: 'Tecnicamente um filme, mas impossível não incluir. "Exhuma" (파묘) mistura folclore coreano, horror e thriller em uma narrativa que manteve o público na beira da cadeira. Maior bilheteria coreana de 2024.' },
        { type: 'blog_divider' },
        { type: 'blog_paragraph', text: 'A lista completa inclui ainda: "The Atypical Family", "Marry My Husband", "Hijack 1971", "Culinary Class Wars" e "When the Phone Rings" — todos disponíveis no Netflix ou Disney+. 2024 provou que o K-drama só está crescendo.' },
        { type: 'blog_rating', score: 9.5, label: 'Qualidade da temporada 2024', summary: 'Um dos melhores anos da história recente do K-drama, com diversidade de gêneros e produções de nível cinematográfico.' },
      ],
    },

    // ────────────────────────────────────────────────────────────────────────
    // 4. FREE — O que é o Hallyu
    // ────────────────────────────────────────────────────────────────────────
    {
      slug: 'o-que-e-hallyu-onda-coreana-explicada',
      title: 'O Que é o Hallyu? Entendendo a Onda Coreana Que Conquistou o Brasil',
      excerpt: 'K-pop, K-drama, K-beauty, K-food — o prefixo "K-" tomou conta das conversas. Mas o que exatamente é o Hallyu, como ele surgiu e por que o Brasil é um dos países com maior engajamento do mundo?',
      categoryId: categoryMap['analise'],
      tags: ['Hallyu', 'Cultura Coreana', 'K-pop', 'K-drama', 'Brasil', 'Soft Power'],
      template: 'free',
      readingTimeMin: 9,
      blocks: [
        { type: 'blog_heading', level: 2, text: 'O Que Significa "Hallyu"?' },
        { type: 'blog_paragraph', text: 'Hallyu (한류) significa literalmente "onda coreana" em coreano. O termo surgiu na China no final dos anos 1990 para descrever o crescente interesse na cultura popular sul-coreana — especialmente K-dramas e K-pop — que se espalhava rapidamente pela Ásia.' },
        { type: 'blog_paragraph', text: 'Hoje, o Hallyu vai muito além da Ásia. É um fenômeno verdadeiramente global que engloba música, cinema, séries, beleza, gastronomia, moda e até o idioma coreano — que experimentou um aumento de 65% nas matrículas em cursos online nos últimos cinco anos.' },
        { type: 'blog_quote', text: 'O Hallyu não é uma moda passageira. É uma mudança estrutural na forma como o mundo consome cultura.', author: 'Jungbong Choi, pesquisador de cultura coreana' },
        { type: 'blog_heading', level: 2, text: 'Como o Hallyu Nasceu' },
        { type: 'blog_paragraph', text: 'A história começa com a crise econômica asiática de 1997. A Coreia do Sul, devastada financeiramente, apostou na cultura como indústria de exportação. O governo investiu pesado em infraestrutura para entretenimento, e as agências de idol surgiram como empresas altamente profissionalizadas.' },
        { type: 'blog_paragraph', text: 'A primeira onda (1990s-2000s) foi liderada pelos K-dramas. "Winter Sonata" com Bae Yong-joon fez sucesso estrondoso no Japão. "Jewel in the Palace" conquistou a Ásia. Paralelamente, grupos como H.O.T e S.E.S. plantaram a semente do K-pop moderno.' },
        { type: 'blog_stats_row', items: [
          { label: 'Receita cultural exportada (2022)', value: '$12.4 bilhões USD' },
          { label: 'Estudo de coreano no mundo', value: '14 milhões de pessoas' },
          { label: 'Países com fãs de K-pop', value: '120+' },
          { label: 'Fãs de K-pop no Brasil', value: +3000000 + ' estimados' },
          { label: 'K-dramas na Netflix BR (top 10)', value: 'Frequentemente presente' },
        ]},
        { type: 'blog_heading', level: 2, text: 'O Brasil e o Hallyu' },
        { type: 'blog_paragraph', text: 'O Brasil é consistentemente listado entre os países com maior engajamento com o K-pop fora da Ásia. Com uma comunidade de fãs estimada em mais de 3 milhões de pessoas, os brasileiros são conhecidos internacionalmente pela paixão e criatividade — seja em stream parties, fancams, ou mobilizações de fandom.' },
        { type: 'blog_paragraph', text: 'Grupos como BTS, BLACKPINK, Stray Kids e ATEEZ já realizaram shows no Brasil ou têm forte demanda para voltar. Plataformas de streaming como Netflix Brasil localizam cada vez mais conteúdo coreano, e o coreano se tornou um dos idiomas mais estudados em apps como Duolingo no país.' },
        { type: 'blog_heading', level: 2, text: 'O Futuro do Hallyu' },
        { type: 'blog_paragraph', text: 'A quarta geração do K-pop (Aespa, NewJeans, STAYC, NMIXX, Le Sserafim, entre outros) já está conquistando audiências globais com estéticas e conceitos cada vez mais sofisticados. O K-cinema, após o Oscar de "Parasita" em 2020, ganha cada vez mais espaço em festivais internacionais.' },
        { type: 'blog_paragraph', text: 'O Hallyu não é passageiro — é uma transformação permanente no mapa cultural global. E o HallyuHub existe exatamente para ser o seu guia nessa onda.' },
      ],
    },
  ]

  let created = 0
  for (const post of posts) {
    const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug } })
    if (existing) {
      console.log(`⏭  Já existe: ${post.slug}`)
      continue
    }

    await prisma.blogPost.create({
      data: {
        slug: post.slug,
        title: post.title,
        excerpt: post.excerpt,
        contentMd: ' ', // blocks têm precedência
        blocks: post.blocks as object,
        template: post.template,
        coverImageUrl: null,
        categoryId: post.categoryId,
        tags: post.tags,
        readingTimeMin: post.readingTimeMin,
        authorId: admin.id,
        status: 'PUBLISHED',
        isPrivate: true,
        publishedAt: new Date(),
      },
    })
    console.log(`✅ Criado: ${post.title}`)
    created++
  }

  console.log(`\n🎉 ${created} post(s) criado(s). Acesse em /blog/preview/[slug]`)
  console.log('\nLinks de prévia:')
  for (const post of posts) {
    console.log(`  https://www.hallyuhub.com.br/blog/preview/${post.slug}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
