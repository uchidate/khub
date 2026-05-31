'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
    Trophy, ChevronRight, CheckCircle2, XCircle,
    Share2, Flame, Zap, BookOpen, ChevronDown, ChevronUp, Medal,
    ArrowRight, RotateCcw, Music, Tv, Globe, Clock, Layers,
    Target, TrendingUp, Sparkles, Play, BarChart3, Star, Users,
} from 'lucide-react'
import { useUmami } from '@/hooks/useUmami'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

type Category = 'k-pop' | 'k-drama' | 'cultura' | 'história'
type Difficulty = 'easy' | 'medium' | 'hard'

interface Question {
    id: string
    question: string
    options: string[]
    correct: number
    explanation: string
    category: Category
    difficulty: Difficulty
    relatedHref?: string | null
    relatedLabel?: string | null
}

interface GlobalStats {
    totalGames: number
    globalAvgPct: number | null
    topScores: Array<{ points: number; score: number; total: number; difficulty: string; date: string; name: string | null }>
    diffBreakdown: Array<{ difficulty: string; games: number; avgScore: number | null; avgPoints: number | null }>
    categoryBreakdown: Array<{ category: string; avgPct: number; totalGames: number }>
    recentAvgPct: number | null
}

interface QuizStats {
    totalGames: number
    totalCorrect: number
    totalQuestions: number
    categoryStats: Record<string, { correct: number; total: number }>
    scores: Array<{ points: number; score: number; total: number; date: string; difficulty: Difficulty }>
}

const EMPTY_STATS: QuizStats = { totalGames: 0, totalCorrect: 0, totalQuestions: 0, categoryStats: {}, scores: [] }

function loadStats(): QuizStats {
    try {
        const s = localStorage.getItem('quiz_stats')
        return s ? JSON.parse(s) : EMPTY_STATS
    } catch { return EMPTY_STATS }
}

function saveStats(stats: QuizStats) {
    try { localStorage.setItem('quiz_stats', JSON.stringify(stats)) } catch { /* ignore */ }
}

function updateStats(stats: QuizStats, questions: Question[], answers: (number | null)[], points: number, difficulty: Difficulty): QuizStats {
    const correct = answers.filter((a, i) => a === questions[i]?.correct).length
    const categoryStats = { ...stats.categoryStats }
    questions.forEach((q, i) => {
        if (!categoryStats[q.category]) categoryStats[q.category] = { correct: 0, total: 0 }
        categoryStats[q.category].total++
        if (answers[i] === q.correct) categoryStats[q.category].correct++
    })
    const newScore = { points, score: correct, total: questions.length, date: new Date().toISOString(), difficulty }
    const scores = [newScore, ...stats.scores].slice(0, 10)
    return {
        totalGames: stats.totalGames + 1,
        totalCorrect: stats.totalCorrect + correct,
        totalQuestions: stats.totalQuestions + questions.length,
        categoryStats,
        scores,
    }
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; Icon: React.FC<{className?: string}> }> = {
    'k-pop':    { label: 'K-Pop',    color: 'text-pink-400',   bg: 'bg-pink-400/10',   Icon: Music },
    'k-drama':  { label: 'K-Drama',  color: 'text-blue-400',   bg: 'bg-blue-400/10',   Icon: Tv },
    'cultura':  { label: 'Cultura',  color: 'text-purple-400', bg: 'bg-purple-400/10', Icon: Globe },
    'história': { label: 'História', color: 'text-amber-400',  bg: 'bg-amber-400/10',  Icon: Clock },
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; time: number; pts: number; color: string }> = {
    easy:   { label: 'Iniciante',     time: 20, pts: 80,  color: 'text-emerald-400' },
    medium: { label: 'Intermediário', time: 15, pts: 100, color: 'text-amber-400'   },
    hard:   { label: 'Expert',        time: 10, pts: 150, color: 'text-red-400'     },
}

const DIFF_BORDER: Record<Difficulty, string> = {
    easy: 'border-emerald-500/40', medium: 'border-amber-500/40', hard: 'border-red-500/40',
}

type CategoryFilter = 'all' | Category
type Screen = 'start' | 'quiz' | 'result'
const QUIZ_SIZE = 15

function getSessionId(): string {
    try {
        let id = localStorage.getItem('quiz_session_id')
        if (!id) { id = crypto.randomUUID(); localStorage.setItem('quiz_session_id', id) }
        return id
    } catch { return 'anon' }
}

async function saveResultToDb(payload: {
    score: number; total: number; points: number; difficulty: string; category: string
    timeHistory: number[]; categoryBreakdown: Record<string, { correct: number; total: number }>
}) {
    try {
        await fetch('/api/quiz/result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, sessionId: getSessionId() }),
        })
    } catch { /* silently fail — localStorage still has the data */ }
}

function getResult(pct: number) {
    if (pct === 1)   return { title: 'Perfeito!',       sub: 'Expert Hallyu',      color: '#f59e0b' }
    if (pct >= 0.8)  return { title: 'Excelente!',      sub: 'Fã dedicado',         color: 'var(--color-accent,#ff246e)' }
    if (pct >= 0.6)  return { title: 'Muito bom!',      sub: 'Bom conhecimento',    color: '#60a5fa' }
    if (pct >= 0.4)  return { title: 'Quase lá!',       sub: 'Continue explorando', color: '#a78bfa' }
    return           { title: 'Continue tentando!', sub: 'Iniciante',           color: '#6b7280' }
}

function Confetti() {
    const colors = ['#ec4899','#a855f7','#f59e0b','#60a5fa','#34d399','#f472b6']
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden>
            {Array.from({ length: 50 }).map((_, i) => (
                <div key={i} style={{
                    position: 'absolute', left: `${(i * 2.1) % 100}%`, top: '-12px',
                    width: i % 3 === 0 ? '9px' : '6px', height: i % 3 === 0 ? '9px' : '14px',
                    borderRadius: i % 4 === 0 ? '50%' : '2px', background: colors[i % colors.length],
                    opacity: 0, animation: `cffall ${1.8 + (i % 5) * 0.3}s ease-in forwards`,
                    animationDelay: `${(i % 6) * 0.1}s`, transform: `rotate(${i * 37}deg)`,
                }} />
            ))}
        </div>
    )
}

// ─── Componentes visuais ──────────────────────────────────────────────────────

function AccuracyBar({ correct, total }: { correct: number; total: number }) {
    if (total === 0) return null
    const pct = (correct / total) * 100
    const color = pct >= 70 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171'
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-border overflow-hidden">
                <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="font-mono text-[11px] font-black shrink-0" style={{ color }}>{Math.round(pct)}%</span>
        </div>
    )
}

function TimeChart({ times, maxTime }: { times: number[]; maxTime: number }) {
    if (times.length === 0) return null
    return (
        <div className="flex items-end gap-0.5 h-10">
            {times.map((t, i) => {
                const pct = maxTime > 0 ? (t / maxTime) * 100 : 0
                const fast = t <= maxTime * 0.4
                return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5" title={`Q${i+1}: ${t}s`}>
                        <div className="w-full min-h-[2px] transition-all"
                            style={{ height: `${Math.max(4, pct)}%`, background: fast ? '#4ade80' : t <= maxTime * 0.7 ? '#fbbf24' : '#f87171' }} />
                    </div>
                )
            })}
        </div>
    )
}

function ScoreTimeline({ answers, questions }: { answers: (number | null)[]; questions: Question[] }) {
    return (
        <div className="flex gap-0.5 flex-wrap">
            {questions.map((q, i) => {
                const a = answers[i]
                if (a === null) return <div key={i} className="w-5 h-5 bg-surface border border-border" />
                const correct = a === q.correct
                const meta = CATEGORY_META[q.category]
                return (
                    <div key={i} title={`Q${i+1}: ${q.category} — ${correct ? 'Certo' : 'Errado'}`}
                        className={`w-5 h-5 flex items-center justify-center border ${correct ? 'border-green-500/30 bg-green-500/20' : 'border-red-500/30 bg-red-500/20'}`}>
                        <meta.Icon className={`w-2.5 h-2.5 ${correct ? 'text-green-400' : 'text-red-400'}`} />
                    </div>
                )
            })}
        </div>
    )
}

function GlobalStatsPanel({ g }: { g: GlobalStats }) {
    if (g.totalGames === 0) return null
    return (
        <div className="border border-border bg-surface p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />Stats globais · todos os jogadores
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                    <p className="text-[24px] font-black tabular-nums">{g.totalGames.toLocaleString()}</p>
                    <p className="text-[10px] text-muted">partidas jogadas</p>
                </div>
                <div className="text-center">
                    <p className="text-[24px] font-black tabular-nums text-accent">{g.globalAvgPct ?? '—'}%</p>
                    <p className="text-[10px] text-muted">taxa de acerto média</p>
                </div>
                <div className="text-center">
                    <p className="text-[24px] font-black tabular-nums text-amber-400">{g.topScores[0]?.points.toLocaleString() ?? '—'}</p>
                    <p className="text-[10px] text-muted">recorde global</p>
                </div>
                <div className="text-center">
                    <p className="text-[24px] font-black tabular-nums">{g.recentAvgPct ?? '—'}%</p>
                    <p className="text-[10px] text-muted">acerto últimos 7 dias</p>
                </div>
            </div>
            {g.categoryBreakdown.length > 0 && (
                <div className="space-y-1.5 pt-3 border-t border-border">
                    <p className="text-[10px] text-muted mb-2">Acerto médio por categoria (todos os jogadores)</p>
                    {g.categoryBreakdown.map(c => {
                        const meta = CATEGORY_META[c.category]
                        if (!meta) return null
                        return (
                            <div key={c.category} className="flex items-center gap-3">
                                <meta.Icon className={`w-3 h-3 shrink-0 ${meta.color}`} />
                                <span className={`text-[11px] font-bold w-16 shrink-0 ${meta.color}`}>{meta.label}</span>
                                <div className="flex-1 h-1.5 bg-border overflow-hidden">
                                    <div className="h-full" style={{ width: `${c.avgPct}%`, background: c.avgPct >= 70 ? '#4ade80' : c.avgPct >= 50 ? '#fbbf24' : '#f87171' }} />
                                </div>
                                <span className="font-mono text-[10px] font-black w-8 text-right">{c.avgPct}%</span>
                                <span className="text-[10px] text-muted w-16 text-right">{c.totalGames} partidas</span>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function GlobalRanking({ topScores }: { topScores: GlobalStats['topScores'] }) {
    if (topScores.length === 0) return null
    return (
        <div className="border border-border bg-surface p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />Ranking global · top 10
            </p>
            <div className="space-y-1.5">
                {topScores.map((s, i) => {
                    const pct = Math.round((s.score / s.total) * 100)
                    const diffCfg = DIFFICULTY_CONFIG[s.difficulty as Difficulty]
                    return (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 border ${i === 0 ? 'border-amber-400/30 bg-amber-400/5' : 'border-border'}`}>
                            <span className={`text-[13px] font-black w-5 tabular-nums shrink-0 ${i === 0 ? 'text-amber-400' : i === 1 ? 'text-zinc-300' : i === 2 ? 'text-amber-600' : 'text-muted'}`}>{i + 1}</span>
                            <span className="font-mono text-[11px] font-black text-amber-400 tabular-nums w-20 shrink-0">{s.points.toLocaleString()} pts</span>
                            <span className="text-[11px] text-muted tabular-nums flex-1">{s.score}/{s.total} · {pct}%</span>
                            {s.name && <span className="text-[11px] text-foreground font-semibold hidden sm:inline truncate max-w-[100px]">{s.name}</span>}
                            <span className={`font-mono text-[9px] font-black shrink-0 ${diffCfg?.color ?? 'text-muted'}`}>{diffCfg?.label ?? s.difficulty}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

function PersonalStats({ stats }: { stats: QuizStats }) {
    if (stats.totalGames === 0) return null
    const avgPct = stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0
    const best = stats.scores[0]
    const bestCat = Object.entries(stats.categoryStats)
        .filter(([, v]) => v.total >= 3)
        .sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total))[0]

    return (
        <div className="border border-border bg-surface p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />Suas estatísticas
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                    <p className="text-[24px] font-black tabular-nums">{stats.totalGames}</p>
                    <p className="text-[10px] text-muted">partidas</p>
                </div>
                <div className="text-center">
                    <p className="text-[24px] font-black tabular-nums text-accent">{avgPct}%</p>
                    <p className="text-[10px] text-muted">taxa de acerto</p>
                </div>
                <div className="text-center">
                    <p className="text-[24px] font-black tabular-nums text-amber-400">{best?.points.toLocaleString() ?? '—'}</p>
                    <p className="text-[10px] text-muted">melhor pts</p>
                </div>
                <div className="text-center">
                    {bestCat ? (
                        <>
                            <p className={`text-[13px] font-black ${CATEGORY_META[bestCat[0]]?.color ?? 'text-foreground'}`}>
                                {CATEGORY_META[bestCat[0]]?.label ?? bestCat[0]}
                            </p>
                            <p className="text-[10px] text-muted">categoria forte</p>
                        </>
                    ) : (
                        <>
                            <p className="text-[13px] font-black text-muted">—</p>
                            <p className="text-[10px] text-muted">categoria forte</p>
                        </>
                    )}
                </div>
            </div>
            <AccuracyBar correct={stats.totalCorrect} total={stats.totalQuestions} />
        </div>
    )
}

function ScoreRanking({ scores }: { scores: QuizStats['scores'] }) {
    if (scores.length === 0) return null
    return (
        <div className="border border-border bg-surface p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />Últimas partidas
            </p>
            <div className="space-y-1.5">
                {scores.slice(0, 5).map((s, i) => {
                    const pct = Math.round((s.score / s.total) * 100)
                    const diffCfg = DIFFICULTY_CONFIG[s.difficulty]
                    return (
                        <div key={i} className={`flex items-center gap-3 px-3 py-2 border ${i === 0 ? 'border-amber-400/30 bg-amber-400/5' : 'border-border'}`}>
                            <span className={`text-[13px] font-black w-5 tabular-nums shrink-0 ${i === 0 ? 'text-amber-400' : 'text-muted'}`}>{i + 1}</span>
                            {i === 0 && <Medal className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                            <span className="font-mono text-[11px] font-black text-amber-400 tabular-nums flex-1">{s.points.toLocaleString()} pts</span>
                            <span className="text-[11px] text-muted tabular-nums">{s.score}/{s.total} · {pct}%</span>
                            <span className={`font-mono text-[9px] font-black ${diffCfg.color}`}>{diffCfg.label}</span>
                            <span className="text-[10px] text-muted hidden sm:inline">
                                {new Date(s.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                            </span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── Start Screen ─────────────────────────────────────────────────────────────

function StartScreen({ onStart, stats, globalStats }: {
    onStart: (cat: CategoryFilter, diff: Difficulty) => void
    stats: QuizStats
    globalStats: GlobalStats | null
}) {
    const [category, setCategory] = useState<CategoryFilter>('all')
    const [difficulty, setDifficulty] = useState<Difficulty>('medium')

    const categories: { value: CategoryFilter; label: string; Icon: React.FC<{className?: string}>; sub: string }[] = [
        { value: 'all',      label: 'Todas',    Icon: Layers, sub: 'K-Pop, Drama, Cultura' },
        { value: 'k-pop',    label: 'K-Pop',    Icon: Music,  sub: 'Grupos e artistas'     },
        { value: 'k-drama',  label: 'K-Drama',  Icon: Tv,     sub: 'Séries e cinema'       },
        { value: 'cultura',  label: 'Cultura',  Icon: Globe,  sub: 'Tradições coreanas'    },
        { value: 'história', label: 'História', Icon: Clock,  sub: 'Passado e presente'    },
    ]

    const difficulties: { value: Difficulty; label: string; desc: string; detail: string }[] = [
        { value: 'easy',   label: 'Iniciante',     desc: '20s por pergunta', detail: '80 pts/acerto'  },
        { value: 'medium', label: 'Intermediário', desc: '15s por pergunta', detail: '100 pts/acerto' },
        { value: 'hard',   label: 'Expert',        desc: '10s por pergunta', detail: '150 pts/acerto' },
    ]

    const bestScore = stats.scores[0]?.points ?? null

    return (
        <div className="page-wrap py-8">
            <style>{`@keyframes cffall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }`}</style>

            <Breadcrumbs items={[{ label: 'Quiz' }]} className="mb-6" />

            <div className="border-b-2 border-foreground pb-5 mb-8 flex items-end justify-between gap-4 flex-wrap">
                <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent mb-2">Quiz Hallyu</p>
                    <h1 className="text-[32px] sm:text-[40px] font-black leading-[0.94] tracking-[-0.04em]">
                        Quanto você sabe<br />sobre a Coreia?
                    </h1>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-muted pb-1">
                    <span>{QUIZ_SIZE} perguntas</span>
                    <span className="w-px h-3 bg-border hidden sm:block" />
                    <span>Timer por questão</span>
                    <span className="w-px h-3 bg-border hidden sm:block" />
                    <span>Pontos por velocidade</span>
                    {bestScore !== null && (
                        <>
                            <span className="w-px h-3 bg-border hidden sm:block" />
                            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
                                <Medal className="w-3.5 h-3.5" />Recorde: {bestScore.toLocaleString()} pts
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Stats globais */}
            {globalStats && globalStats.totalGames > 0 && (
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                    <GlobalStatsPanel g={globalStats} />
                    <GlobalRanking topScores={globalStats.topScores} />
                </div>
            )}

            {/* Stats pessoais + ranking */}
            {stats.totalGames > 0 && (
                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    <PersonalStats stats={stats} />
                    <ScoreRanking scores={stats.scores} />
                </div>
            )}

            {/* Categorias — preview stats */}
            {stats.totalGames > 0 && Object.keys(stats.categoryStats).length > 0 && (
                <div className="mb-8">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5" />Desempenho por categoria
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {Object.entries(CATEGORY_META).filter(([k]) => stats.categoryStats[k]).map(([key, meta]) => {
                            const cs = stats.categoryStats[key]
                            if (!cs) return null
                            const pct = Math.round((cs.correct / cs.total) * 100)
                            return (
                                <div key={key} className="border border-border bg-surface px-4 py-3">
                                    <div className="flex items-center gap-2 mb-2">
                                        <meta.Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                                        <span className={`text-[11px] font-black ${meta.color}`}>{meta.label}</span>
                                    </div>
                                    <p className="text-[22px] font-black tabular-nums mb-1">{pct}%</p>
                                    <AccuracyBar correct={cs.correct} total={cs.total} />
                                    <p className="text-[10px] text-muted mt-1">{cs.correct}/{cs.total} acertos</p>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            <div className="grid sm:grid-cols-2 gap-8 mb-8">
                {/* Categoria */}
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3 flex items-center gap-1.5">
                        <span className="w-3 h-px bg-muted inline-block" />Categoria
                    </p>
                    <div className="flex flex-col gap-1.5">
                        {categories.map(c => {
                            const active = category === c.value
                            const cs = c.value !== 'all' ? stats.categoryStats[c.value] : null
                            const catPct = cs ? Math.round((cs.correct / cs.total) * 100) : null
                            return (
                                <button key={c.value} onClick={() => setCategory(c.value)}
                                    className={`flex items-center gap-3 px-4 py-3 border text-left transition-all ${active ? 'border-accent bg-accent/8' : 'border-border bg-background text-muted hover:border-border/80 hover:text-foreground'}`}>
                                    <c.Icon className={`w-4 h-4 shrink-0 ${active ? 'text-accent' : 'text-muted'}`} />
                                    <div className="flex-1">
                                        <span className={`text-[13px] font-bold ${active ? 'text-accent' : ''}`}>{c.label}</span>
                                        <span className="text-[11px] text-muted ml-2">{c.sub}</span>
                                    </div>
                                    {catPct !== null && (
                                        <span className={`font-mono text-[10px] font-black ${catPct >= 70 ? 'text-green-400' : catPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{catPct}%</span>
                                    )}
                                    {active && <span className="w-1.5 h-1.5 bg-accent shrink-0" />}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Dificuldade + preview */}
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3 flex items-center gap-1.5">
                        <span className="w-3 h-px bg-muted inline-block" />Dificuldade
                    </p>
                    <div className="flex flex-col gap-1.5 mb-5">
                        {difficulties.map(d => {
                            const active = difficulty === d.value
                            const cfg = DIFFICULTY_CONFIG[d.value]
                            return (
                                <button key={d.value} onClick={() => setDifficulty(d.value)}
                                    className={`flex items-center gap-3 px-4 py-3 border text-left transition-all ${active ? `${DIFF_BORDER[d.value]} bg-surface` : 'border-border bg-background text-muted hover:border-border/80 hover:text-foreground'}`}>
                                    <TrendingUp className={`w-4 h-4 shrink-0 ${active ? cfg.color : 'text-muted'}`} />
                                    <div className="flex-1">
                                        <span className={`text-[13px] font-bold ${active ? cfg.color : ''}`}>{d.label}</span>
                                        <span className="text-[11px] text-muted ml-2">{d.desc}</span>
                                    </div>
                                    <span className={`font-mono text-[10px] font-black ${active ? cfg.color : 'text-muted'}`}>{d.detail}</span>
                                </button>
                            )
                        })}
                    </div>

                    <div className="border border-border bg-surface px-4 py-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3">Esta partida</p>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-[22px] font-black tabular-nums">{QUIZ_SIZE}</p>
                                <p className="text-[10px] text-muted">perguntas</p>
                            </div>
                            <div>
                                <p className={`text-[22px] font-black tabular-nums ${DIFFICULTY_CONFIG[difficulty].color}`}>{DIFFICULTY_CONFIG[difficulty].time}s</p>
                                <p className="text-[10px] text-muted">por questão</p>
                            </div>
                            <div>
                                <p className="text-[22px] font-black tabular-nums text-amber-400">{DIFFICULTY_CONFIG[difficulty].pts * QUIZ_SIZE}</p>
                                <p className="text-[10px] text-muted">pts máx</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={() => onStart(category, difficulty)}
                className="w-full flex items-center justify-center gap-3 py-4 bg-accent text-white font-black text-[15px] hover:opacity-90 active:scale-[0.99] transition-all">
                <Play className="w-5 h-5 fill-current" />
                Começar o Quiz
                <ArrowRight className="w-5 h-5" />
            </button>
        </div>
    )
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({ questions, answers, points, timeHistory, maxTime, onReset }: {
    questions: Question[]
    answers: (number | null)[]
    points: number
    timeHistory: number[]
    maxTime: number
    onReset: () => void
}) {
    const [showReview, setShowReview] = useState(false)

    const score   = answers.filter((a, i) => a === questions[i]?.correct).length
    const pct     = score / questions.length
    const result  = getResult(pct)
    const perfect = score === questions.length


    const scoreByCategory = useMemo(() => {
        const map: Record<string, { correct: number; total: number }> = {}
        questions.forEach((qu, i) => {
            if (!map[qu.category]) map[qu.category] = { correct: 0, total: 0 }
            map[qu.category].total++
            if (answers[i] === qu.correct) map[qu.category].correct++
        })
        return map
    }, [questions, answers])

    const relatedContent = useMemo(() =>
        questions.filter((qu, i) => answers[i] !== qu.correct && qu.relatedHref)
            .slice(0, 3).map(qu => ({ href: qu.relatedHref!, label: qu.relatedLabel! }))
    , [questions, answers])

    const wrongAnswers = questions.filter((_, i) => answers[i] !== questions[i].correct)

    const avgTime = timeHistory.length > 0 ? (timeHistory.reduce((a, b) => a + b, 0) / timeHistory.length).toFixed(1) : '—'
    const fastAnswers = timeHistory.filter(t => t <= maxTime * 0.4).length

    const shareText = `Fiz o Quiz Hallyu no HallyuHub! Acertei ${score}/${questions.length} e fiz ${points.toLocaleString()} pts — tente você também!`
    const shareUrl  = typeof window !== 'undefined' ? window.location.href : 'https://www.hallyuhub.com.br/quiz'

    const handleShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: 'Quiz Hallyu', text: shareText, url: shareUrl }); return }
            catch { /* fallback */ }
        }
        navigator.clipboard?.writeText(`${shareText} ${shareUrl}`)
    }

    const radius = 54
    const circ   = 2 * Math.PI * radius
    const dash   = circ * pct

    return (
        <>
            {perfect && <Confetti />}
            <style>{`
                @keyframes cffall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
                @keyframes drawin { from{stroke-dashoffset:${circ}} to{stroke-dashoffset:${circ - dash}} }
            `}</style>

            <div className="page-wrap py-8">
                <Breadcrumbs items={[{ label: 'Quiz', href: '/quiz' }, { label: 'Resultado' }]} className="mb-6" />

                <div className="border-b-2 border-foreground pb-5 mb-8">
                    <h1 className="text-[28px] font-black leading-tight tracking-[-0.03em]">
                        {result.title} <span className="text-muted font-medium text-[18px]">{result.sub}</span>
                    </h1>
                </div>

                {/* Row 1: score + categoria */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="border border-border bg-surface p-6 flex flex-col items-center justify-center text-center">
                        <div className="relative inline-flex items-center justify-center mb-4">
                            <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                                <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="10" stroke="var(--color-border)" />
                                <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="10"
                                    stroke={result.color} strokeLinecap="round"
                                    strokeDasharray={circ} strokeDashoffset={circ - dash}
                                    style={{ animation: 'drawin 1s ease 0.3s both', strokeDashoffset: circ - dash }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-4xl font-black tabular-nums">{score}</span>
                                <span className="text-sm text-muted font-semibold">de {questions.length}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 border border-amber-400/20 bg-amber-400/8 px-5 py-2 mb-3">
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span className="text-base font-black text-amber-400">{points.toLocaleString()} pts</span>
                        </div>
                        <div className="w-full mt-2">
                            <AccuracyBar correct={score} total={questions.length} />
                        </div>
                    </div>

                    <div className="border border-border bg-surface p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4 flex items-center gap-1.5">
                            <BarChart3 className="w-3.5 h-3.5" />Por categoria
                        </p>
                        <div className="space-y-4">
                            {Object.entries(scoreByCategory).map(([cat, { correct, total }]) => {
                                const meta = CATEGORY_META[cat]
                                const pctCat = correct / total
                                return (
                                    <div key={cat}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <meta.Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                                                <span className={`text-xs font-bold ${meta.color}`}>{meta.label}</span>
                                            </div>
                                            <span className="text-xs font-bold tabular-nums">{correct}/{total}</span>
                                        </div>
                                        <div className="h-1.5 bg-border">
                                            <div className="h-full transition-all duration-700" style={{ width: `${pctCat * 100}%`, background: result.color }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        {relatedContent.length > 0 && (
                            <div className="mt-5 pt-4 border-t border-border">
                                <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2.5 flex items-center gap-1.5">
                                    <BookOpen className="w-3.5 h-3.5" />Leitura recomendada
                                </p>
                                <div className="space-y-2">
                                    {relatedContent.map((item, i) => (
                                        <Link key={i} href={item.href} className="flex items-center gap-2 text-sm text-muted hover:text-accent transition-colors group">
                                            <ChevronRight className="w-3.5 h-3.5 shrink-0 group-hover:text-accent" />
                                            <span className="line-clamp-1">{item.label}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Row 2: timeline de respostas + tempo */}
                <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div className="border border-border bg-surface p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3">Mapa de respostas</p>
                        <ScoreTimeline answers={answers} questions={questions} />
                        <p className="text-[10px] text-muted mt-2">cada bloco = 1 pergunta · ícone = categoria</p>
                    </div>
                    <div className="border border-border bg-surface p-4">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />Tempo por pergunta
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-muted">
                                <span>média <span className="font-black text-foreground">{avgTime}s</span></span>
                                <span>rápidas <span className="font-black text-green-400">{fastAnswers}</span></span>
                            </div>
                        </div>
                        <TimeChart times={timeHistory} maxTime={maxTime} />
                        <div className="flex items-center gap-3 mt-2 text-[9px] text-muted">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-400 inline-block" />rápido (≤40%)</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 inline-block" />médio</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 bg-red-400 inline-block" />lento</span>
                        </div>
                    </div>
                </div>

                {/* Revisar erros */}
                {wrongAnswers.length > 0 && (
                    <div className="border border-border mb-4 overflow-hidden">
                        <button onClick={() => setShowReview(v => !v)}
                            className="w-full flex items-center justify-between px-4 py-3.5 bg-surface hover:bg-surface-hover transition-colors">
                            <div className="flex items-center gap-2.5">
                                <XCircle className="w-4 h-4 text-red-400" />
                                <span className="text-sm font-bold">Revisar {wrongAnswers.length} {wrongAnswers.length === 1 ? 'erro' : 'erros'}</span>
                            </div>
                            {showReview ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                        </button>
                        {showReview && (
                            <div className="p-4 bg-surface grid sm:grid-cols-2 gap-3">
                                {wrongAnswers.map(q => {
                                    const origIdx = questions.indexOf(q)
                                    const userAnswer = answers[origIdx]
                                    const meta = CATEGORY_META[q.category]
                                    return (
                                        <div key={q.id} className="border border-border p-4 bg-background">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <meta.Icon className={`w-3 h-3 ${meta.color}`} />
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                                            </div>
                                            <p className="text-sm font-bold leading-snug mb-3">{q.question}</p>
                                            {userAnswer !== null && userAnswer >= 0 && (
                                                <p className="text-xs text-red-400 mb-1 flex items-center gap-1.5">
                                                    <XCircle className="w-3.5 h-3.5 shrink-0" />{q.options[userAnswer]}
                                                </p>
                                            )}
                                            {userAnswer === -1 && (
                                                <p className="text-xs text-red-400 mb-1 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 shrink-0" />Tempo esgotado
                                                </p>
                                            )}
                                            <p className="text-xs text-green-400 mb-2 flex items-center gap-1.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />{q.options[q.correct]}
                                            </p>
                                            <p className="text-xs text-muted leading-relaxed">{q.explanation}</p>
                                            {q.relatedHref && (
                                                <Link href={q.relatedHref} className="inline-flex items-center gap-1 text-xs text-accent font-bold mt-2 hover:underline">
                                                    <BookOpen className="w-3 h-3" />{q.relatedLabel}
                                                </Link>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div className="grid sm:grid-cols-4 gap-2">
                    <button onClick={onReset} className="flex items-center justify-center gap-2 py-3.5 border border-border bg-surface font-bold hover:bg-surface-hover transition-all">
                        <RotateCcw className="w-4 h-4" />Jogar de novo
                    </button>
                    <button onClick={handleShare} className="flex items-center justify-center gap-2 py-3.5 border border-accent/30 bg-accent/8 text-accent font-bold hover:bg-accent/15 transition-all">
                        <Share2 className="w-4 h-4" />Compartilhar
                    </button>
                    <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank')}
                        className="flex items-center justify-center gap-2 py-3.5 border border-[#25D366]/30 bg-[#25D366]/8 text-[#25D366] font-bold hover:bg-[#25D366]/15 transition-all">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        WhatsApp
                    </button>
                    <Link href="/blog" className="flex items-center justify-center gap-2 py-3.5 bg-accent text-white font-bold hover:opacity-90 transition-all">
                        <Sparkles className="w-4 h-4" />Ver artigos
                    </Link>
                </div>
            </div>
        </>
    )
}

// ─── Main Quiz ────────────────────────────────────────────────────────────────

export function QuizClient() {
    const [screen,          setScreen]          = useState<Screen>('start')
    const [questions,       setQuestions]        = useState<Question[]>([])
    const [difficulty,      setDifficulty]       = useState<Difficulty>('medium')
    const [current,         setCurrent]          = useState(0)
    const [selected,        setSelected]         = useState<number | null>(null)
    const [answers,         setAnswers]          = useState<(number | null)[]>([])
    const [showExplanation, setShowExplanation]  = useState(false)
    const [animating,       setAnimating]        = useState(false)
    const [timeLeft,        setTimeLeft]         = useState(15)
    const [streak,          setStreak]           = useState(0)
    const [points,          setPoints]           = useState(0)
    const [showStreak,      setShowStreak]       = useState(false)
    const [feedbackAnim,    setFeedbackAnim]     = useState<'correct' | 'wrong' | null>(null)
    const [quizStats,       setQuizStats]        = useState<QuizStats>(EMPTY_STATS)
    const [globalStats,     setGlobalStats]      = useState<GlobalStats | null>(null)
    const [timeHistory,     setTimeHistory]      = useState<number[]>([])
    const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null)
    const startTracked = useRef(false)
    const timeStartRef = useRef<number>(Date.now())

    const { trackQuizStart, trackQuizAnswer, trackQuizComplete } = useUmami()

    useEffect(() => {
        setQuizStats(loadStats())
        fetch('/api/quiz/stats').then(r => r.json()).then(setGlobalStats).catch(() => {})
    }, [])

    const timePerQuestion = DIFFICULTY_CONFIG[difficulty].time
    const basePoints      = DIFFICULTY_CONFIG[difficulty].pts
    const q               = questions[current]

    const stopTimer = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }, [])

    const handleStart = useCallback(async (cat: CategoryFilter, diff: Difficulty) => {
        setScreen('quiz')
        setDifficulty(diff)
        setQuestions([])
        setCurrent(0)
        setSelected(null)
        setAnswers([])
        setShowExplanation(false)
        setTimeLeft(DIFFICULTY_CONFIG[diff].time)
        setStreak(0)
        setPoints(0)
        setTimeHistory([])
        startTracked.current = false

        try {
            const params = new URLSearchParams({ category: cat, difficulty: diff, limit: String(QUIZ_SIZE) })
            const res = await fetch(`/api/quiz/questions?${params}`)
            const data: Question[] = await res.json()
            setQuestions(data)
            setAnswers(Array(data.length).fill(null))
        } catch {
            setScreen('start')
        }
    }, [])

    const handleSelect = useCallback((idx: number) => {
        if (selected !== null) return
        stopTimer()

        const elapsed = timePerQuestion - timeLeft
        setTimeHistory(prev => [...prev, elapsed])

        setSelected(idx)
        setShowExplanation(true)

        const newAnswers = [...answers]
        newAnswers[current] = idx
        setAnswers(newAnswers)

        if (!startTracked.current) { startTracked.current = true; trackQuizStart() }

        const isCorrect = idx === questions[current].correct
        trackQuizAnswer(isCorrect, current)

        if (isCorrect) {
            const bonus     = Math.floor(timeLeft * 3)
            const newStreak = streak + 1
            setStreak(newStreak)
            setPoints(p => p + basePoints + bonus)
            if (newStreak >= 2) { setShowStreak(true); setTimeout(() => setShowStreak(false), 1500) }
            setFeedbackAnim('correct')
        } else {
            setStreak(0)
            setFeedbackAnim('wrong')
        }
        setTimeout(() => setFeedbackAnim(null), 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, answers, current, questions, timeLeft, streak, stopTimer, basePoints, timePerQuestion])

    useEffect(() => {
        if (screen !== 'quiz' || selected !== null || !q) return
        setTimeLeft(timePerQuestion)
        timeStartRef.current = Date.now()
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current!)
                    setTimeHistory(prev => [...prev, timePerQuestion])
                    setSelected(-1)
                    setShowExplanation(true)
                    setAnswers(prev => { const n = [...prev]; n[current] = -1; return n })
                    setStreak(0)
                    setFeedbackAnim('wrong')
                    setTimeout(() => setFeedbackAnim(null), 500)
                    return 0
                }
                return t - 1
            })
        }, 1000)
        return stopTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, screen, q])

    const handleNext = useCallback(() => {
        stopTimer()
        setAnimating(true)
        setTimeout(() => {
            if (current < questions.length - 1) {
                setCurrent(c => c + 1)
                setSelected(null)
                setShowExplanation(false)
            } else {
                const score = answers.filter((a, i) => a === questions[i]?.correct).length
                trackQuizComplete(score, questions.length)

                // categoryBreakdown para o DB
                const catBreakdown: Record<string, { correct: number; total: number }> = {}
                questions.forEach((q, i) => {
                    if (!catBreakdown[q.category]) catBreakdown[q.category] = { correct: 0, total: 0 }
                    catBreakdown[q.category].total++
                    if (answers[i] === q.correct) catBreakdown[q.category].correct++
                })

                saveResultToDb({ score, total: questions.length, points, difficulty, category: 'all', timeHistory, categoryBreakdown: catBreakdown })

                setQuizStats(prev => {
                    const updated = updateStats(prev, questions, answers, points, difficulty)
                    saveStats(updated)
                    return updated
                })
                // Refresh global stats após salvar
                fetch('/api/quiz/stats').then(r => r.json()).then(setGlobalStats).catch(() => {})
                setScreen('result')
            }
            setAnimating(false)
        }, 180)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, questions.length, answers, points, stopTimer, difficulty])

    useEffect(() => {
        if (screen !== 'quiz') return
        const handler = (e: KeyboardEvent) => {
            if (selected === null) {
                if (['1','2','3','4'].includes(e.key))               handleSelect(parseInt(e.key) - 1)
                if (['a','b','c','d'].includes(e.key.toLowerCase())) handleSelect(e.key.toLowerCase().charCodeAt(0) - 97)
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleNext()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [screen, selected, handleSelect, handleNext])

    if (screen === 'start')  return <StartScreen onStart={handleStart} stats={quizStats} globalStats={globalStats} />
    if (screen === 'result') return (
        <ResultScreen questions={questions} answers={answers} points={points}
            timeHistory={timeHistory} maxTime={timePerQuestion}
            onReset={() => setScreen('start')} />
    )

    if (!q) return (
        <div className="page-wrap py-20 flex flex-col items-center gap-3 text-muted">
            <div className="w-8 h-8 border-2 border-accent border-t-transparent animate-spin" />
            <p className="text-sm">Carregando perguntas…</p>
        </div>
    )

    const score       = answers.filter((a, i) => a === questions[i]?.correct).length
    const timerPct    = (timeLeft / timePerQuestion) * 100
    const timerUrgent = timeLeft <= Math.ceil(timePerQuestion * 0.25)
    const timerColor  = timerUrgent ? '#f87171' : timeLeft <= Math.ceil(timePerQuestion * 0.5) ? '#fbbf24' : 'var(--color-accent,#ff246e)'
    const catMeta     = CATEGORY_META[q.category]
    const diffCfg     = DIFFICULTY_CONFIG[difficulty]
    const livePct     = (current + (selected !== null ? 1 : 0)) > 0 ? Math.round((score / (current + (selected !== null ? 1 : 0))) * 100) : null

    return (
        <div className="page-wrap py-6 pb-28 sm:pb-10">
            <style>{`
                @keyframes shakex  { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
                @keyframes popin   { 0%{transform:scale(1)} 45%{transform:scale(1.015)} 100%{transform:scale(1)} }
                @keyframes slidein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            {showStreak && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-500 text-white text-sm font-black px-5 py-2.5 shadow-xl">
                    <Flame className="w-4 h-4" />{streak}× em sequência!
                </div>
            )}

            <div className="sm:flex sm:gap-6 sm:items-start">

                {/* Coluna principal */}
                <div className="min-w-0 flex-1" style={{
                    opacity: animating ? 0 : 1,
                    transform: animating ? 'translateY(5px)' : 'translateY(0)',
                    transition: 'opacity 0.18s, transform 0.18s',
                    animation: feedbackAnim === 'wrong'   ? 'shakex 0.4s ease'
                             : feedbackAnim === 'correct' ? 'popin 0.28s ease'
                             : 'none',
                }}>
                    {/* Timer + progresso */}
                    <div className="mb-4">
                        <div className="h-1 bg-surface overflow-hidden mb-1.5">
                            <div className="h-full transition-all duration-1000" style={{ width: `${timerPct}%`, background: timerColor }} />
                        </div>
                        <div className="flex gap-0.5">
                            {questions.map((_, i) => (
                                <div key={i} className={`flex-1 h-0.5 transition-all duration-300 ${
                                    i < current
                                        ? answers[i] === questions[i].correct ? 'bg-green-400' : 'bg-red-400/60'
                                        : i === current ? '' : 'bg-surface'
                                }`} style={i === current ? { background: timerColor } : {}} />
                            ))}
                        </div>
                    </div>

                    {/* Pergunta */}
                    <div className="border border-border bg-surface p-5 mb-4">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-2.5">
                                    <catMeta.Icon className={`w-3.5 h-3.5 ${catMeta.color}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${catMeta.color}`}>{catMeta.label}</span>
                                    <span className="text-[11px] text-muted">· {current + 1} / {questions.length}</span>
                                </div>
                                <p className="text-[17px] sm:text-[19px] font-bold leading-snug">{q.question}</p>
                            </div>
                            <div className="shrink-0 relative w-14 h-14">
                                <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                                    <circle cx="28" cy="28" r="22" fill="none" strokeWidth="3.5" stroke="var(--color-border)" />
                                    <circle cx="28" cy="28" r="22" fill="none" strokeWidth="3.5"
                                        stroke={timerColor} strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 22}
                                        strokeDashoffset={(1 - timerPct / 100) * 2 * Math.PI * 22}
                                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s' }}
                                    />
                                </svg>
                                <span className={`absolute inset-0 flex items-center justify-center text-base font-black tabular-nums ${timerUrgent ? 'text-red-400' : ''}`}>
                                    {timeLeft}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {q.options.map((opt, idx) => {
                                const isCorrect  = idx === q.correct
                                const isSelected = idx === selected
                                let optCls: string
                                let iconEl: React.ReactNode = null

                                if (selected === null) {
                                    optCls = 'border-border bg-background hover:border-accent/40 hover:bg-accent/5 cursor-pointer'
                                } else if (isCorrect) {
                                    optCls = 'border-green-500/40 bg-green-500/8 text-green-200 cursor-default'
                                    iconEl = <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                                } else if (isSelected) {
                                    optCls = 'border-red-500/40 bg-red-500/8 text-red-200 cursor-default'
                                    iconEl = <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                                } else {
                                    optCls = 'border-border bg-background text-muted opacity-30 cursor-default'
                                }

                                return (
                                    <button key={idx} onClick={() => handleSelect(idx)} disabled={selected !== null}
                                        className={`w-full text-left px-4 py-3 border font-medium transition-all flex items-center gap-3 active:scale-[0.99] ${optCls}`}>
                                        <span className={`w-6 h-6 flex items-center justify-center text-[10px] font-black shrink-0 border ${
                                            selected === null ? 'border-border text-muted bg-surface' :
                                            isCorrect ? 'border-green-500/40 text-green-300 bg-green-500/10' :
                                            isSelected ? 'border-red-500/40 text-red-300 bg-red-500/10' :
                                            'border-border text-muted bg-surface'
                                        }`}>{String.fromCharCode(65 + idx)}</span>
                                        <span className="flex-1 leading-snug text-sm sm:text-[15px]">{opt}</span>
                                        {iconEl}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Explicacao */}
                    {showExplanation && (
                        <div className={`border p-4 mb-4 ${selected === q.correct ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}
                            style={{ animation: 'slidein 0.2s ease both' }}>
                            <p className={`text-sm font-black mb-1.5 ${selected === q.correct ? 'text-green-400' : 'text-red-400'}`}>
                                {selected === -1 ? 'Tempo esgotado' : selected === q.correct ? (streak >= 3 ? 'Em chamas!' : streak >= 2 ? 'Sequência!' : 'Correto!') : 'Incorreto'}
                            </p>
                            <p className="text-sm text-muted leading-relaxed mb-2">{q.explanation}</p>
                            {q.relatedHref && (
                                <Link href={q.relatedHref} className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline">
                                    <BookOpen className="w-3.5 h-3.5" />{q.relatedLabel}
                                </Link>
                            )}
                            <p className="text-[11px] text-muted/40 mt-2 hidden sm:block">Enter ou Espaço para continuar</p>
                        </div>
                    )}

                    {selected !== null && (
                        <div className="fixed bottom-[70px] sm:bottom-auto sm:static left-0 right-0 px-4 sm:px-0 pb-3 sm:pb-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none border-t border-border/30 sm:border-0 pt-3 sm:pt-0 z-30">
                            <button onClick={handleNext}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-accent text-white font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all">
                                {current < questions.length - 1
                                    ? <><ChevronRight className="w-4 h-4" />Próxima pergunta</>
                                    : <><Trophy className="w-4 h-4" />Ver resultado</>
                                }
                            </button>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="hidden sm:flex flex-col gap-4 w-[280px] shrink-0">

                    <div className="border border-border bg-surface p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-4">Placar</p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-[13px] text-muted"><Target className="w-3.5 h-3.5" />Acertos</span>
                                <span className="text-sm font-black tabular-nums">{score} / {current + (selected !== null ? 1 : 0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-[13px] text-muted"><Zap className="w-3.5 h-3.5" />Pontos</span>
                                <span className="text-sm font-black text-amber-400 tabular-nums">{points.toLocaleString()}</span>
                            </div>
                            {streak >= 2 && (
                                <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-2 text-[13px] text-muted"><Flame className="w-3.5 h-3.5" />Sequência</span>
                                    <span className="text-sm font-black text-orange-400">{streak}×</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="flex items-center gap-2 text-[13px] text-muted"><TrendingUp className="w-3.5 h-3.5" />Nível</span>
                                <span className={`text-sm font-black ${diffCfg.color}`}>{diffCfg.label}</span>
                            </div>
                        </div>
                        {/* Barra de acerto ao vivo */}
                        {livePct !== null && (
                            <div className="mt-4 pt-3 border-t border-border">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] text-muted">Taxa de acerto</span>
                                </div>
                                <AccuracyBar correct={score} total={current + (selected !== null ? 1 : 0)} />
                            </div>
                        )}
                    </div>

                    {/* Historico de tempo desta partida */}
                    {timeHistory.length > 0 && (
                        <div className="border border-border bg-surface p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />Tempo usado
                            </p>
                            <TimeChart times={timeHistory} maxTime={timePerQuestion} />
                            <p className="text-[10px] text-muted mt-1">
                                média: <span className="font-black text-foreground">
                                    {(timeHistory.reduce((a, b) => a + b, 0) / timeHistory.length).toFixed(1)}s
                                </span>
                            </p>
                        </div>
                    )}

                    <div className="border border-border bg-surface p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-3">Progresso</p>
                        <div className="grid grid-cols-5 gap-1">
                            {questions.map((_, i) => {
                                let bg = 'bg-background border border-border text-muted'
                                if (i < current)        bg = answers[i] === questions[i]?.correct ? 'bg-green-500/30 border border-green-500/20 text-green-300' : 'bg-red-500/20 border border-red-500/20 text-red-300'
                                else if (i === current) bg = 'border-2 border-accent text-accent'
                                return (
                                    <div key={i} className={`aspect-square flex items-center justify-center text-[10px] font-black ${bg}`}>
                                        {i + 1}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="border border-border bg-surface p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted mb-2">Atalhos</p>
                        <div className="space-y-1.5 text-[11px] text-muted">
                            <p><kbd className="bg-background border border-border px-1.5 py-0.5 font-mono text-[9px]">1–4</kbd> ou <kbd className="bg-background border border-border px-1.5 py-0.5 font-mono text-[9px]">A–D</kbd> — responder</p>
                            <p><kbd className="bg-background border border-border px-1.5 py-0.5 font-mono text-[9px]">Enter</kbd> — próxima</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
