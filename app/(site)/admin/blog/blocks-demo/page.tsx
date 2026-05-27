'use client'

import { useState, useRef } from 'react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { BlogBlockRenderer } from '@/components/ui/BlogBlockRenderer'
import type { BlogBlock } from '@/lib/types/blocks'

// ── Sample data for every existing block type ─────────────────────────────────

const EXISTING_BLOCKS: BlogBlock[] = [
    // ── Texto
    { type: 'blog_heading', text: 'Título Principal (H2)', level: 2 },
    { type: 'blog_heading', text: 'Subtítulo (H3)', level: 3 },
    { type: 'blog_paragraph', text: 'Este é um parágrafo de exemplo com **texto em negrito**, *itálico* e [link interno](/blog). O BlogBlockRenderer suporta markdown inline para enriquecer o conteúdo sem precisar de HTML. Use para corpo de texto dos artigos do HallyuHub.' },
    { type: 'blog_quote', text: 'Somos os líderes do novo mundo criativo.', author: 'G-Dragon, entrevista para a Rolling Stone' },
    { type: 'blog_highlight', text: 'Cada geração de K-Pop redefine o que significa ser um artista global.' },
    { type: 'blog_curiosity', text: 'O BTS foi o primeiro grupo de K-Pop a discursar na Assembleia Geral da ONU em 2018. Eles falaram sobre a Geração MZ e a importância de se expressar. O discurso foi assistido por mais de 3 milhões de pessoas ao vivo.' },
    { type: 'blog_callout', variant: 'fact', title: 'Fato Histórico', text: 'O K-Pop se tornou um fenômeno global a partir de 2012 com o PSY e "Gangnam Style", que foi o primeiro vídeo a ultrapassar 1 bilhão de views no YouTube.' },
    { type: 'blog_callout', variant: 'stat', title: 'Em números', text: 'O mercado global de K-Pop foi avaliado em US$ 9,1 bilhões em 2023.' },
    { type: 'blog_callout', variant: 'info', text: 'As vendas de álbuns físicos no K-Pop cresceram 14% em 2023, na contramão da tendência global.' },
    { type: 'blog_callout', variant: 'warning', text: 'Atenção: algumas datas de comeback podem mudar sem aviso prévio pelas agências.' },
    { type: 'blog_alert', variant: 'info', title: 'Informação', text: 'Este artigo foi atualizado com as últimas informações da agência.' },
    { type: 'blog_alert', variant: 'tip', title: 'Dica', text: 'Ative as notificações do canal para não perder nenhum MV novo.' },
    { type: 'blog_alert', variant: 'warning', text: 'Este conteúdo pode conter spoilers da temporada atual.' },
    { type: 'blog_alert', variant: 'spoiler', title: 'Spoiler', text: 'O personagem principal revela sua identidade no episódio 12.' },

    // ── Listas e estrutura
    { type: 'blog_divider' },
    { type: 'blog_list', ordered: false, items: ['aespa estreia com "Black Mamba" — conceito KWANGYA apresentado ao mundo.', 'NewJeans redefine o conceito de naturalidade no K-Pop com "Attention".', 'SEVENTEEN celebra 9 anos com o álbum FML quebrando recordes de pré-venda.'] },
    { type: 'blog_list', ordered: true, items: ['Pesquise o histórico do artista', 'Acompanhe os sns oficiais', 'Participe da fandom local'] },
    { type: 'blog_pros_cons', title: 'aespa — Próximo Comeback', pros: ['Conceito KWANGYA inovador e único', 'Vocais maduros após 4 anos de grupo', 'SM com orçamento alto para produção'], cons: ['Ausência de Giselle por lesão', 'Pressão de superar "Savage"'] },
    { type: 'blog_steps', title: 'Como acompanhar um comeback', steps: [{ title: 'Pré-save o álbum', text: 'Acesse o Spotify e clique em "Salvar" no álbum antes do lançamento para garantir que ele entre no seu radar.' }, { title: 'Assista ao MV no dia do lançamento', text: 'As primeiras 24h são cruciais para os charts. Assista pelo menos 3x sem pausar e sem usar bots.' }, { title: 'Vote nas plataformas', text: 'Apps como Whosfan, Mubeat e Universe aceitam votos para music shows. Acumule pontos antes do comeback.' }] },
    { type: 'blog_timeline', items: [{ year: '2020', title: 'Debut', text: 'aespa debuta com "Black Mamba" pela SM Entertainment.', emoji: '🎤' }, { year: '2021', title: 'Savage', text: 'Mini álbum que consolida o conceito KWANGYA e quebra recordes.', emoji: '🔥' }, { year: '2023', title: 'My World', text: 'Mini álbum 4 com o hit "Spicy" e gira mundial.', emoji: '🌶️' }, { year: '2024', title: 'Armageddon', text: 'Primeiro álbum completo com 14 faixas.', emoji: '🚀' }] },
    { type: 'blog_stats_row', items: [{ label: 'Debut', value: '2020', emoji: '📅' }, { label: 'Agência', value: 'SM Entertainment', emoji: '🏢' }, { label: 'Membros', value: '4', emoji: '👥' }, { label: 'País', value: 'Coreia do Sul', emoji: '🇰🇷' }, { label: 'Fandom', value: 'MY', emoji: '💜' }] },

    // ── Avaliação
    { type: 'blog_rating', score: 9.2, label: 'Armageddon — Full Album', summary: 'Uma masterclass de produção que equilibra pop acessível e conceito artístico denso. O melhor da SM em anos.' },

    // ── Interativos
    { type: 'blog_accordion', title: 'Perguntas Frequentes — aespa', items: [{ question: 'O que significa KWANGYA?', answer: 'KWANGYA é o universo fictício criado pela SM para o lore do aespa. É uma espécie de mundo digital onde existem os ae (avatares) de cada membro. O conceito mistura ficção científica com K-Pop de forma inédita.' }, { question: 'Quem são os membros do aespa?', answer: 'Karina (líder, main dancer), Giselle (rapper), Winter (main vocal) e NingNing (main vocal). O grupo é 100% multinacional: Karina e Winter são coreanas, Giselle é japonesa e NingNing é chinesa.' }, { question: 'Quando foi o debut?', answer: 'Em 17 de novembro de 2020, com o single "Black Mamba" — que ainda é o MV de debut mais assistido de um grupo feminino da SM.' }] },
    { type: 'blog_tabs', tabs: [{ label: '🎵 Discografia', content: 'Savage (2021), Girls (2022), My World (2023), Drama (2023), Armageddon (2024). Cada mini álbum aprofunda o lore do KWANGYA com conceitos visuais únicos e produções de nível internacional.' }, { label: '🏆 Prêmios', content: 'MAMA Awards: Melhor Novo Grupo (2020), Melhor Performance de Dança (2021). Melon Music Awards: Song of the Year indicação (2022). Billboard Music Awards: Top K-Pop Song (2023).' }, { label: '🌍 Impacto', content: 'Primeiro grupo de K-Pop a se apresentar no Coachella em 2023. Parceria com Givenchy e outras marcas de luxo globais. Mais de 10 milhões de ouvintes mensais no Spotify.' }] },
    { type: 'blog_trivia', question: 'Qual foi o primeiro grupo de K-Pop a ganhar um Grammy?', answer: 'Nenhum grupo ganhou até 2024, mas o BTS foi indicado ao Grammy de Melhor Performance de Duo ou Grupo Pop com "Butter" em 2022 — perdendo para Doja Cat ft. SZA.', hint: 'Pense no grupo mais famoso do K-Pop' },
    { type: 'blog_ranking', title: 'Top 5 MVs de K-Pop mais vistos', items: [{ position: 1, name: 'BLACKPINK — "DDU-DU DDU-DU"', description: '2.1 bilhões de views — o MV de grupo feminino mais visto da história.', badge: '👑 Recorde' }, { position: 2, name: 'BTS — "Dynamite"', description: '1.9 bilhões de views — primeiro MV gravado inteiramente em inglês pelo grupo.', badge: '🔥 Viral' }, { position: 3, name: 'BLACKPINK — "Kill This Love"', description: '1.7 bilhões de views — MV lançado em 2019 que ainda domina as paradas.' }, { position: 4, name: 'BTS — "Boy With Luv"', description: '1.6 bilhões de views — feat. Halsey que conquistou o público ocidental.' }, { position: 5, name: 'aespa — "Black Mamba"', description: '650 milhões de views — o MV de debut de grupo feminino mais visto da SM.' }] },

    // ── Mídia
    { type: 'blog_video', url: 'https://www.youtube.com/watch?v=4TWR90KJl84', caption: 'aespa — "Black Mamba" (MV Oficial)' },
    { type: 'blog_spotify', url: 'https://open.spotify.com/track/2d3VRFGUXj5yE3JOiRWN2j', compact: false },

    // ── Cards K-Pop
    { type: 'blog_comeback_card', artist: 'aespa', title: 'Armageddon', date: '2024-05-27', type_label: 'Full Album', imageUrl: '', description: 'Primeiro álbum completo do grupo com 14 faixas, explorando o clímax do lore KWANGYA.' },
    { type: 'blog_member_grid', title: 'Membros do aespa', members: [{ name: 'Karina', role: 'Líder, Main Dancer', note: '카리나 • Coreia do Sul' }, { name: 'Giselle', role: 'Rapper, Dancer', note: '지젤 • Japão' }, { name: 'Winter', role: 'Main Vocal', note: '윈터 • Coreia do Sul' }, { name: 'NingNing', role: 'Main Vocal', note: '닝닝 • China' }] },
    { type: 'blog_setlist', event: 'aespa — SYNK: HYPER LINE World Tour', date: '2024-03-16', venue: 'KSPO Dome, Seul', tracks: [{ number: 1, title: 'Black Mamba', note: 'Abertura' }, { number: 2, title: 'Savage', note: 'Fan favorite' }, { number: 3, title: 'Spicy' }, { number: 4, title: 'Drama' }, { number: 5, title: 'Armageddon', note: 'Encore' }] },
    { type: 'blog_pros_cons', pros: ['Conceito inovador'], cons: ['Hiatos longos'] },

    // ── Produto e comparação
    { type: 'blog_product_card', name: 'aespa — Armageddon (Karina ver.)', imageUrl: '', price: 'R$ 189,90', originalPrice: 'R$ 229,90', badge: 'Importado', rating: 4.8, affiliateUrl: 'https://example.com', cta: 'Ver no site' },
    { type: 'blog_comparison', title: 'aespa vs BLACKPINK — Comparativo', columns: ['aespa', 'BLACKPINK'], rows: [{ label: 'Debut', values: ['2020', '2016'] }, { label: 'Membros', values: ['4', '4'] }, { label: 'Agência', values: ['SM', 'YG'] }, { label: 'Conceito', values: ['Cyberpunk/Lore', 'Fashion/Swag'] }] },
]

const LYRICS_PARALLEL_DEMO = [{
    type: 'blog_lyrics_parallel' as const,
    title: 'Earthquake',
    artist: 'Jisoo',
    lang: 'ko' as const,
    source: 'Genius / tradução HallyuHub',
    sections: [
        {
            label: 'Estrofe 1',
            original: '내 맘이 흔들려\n이유도 없이 떨려\n멈출 수가 없어\n지진처럼 무너져',
            romanized: 'Nae mam-i heundeullyeo\nIyudo eopsi tteollyeo\nMeomchul su ga eopseo\nJijincheoreom muneojyeo',
            translation: 'Meu coração treme\nVibra sem razão\nNão consigo parar\nDesmorono como um terremoto',
        },
        {
            label: 'Refrão',
            original: '심장이 쿵쿵 뛰어\n너 때문에 달려\n어딜 가도 네 생각뿐\n지진처럼',
            romanized: 'Simjangi kungkung twieo\nNeo ttaemune dallyeo\nEodil gado ne saenggakppun\nJijincheoreom',
            translation: 'Meu coração bate forte\nCorre por sua causa\nAonde quer que eu vá, só penso em você\nComo um terremoto',
        },
        {
            label: 'Ponte',
            original: '멈추고 싶어도\n이미 늦어버렸어\n너라는 지진에\n완전히 무너졌어',
            romanized: 'Meomchugo sipeo-do\nImi neujeobeotyeosseo\nNeoraeneun jijine\nWanjeonhi muneojyeosseo',
            translation: 'Mesmo querendo parar\nJá é tarde demais\nNo terremoto que é você\nDesabei completamente',
        },
    ],
}]

// ── New block type mocks (not yet in BlogBlockRenderer) ───────────────────────

function MockVs() {
    const [voted, setVoted] = useState<'a' | 'b' | null>(null)
    const pctA = voted ? 62 : 50
    const pctB = voted ? 38 : 50
    return (
        <div className="my-8 rounded-2xl border border-border overflow-hidden">
            <div className="px-5 py-3 bg-surface/60 border-b border-border text-center">
                <p className="text-[13px] font-bold text-foreground">Quem tem o melhor debut MV?</p>
            </div>
            <div className="grid grid-cols-2">
                {[{ side: 'a' as const, label: 'aespa', sub: 'Black Mamba', emoji: '🖤' }, { side: 'b' as const, label: 'NewJeans', sub: 'Attention', emoji: '🎀' }].map(({ side, label, sub, emoji }) => {
                    const pct = side === 'a' ? pctA : pctB
                    return (
                        <button key={side} onClick={() => !voted && setVoted(side)}
                            className={`flex flex-col items-center gap-3 p-5 transition-colors ${!voted ? 'hover:bg-accent/5' : ''} ${side === 'a' ? 'border-r border-border' : ''}`}>
                            <div className="text-4xl">{emoji}</div>
                            <div className="text-center">
                                <p className="font-black text-[15px] text-foreground">{label}</p>
                                <p className="text-[11px] text-muted">{sub}</p>
                            </div>
                            {voted ? (
                                <div className="w-full">
                                    <div className="h-1.5 rounded-full bg-border overflow-hidden mb-1">
                                        <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className={`text-[13px] font-black ${pct > 50 ? 'text-accent' : 'text-muted'}`}>{pct}%</p>
                                </div>
                            ) : <span className="text-[11px] font-bold text-accent border border-accent/30 rounded-full px-3 py-1">Votar</span>}
                        </button>
                    )
                })}
            </div>
            {!voted && <p className="text-center text-[10px] text-muted py-2 border-t border-border">Clique para votar</p>}
        </div>
    )
}

function MockPoll() {
    const options = ['aespa', 'BLACKPINK', 'NewJeans', 'TWICE', 'IVE']
    const baseVotes = [340, 280, 220, 190, 150]
    const [voted, setVoted] = useState<number | null>(null)
    const votes = voted !== null ? baseVotes.map((v, i) => i === voted ? v + 1 : v) : baseVotes
    const total = votes.reduce((a, b) => a + b, 0)
    return (
        <div className="my-8 border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border bg-surface/40">
                <p className="text-[11px] font-bold text-accent uppercase tracking-wider mb-1">📊 Enquete</p>
                <p className="text-[15px] font-bold text-foreground">Qual é o seu grupo feminino favorito?</p>
            </div>
            <div className="divide-y divide-border">
                {options.map((opt, i) => {
                    const pct = Math.round((votes[i] / total) * 100)
                    return (
                        <button key={i} onClick={() => voted === null && setVoted(i)}
                            className="w-full px-5 py-3.5 text-left relative overflow-hidden hover:bg-surface/40 transition-colors disabled:cursor-default"
                            disabled={voted !== null}>
                            {voted !== null && (
                                <div className="absolute inset-y-0 left-0 bg-accent/8 transition-all duration-500" style={{ width: `${pct}%` }} />
                            )}
                            <div className="relative flex items-center justify-between">
                                <span className={`text-[13px] font-semibold ${voted === i ? 'text-accent' : 'text-foreground'}`}>{opt}</span>
                                {voted !== null && <span className="text-[12px] font-bold text-muted">{pct}%</span>}
                            </div>
                        </button>
                    )
                })}
            </div>
            {voted !== null && <p className="text-[10px] text-muted text-center py-2 border-t border-border">{total} votos</p>}
        </div>
    )
}

function MockLyrics() {
    return (
        <div className="my-8 border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-surface/60 border-b border-border flex items-center justify-between">
                <p className="text-[13px] font-bold text-foreground">🎵 Black Mamba — Trecho</p>
                <span className="text-[10px] text-muted">aespa</span>
            </div>
            <div className="divide-y divide-border">
                {[
                    { original: '나타나 Black Mamba', romanized: 'Natana Black Mamba', translation: 'Apareça, Black Mamba' },
                    { original: '독이 퍼져 Black Mamba', romanized: 'Dogi peojyeo Black Mamba', translation: 'O veneno se espalha, Black Mamba' },
                    { original: '무너져가도 ae와 내가', romanized: 'Muneojyeogado ae wa naega', translation: 'Mesmo que tudo desmorone, eu e meu ae' },
                ].map((line, i) => (
                    <div key={i} className="grid grid-cols-3 gap-0 divide-x divide-border">
                        <div className="px-4 py-3 text-[13px] font-semibold text-foreground">{line.original}</div>
                        <div className="px-4 py-3 text-[12px] text-muted italic">{line.romanized}</div>
                        <div className="px-4 py-3 text-[12px] text-accent">{line.translation}</div>
                    </div>
                ))}
            </div>
            <div className="px-5 py-2 border-t border-border flex justify-between items-center">
                <span className="text-[10px] text-muted">Coreano • Romanização • Português</span>
                <span className="text-[10px] text-muted">Fonte: Genius</span>
            </div>
        </div>
    )
}

function MockEraCard() {
    return (
        <div className="my-8 rounded-2xl border border-border overflow-hidden bg-gradient-to-br from-surface to-background">
            <div className="h-32 relative bg-gradient-to-r from-violet-600 via-pink-500 to-orange-400 flex items-end p-4">
                <div>
                    <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Era</span>
                    <h3 className="text-[24px] font-black text-white leading-none">Savage</h3>
                </div>
                <div className="absolute top-3 right-3 flex gap-1.5">
                    {['#6D28D9', '#EC4899', '#F97316'].map(c => (
                        <div key={c} className="w-5 h-5 rounded-full border-2 border-white/30" style={{ background: c }} />
                    ))}
                </div>
            </div>
            <div className="p-4 space-y-2">
                <div className="flex items-center gap-3 text-[12px] text-muted">
                    <span>📅 Outubro 2021</span>
                    <span className="text-border">•</span>
                    <span>🎨 Dark Academia + Cyberpunk</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {['Savage (타이틀)', 'YEPPI YEPPI', 'Iconic', 'Stereotype', 'Aenergy'].map(t => (
                        <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-400">{t}</span>
                    ))}
                </div>
            </div>
        </div>
    )
}

function MockChartHistory() {
    const entries = [
        { date: 'Jan', position: 45 }, { date: 'Fev', position: 23 }, { date: 'Mar', position: 8 },
        { date: 'Abr', position: 3 }, { date: 'Mai', position: 1 }, { date: 'Jun', position: 5 },
    ]
    const max = 50
    return (
        <div className="my-8 border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-surface/60 border-b border-border flex items-center justify-between">
                <p className="text-[13px] font-bold text-foreground">📈 Histórico — Melon Top 100</p>
                <span className="text-[11px] text-accent font-bold">Savage — aespa</span>
            </div>
            <div className="px-5 py-4">
                <div className="flex items-end gap-2 h-28">
                    {entries.map((e, i) => {
                        const height = ((max - e.position) / max) * 100
                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-foreground">#{e.position}</span>
                                <div className="w-full rounded-t-md bg-accent/20 relative overflow-hidden" style={{ height: `${Math.max(8, height)}%` }}>
                                    <div className="absolute bottom-0 inset-x-0 bg-accent rounded-t-md" style={{ height: '60%' }} />
                                </div>
                                <span className="text-[10px] text-muted">{e.date}</span>
                            </div>
                        )
                    })}
                </div>
                <p className="text-[10px] text-muted mt-2 text-center">Posição #1 em Maio — pico histórico</p>
            </div>
        </div>
    )
}

function MockBeforeAfter() {
    const [position, setPosition] = useState(50)
    const containerRef = useRef<HTMLDivElement>(null)
    const dragging = useRef(false)

    const update = (clientX: number) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        setPosition(Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100)))
    }

    return (
        <div className="my-8 space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">✂️ Karina — Antes e Depois (Conceito Savage → My World)</p>
            <div ref={containerRef}
                className="relative rounded-2xl overflow-hidden border border-border select-none cursor-ew-resize bg-surface"
                style={{ aspectRatio: '16/7' }}
                onMouseDown={() => { dragging.current = true }}
                onMouseMove={e => { if (dragging.current) update(e.clientX) }}
                onMouseUp={() => { dragging.current = false }}
                onTouchMove={e => update(e.touches[0].clientX)}>
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-violet-900/30 to-violet-900/50">
                    <span className="text-white/40 text-[13px] font-bold">Imagem Depois (My World era)</span>
                </div>
                <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-pink-900/40 to-pink-900/60" style={{ width: `${10000 / Math.max(1, position)}%`, maxWidth: 'none' }}>
                        <span className="text-white/40 text-[13px] font-bold whitespace-nowrap">Imagem Antes (Savage era)</span>
                    </div>
                </div>
                <div className="absolute inset-y-0 flex items-center pointer-events-none" style={{ left: `${position}%`, transform: 'translateX(-50%)' }}>
                    <div className="w-0.5 h-full bg-white/70" />
                    <div className="absolute w-8 h-8 rounded-full bg-white shadow-xl flex items-center justify-center text-[11px] font-bold text-gray-700">⇔</div>
                </div>
                <div className="absolute bottom-2 left-2 text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded-full">Antes</div>
                <div className="absolute bottom-2 right-2 text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded-full">Depois</div>
            </div>
            <p className="text-[11px] text-muted text-center">Arraste para comparar • Savage era vs My World era</p>
        </div>
    )
}

function MockFandom() {
    const quotes = [
        { text: 'O "Black Mamba" ao vivo no Coachella foi o momento mais especial da minha vida como MY. Eu chorei do início ao fim.', author: '@aesthetic_myeri', platform: '𝕏' },
        { text: 'Gente a Karina no comeback novo está simplesmente inalcançável. A SM acertou demais com o conceito dessa era.', author: 'u/kpop_brasil_fans', platform: '🔴' },
        { text: 'Assistindo o Armageddon pela 47ª vez e ainda não consigo acreditar que é real. aespa é o grupo da minha vida.', author: '@ningning.daily.br', platform: '📸' },
    ]
    return (
        <div className="my-8 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">💬 Reações dos MYs</p>
            {quotes.map((q, i) => (
                <div key={i} className="border border-border rounded-xl p-4 bg-surface/30">
                    <p className="text-[13px] text-foreground leading-relaxed mb-2">"{q.text}"</p>
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                        <span>{q.platform}</span>
                        <span className="font-medium">{q.author}</span>
                    </div>
                </div>
            ))}
        </div>
    )
}

function MockLightstick() {
    return (
        <div className="my-8 border border-border rounded-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-violet-950 to-pink-950 p-5 flex items-center gap-5">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl border border-white/20">
                    🪄
                </div>
                <div>
                    <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mb-0.5">aespa</p>
                    <p className="text-[20px] font-black text-white">Synk Blade</p>
                    <p className="text-[12px] text-white/60">Lightstick oficial • 2ª geração</p>
                </div>
                <div className="ml-auto flex gap-2">
                    {['#9333EA', '#EC4899', '#FFFFFF'].map(c => (
                        <div key={c} title={c}
                            className="w-6 h-6 rounded-full border-2 border-white/20 shadow-lg"
                            style={{ background: c }} />
                    ))}
                </div>
            </div>
            <div className="px-5 py-4 bg-surface/30">
                <p className="text-[13px] text-muted leading-relaxed">
                    💡 <strong className="text-foreground">Curiosidade:</strong> O Synk Blade foi redesenhado para a era "Armageddon" com LEDs RGB sincronizados via Bluetooth com a arena — o público consegue criar padrões de luz coordenados em tempo real durante os shows.
                </p>
            </div>
        </div>
    )
}

function MockPositions() {
    const members = [
        { name: 'Karina', positions: ['Líder', 'Main Dancer', 'Sub Vocal', 'Visual'], line: 'dance', color: 'bg-pink-400' },
        { name: 'Giselle', positions: ['Rapper', 'Sub Dancer', 'Sub Vocal'], line: 'rap', color: 'bg-yellow-400' },
        { name: 'Winter', positions: ['Main Vocal', 'Sub Dancer', 'Sub Rapper'], line: 'vocal', color: 'bg-blue-400' },
        { name: 'NingNing', positions: ['Main Vocal', 'Sub Dancer'], line: 'vocal', color: 'bg-blue-400' },
    ]
    return (
        <div className="my-8 space-y-3">
            <p className="text-[13px] font-bold text-foreground">🎯 Posições — aespa</p>
            <div className="grid grid-cols-2 gap-3">
                {members.map(m => (
                    <div key={m.name} className="border border-border rounded-xl p-3 bg-surface/30">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-2 h-2 rounded-full ${m.color}`} />
                            <p className="font-bold text-foreground text-[14px]">{m.name}</p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                            {m.positions.map(pos => (
                                <span key={pos} className="text-[10px] px-2 py-0.5 rounded-full bg-background border border-border text-muted font-medium">
                                    {pos}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-3 flex-wrap text-[10px]">
                {[{ color: 'bg-blue-400', label: 'Vocal' }, { color: 'bg-yellow-400', label: 'Rap' }, { color: 'bg-pink-400', label: 'Dance' }, { color: 'bg-purple-400', label: 'Visual' }].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5 text-muted">
                        <span className={`w-2 h-2 rounded-full ${l.color}`} />
                        {l.label}
                    </span>
                ))}
            </div>
        </div>
    )
}

function MockQuiz() {
    const questions = [
        { q: 'Qual é o fandom do aespa?', options: ['BLINK', 'MY', 'ARMY', 'ONCE'], correct: 1 },
        { q: 'Em que ano o aespa debutou?', options: ['2019', '2021', '2020', '2022'], correct: 2 },
        { q: 'Qual membro do aespa é japonesa?', options: ['Karina', 'Winter', 'NingNing', 'Giselle'], correct: 3 },
    ]
    const [current, setCurrent] = useState(0)
    const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
    const [finished, setFinished] = useState(false)

    const answer = (i: number) => {
        if (answers[current] !== null) return
        const next = [...answers]; next[current] = i; setAnswers(next)
        setTimeout(() => {
            if (current + 1 < questions.length) setCurrent(c => c + 1)
            else setFinished(true)
        }, 800)
    }
    const score = answers.filter((a, i) => a === questions[i].correct).length

    return (
        <div className="my-8 border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-surface/60 border-b border-border flex items-center justify-between">
                <p className="text-[13px] font-bold text-foreground">🎯 Quiz — Você conhece o aespa?</p>
                {!finished && <span className="text-[11px] text-muted">{current + 1}/{questions.length}</span>}
            </div>
            {finished ? (
                <div className="p-8 text-center">
                    <p className="text-4xl font-black text-foreground mb-2">{score}/{questions.length}</p>
                    <p className="text-[14px] text-muted mb-4">
                        {score === questions.length ? '🏆 MY raiz! Você sabe tudo!' : score >= 2 ? '🎉 Boa! Quase lá!' : '😅 Precisa estudar mais sobre o aespa!'}
                    </p>
                    <button onClick={() => { setCurrent(0); setAnswers(Array(questions.length).fill(null)); setFinished(false) }}
                        className="px-4 py-2 rounded-lg bg-accent text-white text-[12px] font-bold hover:opacity-90 transition-opacity">
                        Tentar novamente
                    </button>
                </div>
            ) : (
                <div className="p-5">
                    <div className="flex gap-1 mb-4">
                        {questions.map((_, i) => (
                            <div key={i} className={`flex-1 h-1 rounded-full ${i < current ? 'bg-accent' : i === current ? 'bg-accent/40' : 'bg-border'}`} />
                        ))}
                    </div>
                    <p className="text-[15px] font-bold text-foreground mb-4">{questions[current].q}</p>
                    <div className="grid grid-cols-2 gap-2">
                        {questions[current].options.map((opt, i) => {
                            const answered = answers[current] !== null
                            const isCorrect = i === questions[current].correct
                            const isChosen = answers[current] === i
                            return (
                                <button key={i} onClick={() => answer(i)}
                                    className={`px-4 py-3 rounded-xl text-[13px] font-semibold border text-left transition-colors ${
                                        !answered ? 'border-border hover:border-accent hover:bg-accent/5' :
                                        isCorrect ? 'border-green-400 bg-green-500/10 text-green-600' :
                                        isChosen ? 'border-red-400 bg-red-500/10 text-red-600' :
                                        'border-border text-muted'
                                    }`}>
                                    {opt}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

function MockCountdown() {
    const target = new Date('2025-08-15T00:00:00+09:00')
    const now = new Date()
    const diff = Math.max(0, target.getTime() - now.getTime())
    const d = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    const s = Math.floor((diff % 60000) / 1000)

    return (
        <div className="my-8 rounded-2xl overflow-hidden border border-pink-400/30 bg-gradient-to-br from-pink-950/20 to-violet-950/20">
            <div className="px-5 py-4 text-center">
                <p className="text-[11px] font-bold text-accent uppercase tracking-widest mb-1">⏳ Próximo Comeback</p>
                <p className="text-[18px] font-black text-foreground mb-1">aespa — Título do Novo Álbum</p>
                <p className="text-[12px] text-muted mb-5">15 de agosto de 2025 • 00:00 KST</p>
                <div className="flex justify-center gap-3">
                    {[{ v: d, label: 'dias' }, { v: h, label: 'horas' }, { v: m, label: 'min' }, { v: s, label: 'seg' }].map(({ v, label }) => (
                        <div key={label} className="flex flex-col items-center bg-background/60 border border-border rounded-xl px-4 py-3 min-w-[60px]">
                            <span className="text-[28px] font-black text-foreground tabular-nums">{String(v).padStart(2, '0')}</span>
                            <span className="text-[10px] text-muted font-semibold">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function MockDiscographyGrid() {
    const albums = [
        { title: 'Black Mamba', year: '2020', type: 'Single', color: 'from-gray-900 to-black', emoji: '🖤' },
        { title: 'Forever', year: '2020', type: 'Single', color: 'from-blue-900 to-violet-900', emoji: '❄️' },
        { title: 'Next Level', year: '2021', type: 'Single', color: 'from-yellow-900 to-orange-900', emoji: '⚡' },
        { title: 'Savage', year: '2021', type: 'Mini Album', color: 'from-violet-900 to-pink-900', emoji: '🔥' },
        { title: 'Girls', year: '2022', type: 'Mini Album', color: 'from-cyan-900 to-blue-900', emoji: '🌊' },
        { title: 'My World', year: '2023', type: 'Mini Album', color: 'from-pink-900 to-rose-900', emoji: '🌶️' },
        { title: 'Drama', year: '2023', type: 'Single', color: 'from-emerald-900 to-teal-900', emoji: '🎭' },
        { title: 'Armageddon', year: '2024', type: 'Full Album', color: 'from-red-900 to-orange-900', emoji: '💥' },
    ]
    return (
        <div className="my-8 space-y-3">
            <p className="text-[13px] font-bold text-foreground">💿 Discografia — aespa</p>
            <div className="grid grid-cols-4 gap-2">
                {albums.map(a => (
                    <div key={a.title} className="flex flex-col gap-1">
                        <div className={`aspect-square rounded-xl bg-gradient-to-br ${a.color} flex items-center justify-center text-2xl border border-white/5`}>
                            {a.emoji}
                        </div>
                        <p className="text-[11px] font-bold text-foreground leading-tight">{a.title}</p>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted">{a.year}</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted/70">{a.type}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function MockAchievement() {
    const badges = [
        { icon: '👑', title: 'Recorde de Debut', desc: 'MV de debut feminino mais visto da SM Entertainment', color: 'border-yellow-400/30 bg-yellow-500/5' },
        { icon: '🌍', title: 'Coachella 2023', desc: 'Primeiro grupo feminino de K-Pop a se apresentar no festival', color: 'border-pink-400/30 bg-pink-500/5' },
        { icon: '💿', title: '1M em 24h', desc: 'Armageddon vendeu 1 milhão de cópias nas primeiras 24 horas', color: 'border-blue-400/30 bg-blue-500/5' },
        { icon: '🏆', title: 'MAMA Quadruple', desc: '4 prêmios no MAMA Awards 2023 incluindo Album of the Year', color: 'border-accent/30 bg-accent/5' },
    ]
    return (
        <div className="my-8 space-y-3">
            <p className="text-[13px] font-bold text-foreground">🏅 Conquistas — aespa</p>
            <div className="grid grid-cols-2 gap-3">
                {badges.map(b => (
                    <div key={b.title} className={`border rounded-xl p-4 ${b.color}`}>
                        <p className="text-2xl mb-2">{b.icon}</p>
                        <p className="text-[13px] font-bold text-foreground mb-1">{b.title}</p>
                        <p className="text-[11px] text-muted leading-snug">{b.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}

function MockMvBreakdown() {
    const scenes = [
        { time: '0:12', label: 'Abertura', desc: 'Karina aparece no KWANGYA — universo digital do aespa. O cenário todo branco simboliza o vazio antes da criação.' },
        { time: '1:04', label: 'Drop', desc: 'A coreografia explode junto com a batida. O Black Mamba (serpente) representa o vilão Navis tentando destruir a conexão entre ae e idol.' },
        { time: '2:33', label: 'Bridge', desc: 'As quatro ae (avatares digitais) aparecem pela primeira vez, estabelecendo o conceito de dualidade digital do grupo.' },
        { time: '3:15', label: 'Final', desc: 'As membros e seus ae se unem — representando a harmonia entre o mundo real e o KWANGYA. A serpente é derrotada.' },
    ]
    const videoId = '4TWR90KJl84'
    return (
        <div className="my-8 border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-3 bg-surface/60 border-b border-border">
                <p className="text-[13px] font-bold text-foreground">🎬 Análise do MV — Black Mamba</p>
            </div>
            <div className="divide-y divide-border">
                {scenes.map((s, i) => (
                    <div key={i} className="flex gap-4 px-5 py-4 hover:bg-surface/30 transition-colors">
                        <a href={`https://www.youtube.com/watch?v=${videoId}&t=${s.time.replace(':', 'm')}s`}
                            target="_blank" rel="noopener noreferrer"
                            className="shrink-0 font-mono text-[12px] font-bold text-accent border border-accent/30 rounded-lg px-2.5 py-1 hover:bg-accent/10 transition-colors self-start mt-0.5">
                            {s.time}
                        </a>
                        <div>
                            <p className="text-[13px] font-bold text-foreground mb-1">{s.label}</p>
                            <p className="text-[12px] text-muted leading-relaxed">{s.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="px-5 py-3 border-t border-border">
                <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer"
                    className="text-[11px] font-bold text-accent hover:underline">
                    ▶ Assistir ao MV completo
                </a>
            </div>
        </div>
    )
}

function MockFlashcard() {
    const cards = [
        { front: '아이돌', back: 'Aidol — Ídolo', romanized: 'a-i-dol', example: '"그는 내 최고의 아이돌이야" = Ele é meu ídolo favorito' },
        { front: '컴백', back: 'Comeback — Retorno', romanized: 'keom-baek', example: '"아이브 컴백이 언제야?" = Quando é o comeback do IVE?' },
        { front: '팬덤', back: 'Fandom — Comunidade de fãs', romanized: 'paen-deom', example: '"BTS 팬덤 이름은 ARMY야" = O fandom do BTS se chama ARMY' },
    ]
    const [idx, setIdx] = useState(0)
    const [flipped, setFlipped] = useState(false)

    return (
        <div className="my-8 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[13px] font-bold text-foreground">🇰🇷 Aprenda Coreano — K-Pop Vocab</p>
                <span className="text-[11px] text-muted">{idx + 1}/{cards.length}</span>
            </div>
            <div className="cursor-pointer" onClick={() => setFlipped(f => !f)} style={{ perspective: '1000px' }}>
                <div className="relative transition-transform duration-500 rounded-2xl"
                    style={{ transformStyle: 'preserve-3d', transform: flipped ? 'rotateY(180deg)' : 'none', minHeight: '160px' }}>
                    <div className="absolute inset-0 border border-border rounded-2xl bg-surface flex flex-col items-center justify-center p-6 text-center"
                        style={{ backfaceVisibility: 'hidden' }}>
                        <p className="text-4xl font-black text-foreground mb-2">{cards[idx].front}</p>
                        <p className="text-[12px] text-muted">({cards[idx].romanized})</p>
                        <p className="text-[10px] text-muted/60 mt-3">Clique para ver a tradução</p>
                    </div>
                    <div className="absolute inset-0 border border-accent/30 bg-accent/5 rounded-2xl flex flex-col items-center justify-center p-6 text-center"
                        style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                        <p className="text-[18px] font-black text-foreground mb-1">{cards[idx].back}</p>
                        <p className="text-[12px] text-muted italic mt-2 leading-relaxed">{cards[idx].example}</p>
                    </div>
                </div>
            </div>
            <div className="flex justify-center gap-2">
                <button onClick={() => { setIdx(i => Math.max(0, i - 1)); setFlipped(false) }}
                    className="px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-muted hover:text-foreground disabled:opacity-30"
                    disabled={idx === 0}>← Anterior</button>
                <button onClick={() => { setIdx(i => Math.min(cards.length - 1, i + 1)); setFlipped(false) }}
                    className="px-3 py-1.5 rounded-lg border border-border text-[11px] font-semibold text-muted hover:text-foreground disabled:opacity-30"
                    disabled={idx === cards.length - 1}>Próximo →</button>
            </div>
        </div>
    )
}

// ── Section separator ─────────────────────────────────────────────────────────

function Section({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
    return (
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-6 pb-3 border-b border-border">
                <h2 className="text-[18px] font-black text-foreground">{title}</h2>
                {badge && (
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent uppercase tracking-wider">
                        {badge}
                    </span>
                )}
            </div>
            {children}
        </div>
    )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BlocksDemoPage() {
    const [filter, setFilter] = useState<'all' | 'existing' | 'new'>('all')

    return (
        <AdminLayout title="Guia de blocos do Blog" subtitle="Referência visual de todos os tipos de blocos disponíveis no editor">
            <div className="max-w-3xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-[24px] font-black text-foreground mb-1">Guia de blocos do Blog</h1>
                    <p className="text-muted text-[13px]">Referência visual dos blocos disponíveis e ideias em avaliação para artigos do HallyuHub</p>
                    <div className="flex gap-2 mt-4">
                        {[['all', 'Todos', '44'], ['existing', 'Existentes', '29'], ['new', 'Novos', '15']] .map(([v, label, count]) => (
                            <button key={v} onClick={() => setFilter(v as typeof filter)}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold border transition-colors ${
                                    filter === v
                                        ? 'bg-accent text-white border-accent'
                                        : 'border-border text-muted hover:text-foreground hover:bg-surface'
                                }`}>
                                {label} <span className="opacity-60">({count})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {(filter === 'all' || filter === 'existing') && (
                    <>
                        <Section title="Texto" badge="existente">
                            <BlogBlockRenderer blocks={EXISTING_BLOCKS.slice(0, 14)} />
                        </Section>
                        <Section title="Listas e Estrutura" badge="existente">
                            <BlogBlockRenderer blocks={EXISTING_BLOCKS.slice(14, 20)} />
                        </Section>
                        <Section title="Avaliação" badge="existente">
                            <BlogBlockRenderer blocks={EXISTING_BLOCKS.slice(20, 21)} />
                        </Section>
                        <Section title="Interativos" badge="existente">
                            <BlogBlockRenderer blocks={EXISTING_BLOCKS.slice(21, 25)} />
                        </Section>
                        <Section title="Mídia" badge="existente">
                            <BlogBlockRenderer blocks={EXISTING_BLOCKS.slice(25, 27)} />
                        </Section>
                        <Section title="Cards K-Pop" badge="existente">
                            <BlogBlockRenderer blocks={EXISTING_BLOCKS.slice(27, 30)} />
                        </Section>
                        <Section title="Produto e Comparação" badge="existente">
                            <BlogBlockRenderer blocks={EXISTING_BLOCKS.slice(30)} />
                        </Section>
                    </>
                )}

                {(filter === 'all' || filter === 'new') && (
                    <>
                        <Section title="A vs B — Confronto com Votação" badge="novo">
                            <MockVs />
                        </Section>
                        <Section title="Enquete Interativa" badge="novo">
                            <MockPoll />
                        </Section>
                        <Section title="Trecho de Letra (Original + Romanização + Tradução)" badge="novo">
                            <MockLyrics />
                        </Section>
                        <Section title="Letra Lado a Lado (Paralela)" badge="novo">
                            <BlogBlockRenderer blocks={LYRICS_PARALLEL_DEMO} />
                        </Section>
                        <Section title="Card de Era Musical" badge="novo">
                            <MockEraCard />
                        </Section>
                        <Section title="Histórico de Charts" badge="novo">
                            <MockChartHistory />
                        </Section>
                        <Section title="Antes e Depois (Slider)" badge="novo">
                            <MockBeforeAfter />
                        </Section>
                        <Section title="Reações dos Fãs" badge="novo">
                            <MockFandom />
                        </Section>
                        <Section title="Card do Lightstick" badge="novo">
                            <MockLightstick />
                        </Section>
                        <Section title="Posições do Grupo" badge="novo">
                            <MockPositions />
                        </Section>
                        <Section title="Quiz Interativo" badge="novo">
                            <MockQuiz />
                        </Section>
                        <Section title="Countdown de Comeback" badge="novo">
                            <MockCountdown />
                        </Section>
                        <Section title="Grade de Discografia" badge="novo">
                            <MockDiscographyGrid />
                        </Section>
                        <Section title="Conquistas / Recordes" badge="novo">
                            <MockAchievement />
                        </Section>
                        <Section title="Análise de MV com Timestamps" badge="novo">
                            <MockMvBreakdown />
                        </Section>
                        <Section title="Flashcards — Aprenda Coreano" badge="novo">
                            <MockFlashcard />
                        </Section>
                    </>
                )}
            </div>
        </AdminLayout>
    )
}
