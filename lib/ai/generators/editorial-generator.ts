/**
 * Editorial Generator
 * Gera conteúdo autoral original para artistas, grupos, produções e notícias.
 * Usado para enriquecer páginas com conteúdo próprio (requisito AdSense).
 */

import { getOrchestrator } from '../orchestrator-factory'
import { logAiUsage } from '../ai-usage-logger'
import type { AiFeature } from '../ai-features'

// ─── Tipos de resultado ────────────────────────────────────────────────────────

export interface ArtistBioResult {
    bio: string
    tokensIn: number
    tokensOut: number
    cost: number
}

export interface ArtistEditorialResult {
    analiseEditorial: string
    tokensIn: number
    tokensOut: number
    cost: number
}

export interface ArtistCuriosidadesResult {
    curiosidades: string[]
    tokensIn: number
    tokensOut: number
    cost: number
}

export interface ProductionReviewResult {
    editorialReview: string
    whyWatch: string
    editorialRating: number
    tokensIn: number
    tokensOut: number
    cost: number
}

export interface NewsEditorialNoteResult {
    editorialNote: string
    tokensIn: number
    tokensOut: number
    cost: number
}

export interface BlogPostResult {
    title: string
    slug: string
    excerpt: string
    contentMd: string
    tags: string[]
    readingTimeMin: number
    tokensIn: number
    tokensOut: number
    cost: number
}

// ─── Estimativas de custo (dry-run) ───────────────────────────────────────────

/** Estimativa de custo por feature (em USD), usando DeepSeek-V3 como base */
export const EDITORIAL_COST_ESTIMATES: Record<string, number> = {
    artist_bio_enrichment:  0.0020,
    artist_editorial:       0.0020,
    artist_curiosidades:    0.0010,
    group_bio_enrichment:   0.0020,
    group_editorial:        0.0020,
    production_review:      0.0025,
    news_editorial_note:    0.0005,
    blog_post_generation:   0.0030,
}

// ─── Funções de geração ────────────────────────────────────────────────────────

/**
 * Gera bio extensa (400+ palavras) em PT-BR para um artista sem bio
 * ou com bio curta (< 200 palavras).
 */
export async function generateArtistBio(artist: {
    nameRomanized: string
    nameHangul?: string | null
    roles: string[]
    birthDate?: Date | null
    birthName?: string | null
    placeOfBirth?: string | null
    agency?: { name: string } | null
    memberships?: { group: { name: string }; isActive: boolean }[]
    bio?: string | null
}): Promise<ArtistBioResult> {
    const orchestrator = getOrchestrator()
    const t0 = Date.now()

    const groups = artist.memberships?.map(m => m.group.name).join(', ') || 'solo'
    const roles = artist.roles.join(', ') || 'artista'
    const agency = artist.agency?.name || 'agência não informada'

    const prompt = `Escreva uma biografia detalhada e envolvente em português brasileiro sobre o artista de K-pop/K-drama **${artist.nameRomanized}** (${artist.nameHangul || 'nome hangul não disponível'}).

Informações disponíveis:
- Papéis: ${roles}
- Grupo(s): ${groups}
- Agência: ${agency}
- Local de nascimento: ${artist.placeOfBirth || 'não informado'}
- Nome de nascimento: ${artist.birthName || 'não informado'}
${artist.bio ? `- Bio resumida existente: "${artist.bio.slice(0, 300)}"` : ''}

A biografia deve:
- Ter entre 400 e 500 palavras
- Ser escrita em português brasileiro fluente e natural
- Cobrir início de carreira, trajetória, conquistas e impacto cultural
- Ser informativa e interessante para fãs brasileiros do K-pop
- NÃO inventar datas, prêmios ou fatos específicos que você não tem certeza
- Usar expressões como "é reconhecido/a por", "ficou conhecido/a", "tem conquistado"
- Terminar com uma frase sobre o impacto atual ou legado do artista

Responda APENAS com a biografia, sem título, sem introdução, sem notas.`

    const feature: AiFeature = 'artist_bio_enrichment'

    try {
        const result = await orchestrator.generate(prompt, {
            feature,
            preferredProvider: 'deepseek',
            maxTokens: 700,
            temperature: 0.7,
        })

        logAiUsage({
            provider: result.provider,
            model: result.model,
            feature,
            tokensIn: result.tokensIn,
            tokensOut: result.tokensOut,
            cost: result.cost ?? 0,
            durationMs: Date.now() - t0,
            status: 'success',
        })

        return {
            bio: result.content.trim(),
            tokensIn: result.tokensIn ?? 0,
            tokensOut: result.tokensOut ?? 0,
            cost: result.cost ?? 0,
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logAiUsage({
            provider: 'deepseek',
            model: 'deepseek-chat',
            feature,
            durationMs: Date.now() - t0,
            status: 'error',
            errorMsg: msg,
        })
        throw err
    }
}

/**
 * Gera análise editorial original (400+ palavras) sobre um artista.
 * Diferente da bio: é opinativo e analítico, não biográfico.
 */
export async function generateArtistEditorial(artist: {
    nameRomanized: string
    roles: string[]
    bio?: string | null
    memberships?: { group: { name: string } }[]
}): Promise<ArtistEditorialResult> {
    const orchestrator = getOrchestrator()
    const t0 = Date.now()

    const groups = artist.memberships?.map(m => m.group.name).join(', ') || 'solo'
    const feature: AiFeature = 'artist_editorial'

    const prompt = `Atue como um redator biográfico focado em dados e cronologia.

Escreva a biografia de **${artist.nameRomanized}** (${artist.roles.join(', ')}${groups !== 'solo' ? `, integrante de ${groups}` : ', carreira solo'}) organizada em exatamente 4 parágrafos curtos, cada um com um título de uma ou duas palavras.

${artist.bio ? `Contexto biográfico: "${artist.bio.slice(0, 500)}"` : ''}

Estrutura obrigatória:
- Parágrafo 1 — Origem: marcos históricos e primeiros grandes sucessos.
- Parágrafo 2 — Projetos: produções atuais (2024–2026), desempenho em plataformas de streaming e novos lançamentos.
- Parágrafo 3 — Reconhecimento: prêmios reais, competências técnicas e atuação comercial/marcas.
- Parágrafo 4 — Curiosidades: fatos objetivos fora da atuação; inclua ao menos uma curiosidade inesperada ou engraçada.

Regras:
- Títulos de no máximo 2 palavras (ex: "Trajetória", "Projetos", "Prêmios", "Curiosidades").
- Priorize fatos concretos, marcos de audiência, prêmios reais e produções específicas.
- NÃO use frases de efeito como "exemplo de resiliência", "atingiu novo patamar", "ícone global".
- NÃO use adjetivos subjetivos — se o artista é talentoso, cite o prêmio, não o adjetivo.
- NÃO use emojis.
- Tom: seco, informativo, profissional e direto ao ponto.

Formato de saída — use EXATAMENTE este padrão (sem variações):
**[Título]**
[conteúdo]

**[Título]**
[conteúdo]

**[Título]**
[conteúdo]

**[Título]**
[conteúdo]`

    try {
        const result = await orchestrator.generate(prompt, {
            feature,
            preferredProvider: 'deepseek',
            maxTokens: 650,
            temperature: 0.75,
        })

        logAiUsage({
            provider: result.provider, model: result.model, feature,
            tokensIn: result.tokensIn, tokensOut: result.tokensOut,
            cost: result.cost ?? 0, durationMs: Date.now() - t0, status: 'success',
        })

        return {
            analiseEditorial: result.content.trim(),
            tokensIn: result.tokensIn ?? 0,
            tokensOut: result.tokensOut ?? 0,
            cost: result.cost ?? 0,
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logAiUsage({ provider: 'deepseek', model: 'deepseek-chat', feature, durationMs: Date.now() - t0, status: 'error', errorMsg: msg })
        throw err
    }
}

/**
 * Gera 6-8 curiosidades originais sobre um artista.
 */
export async function generateArtistCuriosidades(artist: {
    nameRomanized: string
    nameHangul?: string | null
    bio?: string | null
    roles: string[]
    memberships?: { group: { name: string } }[]
}): Promise<ArtistCuriosidadesResult> {
    const orchestrator = getOrchestrator()
    const t0 = Date.now()
    const feature: AiFeature = 'artist_curiosidades'

    const prompt = `Crie 6 curiosidades interessantes sobre o artista **${artist.nameRomanized}** (K-pop/K-drama) para o site HallyuHub em português brasileiro.

${artist.bio ? `Contexto: "${artist.bio.slice(0, 300)}"` : ''}

As curiosidades devem:
- Ser factuais e verificáveis (não invente datas ou números exatos que não sabe)
- Ser variadas: personalidade, talento, história, conquistas, conexão com fãs
- Ter entre 1 e 2 frases cada
- Ser escritas em português brasileiro natural
- Agregar valor para fãs que já conhecem o artista

Responda SOMENTE com JSON válido no formato:
{"curiosidades": ["curiosidade 1", "curiosidade 2", "curiosidade 3", "curiosidade 4", "curiosidade 5", "curiosidade 6"]}`

    try {
        const result = await orchestrator.generateStructured<{ curiosidades: string[] }>(
            prompt,
            '{"curiosidades": ["string"]}',
            { feature, preferredProvider: 'deepseek', maxTokens: 500, temperature: 0.8 }
        )

        // Calcular custo aproximado (generateStructured não retorna tokensIn/Out diretamente)
        const cost = EDITORIAL_COST_ESTIMATES.artist_curiosidades

        logAiUsage({
            provider: 'deepseek', model: 'deepseek-chat', feature,
            durationMs: Date.now() - t0, status: 'success',
        })

        return {
            curiosidades: result.curiosidades.slice(0, 8),
            tokensIn: 0,
            tokensOut: 0,
            cost,
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logAiUsage({ provider: 'deepseek', model: 'deepseek-chat', feature, durationMs: Date.now() - t0, status: 'error', errorMsg: msg })
        throw err
    }
}

/**
 * Gera review editorial + "por que assistir" + nota para uma produção.
 */
export async function generateProductionReview(production: {
    titlePt: string
    titleKr?: string | null
    type: string
    year?: number | null
    synopsis?: string | null
    tagline?: string | null
    voteAverage?: number | null
    streamingPlatforms: string[]
    network?: string | null
}): Promise<ProductionReviewResult> {
    const orchestrator = getOrchestrator()
    const t0 = Date.now()
    const feature: AiFeature = 'production_review'

    const platforms = production.streamingPlatforms.join(', ') || 'não informado'
    const type = production.type === 'tv' ? 'dorama/série coreana' : 'filme coreano'

    const prompt = `Escreva uma review editorial em português brasileiro para o ${type} **${production.titlePt}** (${production.titleKr || 'título coreano não disponível'}), ${production.year || 'ano não informado'}.

Informações:
- Sinopse: ${production.synopsis ? production.synopsis.slice(0, 400) : 'não disponível'}
- Tagline: ${production.tagline || 'não disponível'}
- Plataformas: ${platforms}
- Canal: ${production.network || 'não informado'}
- Nota TMDB: ${production.voteAverage ? production.voteAverage.toFixed(1) + '/10' : 'não disponível'}

Responda SOMENTE com JSON válido no formato:
{
  "editorialReview": "review detalhada de 350-450 palavras em PT-BR, análise crítica da obra, pontos fortes, impacto cultural, sem spoilers",
  "whyWatch": "parágrafo curto de 2-3 frases respondendo 'Por que assistir?' em PT-BR",
  "editorialRating": 8.0
}

Para a nota editorial (0-10), use critérios: roteiro, atuação, produção, impacto emocional e relevância cultural.`

    try {
        const result = await orchestrator.generateStructured<{
            editorialReview: string
            whyWatch: string
            editorialRating: number
        }>(prompt, '{"editorialReview": "string", "whyWatch": "string", "editorialRating": 0}', {
            feature, preferredProvider: 'deepseek', maxTokens: 750, temperature: 0.7,
        })

        logAiUsage({
            provider: 'deepseek', model: 'deepseek-chat', feature,
            durationMs: Date.now() - t0, status: 'success',
        })

        return {
            editorialReview: result.editorialReview.trim(),
            whyWatch: result.whyWatch.trim(),
            editorialRating: Math.min(10, Math.max(0, result.editorialRating)),
            tokensIn: 0,
            tokensOut: 0,
            cost: EDITORIAL_COST_ESTIMATES.production_review,
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logAiUsage({ provider: 'deepseek', model: 'deepseek-chat', feature, durationMs: Date.now() - t0, status: 'error', errorMsg: msg })
        throw err
    }
}

/**
 * Gera nota editorial contextual (100-200 palavras) para uma notícia traduzida.
 * Adiciona perspectiva original ao conteúdo agregado.
 */
export async function generateNewsEditorialNote(news: {
    title: string
    contentMd: string
    source?: string | null
}): Promise<NewsEditorialNoteResult> {
    const orchestrator = getOrchestrator()
    const t0 = Date.now()
    const feature: AiFeature = 'news_editorial_note'

    const excerpt = news.contentMd.slice(0, 600)

    const prompt = `Com base na seguinte notícia de K-pop/K-drama, escreva uma breve nota editorial em português brasileiro (100-150 palavras) que adicione contexto, perspectiva ou análise original para o leitor brasileiro.

**Título:** ${news.title}
**Trecho:** ${excerpt}
**Fonte:** ${news.source || 'internacional'}

A nota editorial deve:
- Adicionar contexto que o leitor brasileiro valoriza
- Ter opinião ou análise própria (não apenas resumir)
- Mencionar a relevância para o público brasileiro quando aplicável
- Ser escrita em primeira pessoa do plural ("aqui no HallyuHub..." / "para os fãs brasileiros...")
- Ter entre 100 e 150 palavras

Responda APENAS com o texto da nota, sem título nem aspas.`

    try {
        const result = await orchestrator.generate(prompt, {
            feature,
            preferredProvider: 'deepseek',
            maxTokens: 250,
            temperature: 0.8,
        })

        logAiUsage({
            provider: result.provider, model: result.model, feature,
            tokensIn: result.tokensIn, tokensOut: result.tokensOut,
            cost: result.cost ?? 0, durationMs: Date.now() - t0, status: 'success',
        })

        return {
            editorialNote: result.content.trim(),
            tokensIn: result.tokensIn ?? 0,
            tokensOut: result.tokensOut ?? 0,
            cost: result.cost ?? 0,
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logAiUsage({ provider: 'deepseek', model: 'deepseek-chat', feature, durationMs: Date.now() - t0, status: 'error', errorMsg: msg })
        throw err
    }
}

/**
 * Gera um post de blog completo baseado em uma notícia recente.
 */
export async function generateBlogPostFromNews(news: {
    title: string
    contentMd: string
    source?: string | null
    tags?: string[]
}): Promise<BlogPostResult> {
    const orchestrator = getOrchestrator()
    const t0 = Date.now()
    const feature: AiFeature = 'blog_post_generation'

    const prompt = `Com base na notícia abaixo, crie um post de blog original em português brasileiro para o site HallyuHub (site de K-pop e K-drama para brasileiros).

**Notícia base:**
Título: ${news.title}
Conteúdo: ${news.contentMd.slice(0, 800)}

O post deve:
- Ter título próprio (diferente da notícia)
- Ter 500-700 palavras de conteúdo original
- Adicionar análise, contexto histórico, ou perspectiva editorial
- Não ser apenas tradução da notícia — deve agregar valor
- Ter linguagem acessível e envolvente para fãs brasileiros
- Incluir introdução, desenvolvimento e conclusão

Responda SOMENTE com JSON válido:
{
  "title": "título do post em PT-BR",
  "excerpt": "resumo de 1-2 frases para preview (máx 150 chars)",
  "contentMd": "conteúdo completo em markdown, 500-700 palavras",
  "tags": ["tag1", "tag2", "tag3"]
}`

    try {
        const result = await orchestrator.generateStructured<{
            title: string
            excerpt: string
            contentMd: string
            tags: string[]
        }>(prompt, '{"title": "string", "excerpt": "string", "contentMd": "string", "tags": []}', {
            feature, preferredProvider: 'deepseek', maxTokens: 1200, temperature: 0.8,
        })

        const wordCount = result.contentMd.split(/\s+/).length
        const readingTimeMin = Math.max(1, Math.round(wordCount / 200))

        // Gerar slug a partir do título
        const slug = result.title
            .toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .slice(0, 80)

        logAiUsage({
            provider: 'deepseek', model: 'deepseek-chat', feature,
            durationMs: Date.now() - t0, status: 'success',
        })

        return {
            title: result.title,
            slug,
            excerpt: result.excerpt,
            contentMd: result.contentMd,
            tags: result.tags.slice(0, 8),
            readingTimeMin,
            tokensIn: 0,
            tokensOut: 0,
            cost: EDITORIAL_COST_ESTIMATES.blog_post_generation,
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        logAiUsage({ provider: 'deepseek', model: 'deepseek-chat', feature, durationMs: Date.now() - t0, status: 'error', errorMsg: msg })
        throw err
    }
}
