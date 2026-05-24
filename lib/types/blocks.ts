// ─── News Block Types (Option A — Block Editor) ───────────────────────────────
//
// Each block has a `type` discriminator. Text-based blocks carry `original`
// (source language) and `translated` (pt-BR) strings. Media blocks carry
// only the necessary URLs/metadata.
//
// The `blocks` field on the News model stores `NewsBlock[]` serialized as JSON.

export type HeadingBlock = {
    type: 'heading'
    original: string
    translated: string
}

export type ParagraphBlock = {
    type: 'paragraph'
    original: string
    translated: string
}

export type QuoteBlock = {
    type: 'quote'
    original: string
    translated: string
}

export type ImageBlock = {
    type: 'image'
    url: string
    caption?: string
}

export type TwitterEmbedBlock = {
    type: 'twitter_embed'
    url: string
}

export type InstagramEmbedBlock = {
    type: 'instagram_embed'
    url: string
}

export type TikTokEmbedBlock = {
    type: 'tiktok_embed'
    url: string
}

export type VideoBlock = {
    type: 'video'
    url: string
    caption?: string
}

export type NewsBlock =
    | HeadingBlock
    | ParagraphBlock
    | QuoteBlock
    | ImageBlock
    | TwitterEmbedBlock
    | InstagramEmbedBlock
    | TikTokEmbedBlock
    | VideoBlock

export type NewsBlockType = NewsBlock['type']

export const BLOCK_TYPE_LABELS: Record<NewsBlockType, string> = {
    heading: 'Título',
    paragraph: 'Parágrafo',
    quote: 'Citação',
    image: 'Imagem',
    twitter_embed: 'Tweet',
    instagram_embed: 'Instagram',
    tiktok_embed: 'TikTok',
    video: 'Vídeo',
}

export const TEXT_BLOCK_TYPES: NewsBlockType[] = ['heading', 'paragraph', 'quote']
export const MEDIA_BLOCK_TYPES: NewsBlockType[] = ['image', 'twitter_embed', 'instagram_embed', 'tiktok_embed', 'video']

export function isTextBlock(block: NewsBlock): block is HeadingBlock | ParagraphBlock | QuoteBlock {
    return TEXT_BLOCK_TYPES.includes(block.type)
}

// ─── Blog Block Types ──────────────────────────────────────────────────────────
//
// Blocos exclusivos do blog — enriquecem posts com dados estruturados do site.
// Usados no BlogBlockEditor e renderizados pelo BlogBlockRenderer.

export type BlogHeadingBlock = {
    type: 'blog_heading'
    text: string
    level: 1 | 2 | 3
}

export type BlogParagraphBlock = {
    type: 'blog_paragraph'
    text: string
}

export type BlogQuoteBlock = {
    type: 'blog_quote'
    text: string
    author?: string
}

export type BlogImageBlock = {
    type: 'blog_image'
    url: string
    alt?: string
    caption?: string
    fullWidth?: boolean
    size?: 'small' | 'medium' | 'full'
}

export type BlogGalleryBlock = {
    type: 'blog_gallery'
    urls: string[]
    caption?: string
}

export type BlogVideoBlock = {
    type: 'blog_video'
    url: string
    caption?: string
}

export type BlogTwitterBlock = {
    type: 'blog_twitter'
    url: string
}

export type BlogInstagramBlock = {
    type: 'blog_instagram'
    url: string
}

export type BlogTikTokBlock = {
    type: 'blog_tiktok'
    url: string
}

// Bloco de card de artista — puxa dados ao vivo pelo id
export type BlogArtistCardBlock = {
    type: 'blog_artist_card'
    artistId: string
    note?: string          // anotação editorial opcional
    compact?: boolean
}

// Bloco de card de produção
export type BlogProductionCardBlock = {
    type: 'blog_production_card'
    productionId: string
    note?: string
    compact?: boolean
}

// Bloco de card de grupo musical
export type BlogGroupCardBlock = {
    type: 'blog_group_card'
    groupId: string
    note?: string
    compact?: boolean
}

// Linha de stats biográficos (ex: data de nascimento, altura, grupo)
export type BlogStatsRowBlock = {
    type: 'blog_stats_row'
    items: { label: string; value: string; emoji?: string }[]
}

// Avaliação editorial (estrelas + texto)
export type BlogRatingBlock = {
    type: 'blog_rating'
    score: number          // 0–10
    label?: string         // ex: "Álbum", "Drama", "Comeback"
    summary?: string
}

// Divisor visual
export type BlogDividerBlock = {
    type: 'blog_divider'
}

// Slot de anúncio editorial
export type BlogAdBlock = {
    type: 'blog_ad'
    label?: string
}

// Embed do Spotify (track, álbum, playlist, artista)
export type BlogSpotifyBlock = {
    type: 'blog_spotify'
    url: string
    compact?: boolean
}

// Item de linha do tempo
export type BlogTimelineItem = {
    year: string
    title: string
    text?: string
    emoji?: string
}

// Linha do tempo / marcos da carreira
export type BlogTimelineBlock = {
    type: 'blog_timeline'
    items: BlogTimelineItem[]
}

// Caixa de destaque (fato, dado, alerta, info)
export type BlogCalloutBlock = {
    type: 'blog_callout'
    variant: 'fact' | 'stat' | 'info' | 'warning'
    title?: string
    text: string
}

// Card "Você sabia?" — curiosidade visual destacada
export type BlogCuriosityBlock = {
    type: 'blog_curiosity'
    text: string
    emoji?: string   // ex: "🎤", "🏆", "🎬"
}

// Pull quote estilo revista — texto grande centralizado para impacto visual
export type BlogHighlightBlock = {
    type: 'blog_highlight'
    text: string
    attribution?: string
}

export type BlogListBlock = {
    type: 'blog_list'
    items: string[]
    ordered?: boolean
}

export type BlogProsConsBlock = {
    type: 'blog_pros_cons'
    pros: string[]
    cons: string[]
    title?: string
}

export type BlogStepsBlock = {
    type: 'blog_steps'
    steps: { title: string; text: string }[]
    title?: string
}

export type BlogProductCardBlock = {
    type: 'blog_product_card'
    name: string
    imageUrl: string
    price: string
    originalPrice?: string
    badge?: string
    rating?: number
    affiliateUrl: string
    cta?: string
}

export type BlogComparisonBlock = {
    type: 'blog_comparison'
    title?: string
    columns: string[]
    rows: { label: string; values: string[] }[]
}

// Acordeão retrátil — FAQ, perguntas e respostas, seções colapsáveis
export type BlogAccordionBlock = {
    type: 'blog_accordion'
    title?: string
    items: { question: string; answer: string }[]
}

// Abas de conteúdo — perfil, discografia, curiosidades
export type BlogTabsBlock = {
    type: 'blog_tabs'
    tabs: { label: string; content: string }[]
}

// Ranking numerado com imagem e descrição
export type BlogRankingBlock = {
    type: 'blog_ranking'
    title?: string
    items: { position: number; name: string; description?: string; imageUrl?: string; badge?: string }[]
}

// Trivia — pergunta com resposta oculta (clique para revelar)
export type BlogTriviaBlock = {
    type: 'blog_trivia'
    question: string
    answer: string
    hint?: string
}

// Card de comeback / lançamento — anúncio com data, título e imagem
export type BlogComebackCardBlock = {
    type: 'blog_comeback_card'
    artist: string
    title: string
    date: string          // ex: "2025-06-15"
    imageUrl?: string
    type_label?: string   // ex: "Mini Album", "Single", "Full Album"
    description?: string
}

// Grade de membros — foto + nome + cargo para grupos
export type BlogMemberGridBlock = {
    type: 'blog_member_grid'
    members: { name: string; role?: string; imageUrl?: string; note?: string }[]
    title?: string
}

// Setlist de show — lista de músicas com número e duração opcional
export type BlogSetlistBlock = {
    type: 'blog_setlist'
    event?: string        // ex: "MOTS: ON! Clip - BE-hind Story"
    date?: string
    venue?: string
    tracks: { number: number; title: string; note?: string }[]
}

// Caixa de alerta / tip / aviso
export type BlogAlertBlock = {
    type: 'blog_alert'
    variant: 'info' | 'tip' | 'warning' | 'spoiler'
    text: string
    title?: string
}

// Confronto lado a lado (A vs B) com votação local
export type BlogVsBlock = {
    type: 'blog_vs'
    optionA: { label: string; imageUrl?: string; description?: string }
    optionB: { label: string; imageUrl?: string; description?: string }
    question?: string
}

// Enquete clicável com resultados visuais (votos em localStorage)
export type BlogPollBlock = {
    type: 'blog_poll'
    question: string
    options: string[]
}

// Trecho de letra com original + romanização + tradução (tabela linha a linha)
export type BlogLyricsBlock = {
    type: 'blog_lyrics'
    title?: string
    lines: { original: string; romanized?: string; translation: string }[]
    source?: string
}

// Letra completa lado a lado — original + romanização (esq) | tradução (dir), por seção
export type BlogLyricsParallelBlock = {
    type: 'blog_lyrics_parallel'
    title?: string
    artist?: string
    lang?: 'ko' | 'en' | 'ja'   // default 'ko'
    sections: {
        label?: string            // 'Estrofe 1', 'Refrão', 'Ponte', etc.
        original: string          // versos separados por \n
        romanized?: string        // romanização separada por \n (opcional)
        translation: string       // tradução pt-BR separada por \n
    }[]
    source?: string
}

// Card de era musical com paleta de cores e conceito
export type BlogEraCardBlock = {
    type: 'blog_era_card'
    era: string
    period: string
    concept?: string
    colors?: string[]   // hex codes
    imageUrl?: string
    highlights?: string[]
}

// Histórico de posições em charts
export type BlogChartHistoryBlock = {
    type: 'blog_chart_history'
    title?: string
    chart: string       // ex: "Melon Top 100", "Billboard Hot 100"
    entries: { date: string; position: number; label?: string }[]
}

// Slider antes/depois de imagem
export type BlogBeforeAfterBlock = {
    type: 'blog_before_after'
    before: { url: string; label?: string }
    after: { url: string; label?: string }
    caption?: string
}

// Citações/reações de fãs estilo redes sociais
export type BlogFandomBlock = {
    type: 'blog_fandom'
    title?: string
    quotes: { text: string; author?: string; platform?: 'twitter' | 'reddit' | 'instagram' | 'tiktok' | 'forum' }[]
}

// Card do lightstick oficial
export type BlogLightstickBlock = {
    type: 'blog_lightstick'
    group: string
    name: string
    imageUrl?: string
    colors: string[]    // hex codes das cores do lightstick
    funFact?: string
    generation?: string
}

// Quiz com múltiplas perguntas e placar final
export type BlogQuizBlock = {
    type: 'blog_quiz'
    title?: string
    questions: { question: string; options: string[]; correct: number }[]
}

// Contador regressivo para comeback/evento
export type BlogCountdownBlock = {
    type: 'blog_countdown'
    title: string
    artist: string
    targetDate: string   // ISO 8601: "2025-08-15T00:00:00+09:00"
    description?: string
}

// Grade visual de capas de álbuns
export type BlogDiscographyGridBlock = {
    type: 'blog_discography_grid'
    artist: string
    albums: { title: string; year: string; type: string; imageUrl?: string; color?: string; emoji?: string }[]
}

// Conquistas e recordes com badges
export type BlogAchievementBlock = {
    type: 'blog_achievement'
    title?: string
    items: { icon: string; title: string; description: string; color?: string }[]
}

// Análise de MV com timestamps clicáveis
export type BlogMvBreakdownBlock = {
    type: 'blog_mv_breakdown'
    title?: string
    videoId: string      // YouTube video ID
    scenes: { time: string; label: string; description: string }[]
}

// Flashcards para aprender coreano / vocabulário K-Pop
export type BlogFlashcardBlock = {
    type: 'blog_flashcard'
    title?: string
    cards: { front: string; back: string; romanized?: string; example?: string }[]
}

// Posições dos membros de um grupo
export type BlogPositionsBlock = {
    type: 'blog_positions'
    title?: string
    members: { name: string; positions: string[]; imageUrl?: string; line?: 'vocal' | 'dance' | 'rap' | 'visual' | 'all' }[]
}

export type BlogIdolFactsBlock = {
    type: 'blog_idol_facts'
    name: string
    imageUrl?: string
    facts: { label: string; value: string }[]
}

export type BlogBlock =
    | BlogHeadingBlock
    | BlogParagraphBlock
    | BlogQuoteBlock
    | BlogImageBlock
    | BlogGalleryBlock
    | BlogVideoBlock
    | BlogTwitterBlock
    | BlogInstagramBlock
    | BlogTikTokBlock
    | BlogArtistCardBlock
    | BlogProductionCardBlock
    | BlogGroupCardBlock
    | BlogStatsRowBlock
    | BlogRatingBlock
    | BlogSpotifyBlock
    | BlogTimelineBlock
    | BlogDividerBlock
    | BlogCalloutBlock
    | BlogCuriosityBlock
    | BlogHighlightBlock
    | BlogListBlock
    | BlogProsConsBlock
    | BlogStepsBlock
    | BlogProductCardBlock
    | BlogComparisonBlock
    | BlogAccordionBlock
    | BlogTabsBlock
    | BlogRankingBlock
    | BlogTriviaBlock
    | BlogComebackCardBlock
    | BlogMemberGridBlock
    | BlogSetlistBlock
    | BlogAlertBlock
    | BlogVsBlock
    | BlogPollBlock
    | BlogLyricsBlock
    | BlogLyricsParallelBlock
    | BlogEraCardBlock
    | BlogChartHistoryBlock
    | BlogBeforeAfterBlock
    | BlogFandomBlock
    | BlogLightstickBlock
    | BlogPositionsBlock
    | BlogQuizBlock
    | BlogCountdownBlock
    | BlogDiscographyGridBlock
    | BlogAchievementBlock
    | BlogMvBreakdownBlock
    | BlogFlashcardBlock
    | BlogIdolFactsBlock
    | BlogAdBlock

export type BlogBlockType = BlogBlock['type']

export const BLOG_BLOCK_TYPE_LABELS: Record<BlogBlockType, string> = {
    blog_heading:          'Título',
    blog_paragraph:        'Parágrafo',
    blog_quote:            'Citação',
    blog_image:            'Imagem',
    blog_gallery:          'Galeria',
    blog_video:            'Vídeo',
    blog_twitter:          'Tweet',
    blog_instagram:        'Instagram',
    blog_tiktok:           'TikTok',
    blog_artist_card:      'Card de Artista',
    blog_production_card:  'Card de Produção',
    blog_group_card:       'Card de Grupo',
    blog_stats_row:        'Stats / Dados',
    blog_rating:           'Avaliação',
    blog_divider:          'Divisor',
    blog_callout:          'Destaque',
    blog_curiosity:        'Curiosidade',
    blog_highlight:        'Destaque Visual',
    blog_spotify:          'Spotify',
    blog_timeline:         'Linha do Tempo',
    blog_list:             'Lista',
    blog_pros_cons:        'Prós e Contras',
    blog_steps:            'Passo a Passo',
    blog_product_card:     'Card de Produto',
    blog_comparison:       'Tabela Comparativa',
    blog_accordion:        'Acordeão (FAQ)',
    blog_tabs:             'Abas',
    blog_ranking:          'Ranking',
    blog_trivia:           'Trivia / Quiz',
    blog_comeback_card:    'Card de Comeback',
    blog_member_grid:      'Grade de Membros',
    blog_setlist:          'Setlist',
    blog_alert:            'Alerta / Dica',
    blog_vs:               'Confronto A vs B',
    blog_poll:             'Enquete',
    blog_lyrics:           'Trecho de Letra',
    blog_lyrics_parallel:  'Letra Lado a Lado',
    blog_era_card:         'Card de Era',
    blog_chart_history:    'Histórico de Charts',
    blog_before_after:     'Antes e Depois',
    blog_fandom:           'Reações dos Fãs',
    blog_lightstick:       'Lightstick',
    blog_positions:        'Posições do Grupo',
    blog_quiz:             'Quiz Interativo',
    blog_countdown:        'Countdown de Comeback',
    blog_discography_grid: 'Grade de Discografia',
    blog_achievement:      'Conquistas / Recordes',
    blog_mv_breakdown:     'Análise de MV',
    blog_flashcard:        'Flashcards',
    blog_idol_facts:       'Ficha do Idol',
    blog_ad:               'Slot de Anúncio',
}

export type BlogTemplate = 'free' | 'idol_bio' | 'review' | 'ranking' | 'group_bio' | 'comeback' | 'interview' | 'guide' | 'news' | 'listicle'

export const BLOG_TEMPLATE_LABELS: Record<BlogTemplate, string> = {
    free:      'Livre',
    idol_bio:  'Biografia de Idol',
    group_bio: 'Biografia de Grupo',
    review:    'Review / Análise',
    comeback:  'Comeback / Álbum',
    interview: 'Entrevista',
    guide:     'Guia Completo',
    news:      'Notícia',
    ranking:   'Ranking / Top N',
    listicle:  'Listagem',
}

/** Blocos pré-carregados para cada template */
export const BLOG_TEMPLATE_BLOCKS: Record<BlogTemplate, BlogBlock[]> = {
    free: [],

    idol_bio: [
        { type: 'blog_heading', text: 'Quem é?', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_stats_row', items: [
            { label: 'Nome real', value: '' },
            { label: 'Data de nascimento', value: '' },
            { label: 'Altura', value: '' },
            { label: 'Grupo', value: '' },
            { label: 'Agência', value: '' },
        ]},
        { type: 'blog_heading', text: 'Carreira', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Por que você vai amar', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Produções em destaque', level: 2 },
        { type: 'blog_heading', text: 'Curiosidades', level: 2 },
        { type: 'blog_paragraph', text: '' },
    ],

    review: [
        { type: 'blog_heading', text: 'Nossa análise', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_rating', score: 8, label: '', summary: '' },
        { type: 'blog_heading', text: 'Pontos fortes', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Pontos fracos', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Veredicto', level: 2 },
        { type: 'blog_quote', text: '', author: 'Equipe HallyuHub' },
    ],

    ranking: [
        { type: 'blog_heading', text: '#1', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '#2', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '#3', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '#4', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '#5', level: 2 },
        { type: 'blog_paragraph', text: '' },
    ],

    group_bio: [
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_stats_row', items: [
            { label: 'Formação', value: '' },
            { label: 'Agência', value: '' },
            { label: 'Integrantes', value: '' },
            { label: 'Fandom', value: '' },
            { label: 'Lightstick', value: '' },
        ]},
        { type: 'blog_heading', text: 'Integrantes', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Discografia em destaque', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Conceito e identidade', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Conquistas', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Por que acompanhar', level: 2 },
        { type: 'blog_paragraph', text: '' },
    ],

    comeback: [
        { type: 'blog_heading', text: 'O comeback', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Tracklist', level: 2 },
        { type: 'blog_list', items: [''], ordered: true },
        { type: 'blog_heading', text: 'Faixas em destaque', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'MV / Conceito visual', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Recepção', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_pros_cons', pros: [''], cons: [''], title: 'Pontos fortes e fracos' },
        { type: 'blog_rating', score: 8, label: 'Nota geral', summary: '' },
    ],

    interview: [
        { type: 'blog_callout', variant: 'fact', title: 'Contexto', text: '' },
        { type: 'blog_heading', text: 'Sobre a carreira', level: 2 },
        { type: 'blog_quote', text: '', author: '' },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Sobre o novo projeto', level: 2 },
        { type: 'blog_quote', text: '', author: '' },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Sobre os fãs', level: 2 },
        { type: 'blog_quote', text: '', author: '' },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'O que vem por aí', level: 2 },
        { type: 'blog_quote', text: '', author: '' },
        { type: 'blog_paragraph', text: '' },
    ],

    guide: [
        { type: 'blog_callout', variant: 'fact', title: 'O que você vai aprender', text: '' },
        { type: 'blog_heading', text: 'Introdução', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Passo a passo', level: 2 },
        { type: 'blog_steps', steps: [
            { title: 'Passo 1', text: '' },
            { title: 'Passo 2', text: '' },
            { title: 'Passo 3', text: '' },
        ], title: '' },
        { type: 'blog_heading', text: 'Dicas importantes', level: 2 },
        { type: 'blog_list', items: [''], ordered: false },
        { type: 'blog_heading', text: 'Perguntas frequentes', level: 2 },
        { type: 'blog_accordion', title: 'FAQ', items: [{ question: '', answer: '' }] },
        { type: 'blog_heading', text: 'Conclusão', level: 2 },
        { type: 'blog_paragraph', text: '' },
    ],

    news: [
        { type: 'blog_callout', variant: 'info', title: '', text: '' },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'O que aconteceu', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Reação dos fãs', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'O que vem a seguir', level: 2 },
        { type: 'blog_paragraph', text: '' },
    ],

    listicle: [
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '1.', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '2.', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '3.', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '4.', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: '5.', level: 2 },
        { type: 'blog_paragraph', text: '' },
        { type: 'blog_heading', text: 'Conclusão', level: 2 },
        { type: 'blog_paragraph', text: '' },
    ],
}
