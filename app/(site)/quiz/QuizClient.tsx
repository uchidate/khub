'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
    Trophy, RefreshCw, ChevronRight, CheckCircle2, XCircle,
    Share2, Flame, Zap, BookOpen, ChevronDown, ChevronUp, Medal,
    ArrowRight, RotateCcw, Music, Tv, Globe, Clock, Layers,
    Target, Star, TrendingUp, Sparkles, Play, BarChart3,
} from 'lucide-react'
import { useUmami } from '@/hooks/useUmami'

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

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; border: string; Icon: React.FC<{className?: string}> }> = {
    'k-pop':    { label: 'K-Pop',    color: 'text-pink-400',   bg: 'bg-pink-400/10',   border: 'border-pink-400/20',   Icon: Music },
    'k-drama':  { label: 'K-Drama',  color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20',   Icon: Tv },
    'cultura':  { label: 'Cultura',  color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', Icon: Globe },
    'história': { label: 'História', color: 'text-amber-400',  bg: 'bg-amber-400/10',  border: 'border-amber-400/20',  Icon: Clock },
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; time: number; pts: number; desc: string; color: string }> = {
    easy:   { label: 'Iniciante',     time: 20, pts: 80,  desc: '20s · 80pts',  color: 'text-emerald-400' },
    medium: { label: 'Intermediário', time: 15, pts: 100, desc: '15s · 100pts', color: 'text-amber-400'   },
    hard:   { label: 'Expert',        time: 10, pts: 150, desc: '10s · 150pts', color: 'text-red-400'     },
}

type CategoryFilter = 'all' | Category
type Screen = 'start' | 'quiz' | 'result'

const QUIZ_SIZE = 15

function getResult(pct: number) {
    if (pct === 1)   return { title: 'Perfeito!',          sub: 'Expert Hallyu',       color: '#f59e0b' }
    if (pct >= 0.8)  return { title: 'Excelente!',         sub: 'Fã dedicado',          color: 'var(--color-accent,#a855f7)' }
    if (pct >= 0.6)  return { title: 'Muito bom!',         sub: 'Bom conhecimento',     color: '#60a5fa' }
    if (pct >= 0.4)  return { title: 'Quase lá!',          sub: 'Continue explorando',  color: '#a78bfa' }
    return           { title: 'Continue tentando!',    sub: 'Iniciante',            color: '#6b7280' }
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

function Confetti() {
    const colors = ['#ec4899','#a855f7','#f59e0b','#60a5fa','#34d399','#f472b6']
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden>
            {Array.from({ length: 50 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        position: 'absolute',
                        left: `${(i * 2.1) % 100}%`,
                        top: '-12px',
                        width: i % 3 === 0 ? '9px' : '6px',
                        height: i % 3 === 0 ? '9px' : '14px',
                        borderRadius: i % 4 === 0 ? '50%' : '2px',
                        background: colors[i % colors.length],
                        opacity: 0,
                        animation: `cffall ${1.8 + (i % 5) * 0.3}s ease-in forwards`,
                        animationDelay: `${(i % 6) * 0.1}s`,
                        transform: `rotate(${i * 37}deg)`,
                    }}
                />
            ))}
        </div>
    )
}

// ─── Start Screen ─────────────────────────────────────────────────────────────

function StartScreen({ onStart, bestScore }: {
    onStart: (cat: CategoryFilter, diff: Difficulty) => void
    bestScore: number | null
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

    const difficulties: { value: Difficulty; label: string; desc: string; detail: string; color: string }[] = [
        { value: 'easy',   label: 'Iniciante',     desc: '20s por pergunta', detail: '80 pts/acerto',  color: 'emerald' },
        { value: 'medium', label: 'Intermediário', desc: '15s por pergunta', detail: '100 pts/acerto', color: 'amber'   },
        { value: 'hard',   label: 'Expert',        desc: '10s por pergunta', detail: '150 pts/acerto', color: 'red'     },
    ]

    const diffColor = { emerald: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300', amber: 'border-amber-500/50 bg-amber-500/10 text-amber-300', red: 'border-red-500/50 bg-red-500/10 text-red-300' }
    const diffLabelColor = { emerald: 'text-emerald-400', amber: 'text-amber-400', red: 'text-red-400' }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
            <style>{`
                @keyframes cffall { 0%{transform:translateY(0) rotate(0deg);opacity:1} 100%{transform:translateY(100vh) rotate(720deg);opacity:0} }
                @keyframes fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            <div className="w-full max-w-3xl" style={{ animation: 'fadein 0.35s ease both' }}>

                {/* ── Header ── */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-1.5 mb-5">
                        <Target className="w-3.5 h-3.5 text-accent" />
                        <span className="text-xs font-bold text-accent uppercase tracking-widest">Quiz Hallyu</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-black text-foreground leading-tight mb-3">
                        Quanto você sabe<br className="hidden sm:block" /> sobre a Coreia?
                    </h1>
                    <p className="text-muted text-base">
                        {QUIZ_SIZE} perguntas · Timer por questão · Pontuação por velocidade
                    </p>
                    {bestScore !== null && (
                        <div className="inline-flex items-center gap-2 mt-4 py-2 px-5 rounded-full bg-amber-400/8 border border-amber-400/15">
                            <Medal className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-bold text-amber-400">Seu recorde: {bestScore.toLocaleString()} pts</span>
                        </div>
                    )}
                </div>

                {/* ── Two column layout ── */}
                <div className="grid sm:grid-cols-2 gap-6 mb-8">

                    {/* Categoria */}
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted mb-3">Categoria</p>
                        <div className="space-y-2">
                            {categories.map(c => {
                                const active = category === c.value
                                return (
                                    <button
                                        key={c.value}
                                        onClick={() => setCategory(c.value)}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150
                                            ${active
                                                ? 'border-accent bg-accent/10 shadow-sm'
                                                : 'border-border bg-surface hover:border-border/60 hover:bg-surface-hover'}
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${active ? 'bg-accent/20' : 'bg-background'}`}>
                                            <c.Icon className={`w-4 h-4 ${active ? 'text-accent' : 'text-muted'}`} />
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold leading-none mb-0.5 ${active ? 'text-accent' : 'text-foreground'}`}>{c.label}</p>
                                            <p className="text-[11px] text-muted leading-none">{c.sub}</p>
                                        </div>
                                        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Dificuldade */}
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted mb-3">Dificuldade</p>
                        <div className="space-y-2">
                            {difficulties.map(d => {
                                const active = difficulty === d.value
                                const cls = diffColor[d.color as keyof typeof diffColor]
                                const lcls = diffLabelColor[d.color as keyof typeof diffLabelColor]
                                return (
                                    <button
                                        key={d.value}
                                        onClick={() => setDifficulty(d.value)}
                                        className={`
                                            w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150
                                            ${active ? cls : 'border-border bg-surface hover:border-border/60 hover:bg-surface-hover'}
                                        `}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${active ? 'bg-white/5' : 'bg-background'}`}>
                                            <TrendingUp className={`w-4 h-4 ${active ? lcls : 'text-muted'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className={`text-sm font-bold leading-none mb-0.5 ${active ? lcls : 'text-foreground'}`}>{d.label}</p>
                                            <p className="text-[11px] text-muted leading-none">{d.desc}</p>
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-wide ${active ? lcls : 'text-muted'}`}>{d.detail}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Stats preview */}
                        <div className="mt-4 p-4 rounded-xl bg-surface border border-border">
                            <p className="text-[11px] font-black uppercase tracking-widest text-muted mb-3">Esta partida</p>
                            <div className="grid grid-cols-3 gap-3 text-center">
                                <div>
                                    <p className="text-xl font-black text-foreground tabular-nums">{QUIZ_SIZE}</p>
                                    <p className="text-[10px] text-muted">perguntas</p>
                                </div>
                                <div>
                                    <p className="text-xl font-black text-foreground tabular-nums">{DIFFICULTY_CONFIG[difficulty].time}s</p>
                                    <p className="text-[10px] text-muted">por questão</p>
                                </div>
                                <div>
                                    <p className="text-xl font-black text-foreground tabular-nums">{DIFFICULTY_CONFIG[difficulty].pts * QUIZ_SIZE}</p>
                                    <p className="text-[10px] text-muted">pts máx</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => onStart(category, difficulty)}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-accent text-white font-black text-base hover:opacity-90 active:scale-[0.99] transition-all shadow-lg shadow-accent/20"
                >
                    <Play className="w-5 h-5 fill-current" />
                    Começar o Quiz
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({ questions, answers, points, onReset }: {
    questions: Question[]
    answers: (number | null)[]
    points: number
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
        questions
            .filter((qu, i) => answers[i] !== qu.correct && qu.relatedHref)
            .slice(0, 3)
            .map(qu => ({ href: qu.relatedHref!, label: qu.relatedLabel! }))
    , [questions, answers])

    const wrongAnswers = questions.filter((_, i) => answers[i] !== questions[i].correct)

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
                @keyframes fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
                @keyframes drawin { from{stroke-dashoffset:${circ}} to{stroke-dashoffset:${circ - dash}} }
            `}</style>

            <div className="min-h-screen bg-background px-4 py-10 flex items-start justify-center">
                <div className="w-full max-w-4xl" style={{ animation: 'fadein 0.35s ease both' }}>

                    {/* ── Top row: score hero + category breakdown ── */}
                    <div className="grid sm:grid-cols-2 gap-6 mb-6">

                        {/* Score */}
                        <div className="bg-surface border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                            <div className="relative inline-flex items-center justify-center mb-4">
                                <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
                                    <circle cx="70" cy="70" r={radius} fill="none" strokeWidth="10" stroke="var(--color-background,#0f0f14)" />
                                    <circle
                                        cx="70" cy="70" r={radius}
                                        fill="none" strokeWidth="10"
                                        stroke={result.color}
                                        strokeLinecap="round"
                                        strokeDasharray={circ}
                                        strokeDashoffset={circ - dash}
                                        style={{ animation: 'drawin 1s ease 0.3s both', strokeDashoffset: circ - dash }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-4xl font-black text-foreground tabular-nums">{score}</span>
                                    <span className="text-sm text-muted font-semibold">de {questions.length}</span>
                                </div>
                            </div>
                            <h2 className="text-2xl font-black text-foreground mb-1">{result.title}</h2>
                            <p className="text-muted text-sm mb-4">{result.sub}</p>
                            <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/20 rounded-full px-5 py-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span className="text-base font-black text-amber-400">{points.toLocaleString()} pts</span>
                            </div>
                        </div>

                        {/* Por categoria */}
                        <div className="bg-surface border border-border rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-5">
                                <BarChart3 className="w-4 h-4 text-muted" />
                                <p className="text-[11px] font-black uppercase tracking-widest text-muted">Por categoria</p>
                            </div>
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
                                                <span className="text-xs font-bold text-foreground tabular-nums">{correct}/{total}</span>
                                            </div>
                                            <div className="h-2 bg-background rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${pctCat * 100}%`, background: result.color }}
                                                />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {relatedContent.length > 0 && (
                                <div className="mt-6 pt-5 border-t border-border">
                                    <div className="flex items-center gap-2 mb-3">
                                        <BookOpen className="w-3.5 h-3.5 text-accent" />
                                        <p className="text-[11px] font-black uppercase tracking-widest text-muted">Leitura recomendada</p>
                                    </div>
                                    <div className="space-y-2">
                                        {relatedContent.map((item, i) => (
                                            <Link key={i} href={item.href} className="flex items-center gap-2 text-sm text-foreground hover:text-accent transition-colors group">
                                                <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-accent flex-shrink-0 transition-colors" />
                                                <span className="line-clamp-1">{item.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Revisar erros ── */}
                    {wrongAnswers.length > 0 && (
                        <div className="border border-border rounded-2xl mb-6 overflow-hidden">
                            <button
                                onClick={() => setShowReview(v => !v)}
                                className="w-full flex items-center justify-between p-4 bg-surface hover:bg-surface-hover transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <XCircle className="w-4 h-4 text-red-400" />
                                    <span className="text-sm font-bold text-foreground">
                                        Revisar {wrongAnswers.length} {wrongAnswers.length === 1 ? 'erro' : 'erros'}
                                    </span>
                                </div>
                                {showReview
                                    ? <ChevronUp className="w-4 h-4 text-muted" />
                                    : <ChevronDown className="w-4 h-4 text-muted" />}
                            </button>
                            {showReview && (
                                <div className="p-4 bg-surface grid sm:grid-cols-2 gap-3">
                                    {wrongAnswers.map(q => {
                                        const origIdx = questions.indexOf(q)
                                        const userAnswer = answers[origIdx]
                                        const meta = CATEGORY_META[q.category]
                                        return (
                                            <div key={q.id} className="border border-border rounded-xl p-4 bg-background">
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <meta.Icon className={`w-3 h-3 ${meta.color}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${meta.color}`}>{meta.label}</span>
                                                </div>
                                                <p className="text-sm font-bold text-foreground leading-snug mb-3">{q.question}</p>
                                                {userAnswer !== null && userAnswer >= 0 && (
                                                    <p className="text-xs text-red-400 mb-1 flex items-center gap-1.5">
                                                        <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                                        {q.options[userAnswer]}
                                                    </p>
                                                )}
                                                {userAnswer === -1 && (
                                                    <p className="text-xs text-red-400 mb-1 flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                                        Tempo esgotado
                                                    </p>
                                                )}
                                                <p className="text-xs text-green-400 mb-2 flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                                    {q.options[q.correct]}
                                                </p>
                                                <p className="text-xs text-muted leading-relaxed">{q.explanation}</p>
                                                {q.relatedHref && (
                                                    <Link href={q.relatedHref} className="inline-flex items-center gap-1 text-xs text-accent font-bold mt-2 hover:underline">
                                                        <BookOpen className="w-3 h-3" />
                                                        {q.relatedLabel}
                                                    </Link>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Ações ── */}
                    <div className="grid sm:grid-cols-4 gap-3">
                        <button
                            onClick={onReset}
                            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-border bg-surface text-foreground font-bold hover:bg-surface-hover transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Jogar de novo
                        </button>
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-accent/30 bg-accent/10 text-accent font-bold hover:bg-accent/15 transition-all"
                        >
                            <Share2 className="w-4 h-4" />
                            Compartilhar
                        </button>
                        <button
                            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`, '_blank')}
                            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] font-bold hover:bg-[#25D366]/15 transition-all"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            WhatsApp
                        </button>
                        <Link
                            href="/blog"
                            className="flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent text-white font-bold hover:opacity-90 transition-all"
                        >
                            <Sparkles className="w-4 h-4" />
                            Ver artigos
                        </Link>
                    </div>
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
    const [bestScore,       setBestScore]        = useState<number | null>(null)
    const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null)
    const startTracked = useRef(false)

    const { trackQuizStart, trackQuizAnswer, trackQuizComplete } = useUmami()

    useEffect(() => {
        try {
            const s = localStorage.getItem('quiz_best_score')
            if (s) setBestScore(parseInt(s))
        } catch { /* ignore */ }
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
        setSelected(idx)
        setShowExplanation(true)

        const newAnswers = [...answers]
        newAnswers[current] = idx
        setAnswers(newAnswers)

        if (!startTracked.current) { startTracked.current = true; trackQuizStart() }

        const isCorrect = idx === questions[current].correct
        trackQuizAnswer(isCorrect, current)

        if (isCorrect) {
            const bonus    = Math.floor(timeLeft * 3)
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
    }, [selected, answers, current, questions, timeLeft, streak, stopTimer, basePoints])

    // Timer
    useEffect(() => {
        if (screen !== 'quiz' || selected !== null || !q) return
        setTimeLeft(timePerQuestion)
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    clearInterval(timerRef.current!)
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
                try {
                    const prev = localStorage.getItem('quiz_best_score')
                    if (!prev || points > parseInt(prev)) {
                        localStorage.setItem('quiz_best_score', String(points))
                        setBestScore(points)
                    }
                } catch { /* ignore */ }
                setScreen('result')
            }
            setAnimating(false)
        }, 180)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, questions.length, answers, points, stopTimer])

    // Keyboard shortcuts
    useEffect(() => {
        if (screen !== 'quiz') return
        const handler = (e: KeyboardEvent) => {
            if (selected === null) {
                if (['1','2','3','4'].includes(e.key))                       handleSelect(parseInt(e.key) - 1)
                if (['a','b','c','d'].includes(e.key.toLowerCase()))         handleSelect(e.key.toLowerCase().charCodeAt(0) - 97)
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleNext()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [screen, selected, handleSelect, handleNext])

    if (screen === 'start')  return <StartScreen onStart={handleStart} bestScore={bestScore} />
    if (screen === 'result') return (
        <ResultScreen questions={questions} answers={answers} points={points} onReset={() => setScreen('start')} />
    )

    // Loading
    if (!q) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <p className="text-muted text-sm">Carregando perguntas…</p>
            </div>
        </div>
    )

    const score        = answers.filter((a, i) => a === questions[i]?.correct).length
    const timerPct     = (timeLeft / timePerQuestion) * 100
    const timerUrgent  = timeLeft <= Math.ceil(timePerQuestion * 0.25)
    const timerColor   = timerUrgent ? '#f87171' : timeLeft <= Math.ceil(timePerQuestion * 0.5) ? '#fbbf24' : 'var(--color-accent,#a855f7)'
    const catMeta      = CATEGORY_META[q.category]
    const diffCfg      = DIFFICULTY_CONFIG[difficulty]

    return (
        <div className="min-h-screen bg-background flex items-start justify-center">
            <style>{`
                @keyframes shakex { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-3px)} 80%{transform:translateX(3px)} }
                @keyframes popin  { 0%{transform:scale(1)} 45%{transform:scale(1.015)} 100%{transform:scale(1)} }
                @keyframes slidein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
            `}</style>

            {/* Streak popup */}
            {showStreak && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-500 text-white text-sm font-black px-5 py-2.5 rounded-full shadow-xl">
                    <Flame className="w-4 h-4" />
                    {streak}× em sequência!
                </div>
            )}

            {/* Two-column desktop layout */}
            <div className="w-full max-w-5xl px-4 pt-6 pb-28 sm:pb-10 sm:grid sm:grid-cols-[1fr_300px] sm:gap-6 sm:items-start">

                {/* ── Left: question + options ── */}
                <div
                    style={{
                        opacity: animating ? 0 : 1,
                        transform: animating ? 'translateY(5px)' : 'translateY(0)',
                        transition: 'opacity 0.18s, transform 0.18s',
                        animation: feedbackAnim === 'wrong'   ? 'shakex 0.4s ease'
                                 : feedbackAnim === 'correct' ? 'popin 0.28s ease'
                                 : 'none',
                    }}
                >
                    {/* Timer bar + progress */}
                    <div className="mb-4">
                        <div className="h-1 bg-surface rounded-full overflow-hidden mb-1.5">
                            <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{ width: `${timerPct}%`, background: timerColor }}
                            />
                        </div>
                        <div className="flex gap-0.5">
                            {questions.map((_, i) => (
                                <div
                                    key={i}
                                    className={`flex-1 h-0.5 rounded-full transition-all duration-300 ${
                                        i < current
                                            ? answers[i] === questions[i].correct ? 'bg-green-400' : 'bg-red-400/60'
                                            : i === current ? '' : 'bg-surface'
                                    }`}
                                    style={i === current ? { background: timerColor } : {}}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Question card */}
                    <div className="bg-surface border border-border rounded-2xl p-6 mb-4">
                        <div className="flex items-start justify-between mb-5">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <catMeta.Icon className={`w-3.5 h-3.5 ${catMeta.color}`} />
                                    <span className={`text-xs font-black uppercase tracking-widest ${catMeta.color}`}>{catMeta.label}</span>
                                    <span className="text-xs text-muted">· Pergunta {current + 1} de {questions.length}</span>
                                </div>
                                <p className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                                    {q.question}
                                </p>
                            </div>
                            {/* Circular timer */}
                            <div className="flex-shrink-0 relative w-14 h-14">
                                <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                                    <circle cx="28" cy="28" r="22" fill="none" strokeWidth="3.5" stroke="var(--color-background,#0f0f14)" />
                                    <circle
                                        cx="28" cy="28" r="22"
                                        fill="none" strokeWidth="3.5"
                                        stroke={timerColor}
                                        strokeLinecap="round"
                                        strokeDasharray={2 * Math.PI * 22}
                                        strokeDashoffset={(1 - timerPct / 100) * 2 * Math.PI * 22}
                                        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s' }}
                                    />
                                </svg>
                                <span className={`absolute inset-0 flex items-center justify-center text-base font-black tabular-nums ${timerUrgent ? 'text-red-400' : 'text-foreground'}`}>
                                    {timeLeft}
                                </span>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="space-y-2.5">
                            {q.options.map((opt, idx) => {
                                const isCorrect  = idx === q.correct
                                const isSelected = idx === selected
                                let optCls: string
                                let iconEl: React.ReactNode = null

                                if (selected === null) {
                                    optCls = 'border-border bg-background text-foreground hover:border-accent/40 hover:bg-accent/5 cursor-pointer'
                                } else if (isCorrect) {
                                    optCls = 'border-green-500/50 bg-green-500/8 text-green-200 cursor-default'
                                    iconEl = <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                                } else if (isSelected) {
                                    optCls = 'border-red-500/50 bg-red-500/8 text-red-200 cursor-default'
                                    iconEl = <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                                } else {
                                    optCls = 'border-border bg-background text-muted opacity-30 cursor-default'
                                }

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelect(idx)}
                                        disabled={selected !== null}
                                        className={`w-full text-left px-4 py-3.5 rounded-xl border font-medium transition-all flex items-center gap-3 active:scale-[0.99] ${optCls}`}
                                    >
                                        <span className={`
                                            w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0
                                            ${selected === null ? 'bg-surface border border-border text-muted' : isCorrect ? 'bg-green-500/20 border border-green-500/40 text-green-300' : isSelected ? 'bg-red-500/20 border border-red-500/40 text-red-300' : 'bg-surface border border-border text-muted'}
                                        `}>
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="flex-1 leading-snug text-sm sm:text-base">{opt}</span>
                                        {iconEl}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Explanation */}
                    {showExplanation && (
                        <div
                            className={`rounded-2xl border p-4 mb-4 ${selected === q.correct ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}
                            style={{ animation: 'slidein 0.2s ease both' }}
                        >
                            <p className={`text-sm font-black mb-1.5 ${selected === q.correct ? 'text-green-400' : 'text-red-400'}`}>
                                {selected === -1
                                    ? 'Tempo esgotado'
                                    : selected === q.correct
                                        ? streak >= 3 ? 'Em chamas!' : streak >= 2 ? 'Sequência!' : 'Correto!'
                                        : 'Incorreto'}
                            </p>
                            <p className="text-sm text-muted leading-relaxed mb-2">{q.explanation}</p>
                            {q.relatedHref && (
                                <Link href={q.relatedHref} className="inline-flex items-center gap-1.5 text-xs font-bold text-accent hover:underline">
                                    <BookOpen className="w-3.5 h-3.5" />
                                    {q.relatedLabel}
                                </Link>
                            )}
                            <p className="text-[11px] text-muted/40 mt-2 hidden sm:block">Enter ou Espaço para continuar</p>
                        </div>
                    )}

                    {/* Next button — sticky mobile */}
                    {selected !== null && (
                        <div className="fixed bottom-[70px] sm:bottom-auto sm:static left-0 right-0 px-4 sm:px-0 pb-3 sm:pb-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none border-t border-border/30 sm:border-0 pt-3 sm:pt-0 z-30">
                            <button
                                onClick={handleNext}
                                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-accent text-white font-bold text-sm hover:opacity-90 active:scale-[0.99] transition-all"
                            >
                                {current < questions.length - 1
                                    ? <><ChevronRight className="w-4 h-4" /> Próxima pergunta</>
                                    : <><Trophy className="w-4 h-4" /> Ver resultado</>
                                }
                            </button>
                        </div>
                    )}
                </div>

                {/* ── Right: sidebar ── */}
                <div className="hidden sm:flex flex-col gap-4">

                    {/* Scoreboard */}
                    <div className="bg-surface border border-border rounded-2xl p-5">
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted mb-4">Placar</p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted">
                                    <Target className="w-4 h-4" />
                                    <span className="text-sm">Acertos</span>
                                </div>
                                <span className="text-sm font-black text-foreground tabular-nums">{score} / {current + (selected !== null ? 1 : 0)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted">
                                    <Zap className="w-4 h-4" />
                                    <span className="text-sm">Pontos</span>
                                </div>
                                <span className="text-sm font-black text-amber-400 tabular-nums">{points.toLocaleString()}</span>
                            </div>
                            {streak >= 2 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted">
                                        <Flame className="w-4 h-4" />
                                        <span className="text-sm">Sequência</span>
                                    </div>
                                    <span className="text-sm font-black text-orange-400">{streak}×</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-muted">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-sm">Nível</span>
                                </div>
                                <span className={`text-sm font-black ${diffCfg.color}`}>{diffCfg.label}</span>
                            </div>
                        </div>
                    </div>

                    {/* Progresso por questão */}
                    <div className="bg-surface border border-border rounded-2xl p-5">
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted mb-4">Progresso</p>
                        <div className="grid grid-cols-5 gap-1.5">
                            {questions.map((_, i) => {
                                let bg = 'bg-background border border-border'
                                if (i < current)         bg = answers[i] === questions[i]?.correct ? 'bg-green-500/40 border border-green-500/20' : 'bg-red-500/30 border border-red-500/20'
                                else if (i === current)  bg = 'border-2 border-accent'
                                return (
                                    <div
                                        key={i}
                                        className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-black ${bg} ${i === current ? 'text-accent' : i < current ? '' : 'text-muted'}`}
                                    >
                                        {i + 1}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Dica */}
                    <div className="bg-surface border border-border rounded-2xl p-5">
                        <p className="text-[11px] font-black uppercase tracking-widest text-muted mb-2">Atalhos</p>
                        <div className="space-y-1.5 text-xs text-muted">
                            <p><kbd className="bg-background border border-border rounded px-1.5 py-0.5 font-mono text-[10px]">1–4</kbd> ou <kbd className="bg-background border border-border rounded px-1.5 py-0.5 font-mono text-[10px]">A–D</kbd> — responder</p>
                            <p><kbd className="bg-background border border-border rounded px-1.5 py-0.5 font-mono text-[10px]">Enter</kbd> — próxima</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
