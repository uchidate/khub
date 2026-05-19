'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
    Trophy, RefreshCw, ChevronRight, CheckCircle2, XCircle, Sparkles,
    Share2, Flame, Zap, Clock, BookOpen, Filter, Star, ChevronDown,
    ChevronUp, Play, Medal,
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

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; time: number; color: string; points: number }> = {
    easy: { label: 'Iniciante', time: 20, color: 'text-green-400 border-green-400/30 bg-green-400/10', points: 80 },
    medium: { label: 'Intermediário', time: 15, color: 'text-amber-400 border-amber-400/30 bg-amber-400/10', points: 100 },
    hard: { label: 'Expert', time: 10, color: 'text-red-400 border-red-400/30 bg-red-400/10', points: 150 },
}

type CategoryFilter = 'all' | Category
type Screen = 'start' | 'quiz' | 'result'


const QUIZ_SIZE = 15

function getResult(score: number, total: number, pts: number) {
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

// ─── Start Screen ────────────────────────────────────────────────────────────

function StartScreen({ onStart, bestScore }: {
    onStart: (cat: CategoryFilter, diff: Difficulty) => void
    bestScore: number | null
}) {
    const [category, setCategory] = useState<CategoryFilter>('all')
    const [difficulty, setDifficulty] = useState<Difficulty>('medium')

    const categories: { value: CategoryFilter; label: string; icon: string }[] = [
        { value: 'all', label: 'Tudo', icon: '🌟' },
        { value: 'k-pop', label: 'K-Pop', icon: '🎤' },
        { value: 'k-drama', label: 'K-Drama', icon: '🎬' },
        { value: 'cultura', label: 'Cultura', icon: '🇰🇷' },
        { value: 'história', label: 'História', icon: '📜' },
    ]

    // Show fixed count — actual available count is resolved at fetch time
    const availableCount = QUIZ_SIZE

    return (
        <div className="min-h-screen bg-background px-4 py-10 pb-28 sm:pb-16 flex items-start justify-center">
            <div className="max-w-md w-full">
                {/* Hero */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-10 h-10 text-accent" />
                    </div>
                    <h1 className="text-3xl font-black text-foreground mb-2">Quiz Hallyu</h1>
                    <p className="text-muted text-sm">Teste seus conhecimentos sobre K-Pop, K-Drama e cultura coreana</p>
                    {bestScore !== null && (
                        <div className="inline-flex items-center gap-1.5 mt-3 bg-amber-400/10 border border-amber-400/20 rounded-full px-3 py-1.5">
                            <Medal className="w-3.5 h-3.5 text-amber-400" />
                            <span className="text-xs font-black text-amber-400">Recorde: {bestScore} pts</span>
                        </div>
                    )}
                </div>

                {/* Categoria */}
                <div className="bg-surface border border-border rounded-2xl p-4 mb-3">
                    <div className="flex items-center gap-2 mb-3">
                        <Filter className="w-3.5 h-3.5 text-muted" />
                        <p className="text-xs font-black uppercase tracking-widest text-muted">Categoria</p>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                        {categories.map(c => (
                            <button
                                key={c.value}
                                onClick={() => setCategory(c.value)}
                                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-bold transition-all ${
                                    category === c.value
                                        ? 'border-accent bg-accent/10 text-accent'
                                        : 'border-border bg-background text-muted hover:border-accent/30'
                                }`}
                            >
                                <span className="text-base">{c.icon}</span>
                                <span className="text-[10px]">{c.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Dificuldade */}
                <div className="bg-surface border border-border rounded-2xl p-4 mb-5">
                    <div className="flex items-center gap-2 mb-3">
                        <Star className="w-3.5 h-3.5 text-muted" />
                        <p className="text-xs font-black uppercase tracking-widest text-muted">Dificuldade</p>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(([key, cfg]) => (
                            <button
                                key={key}
                                onClick={() => setDifficulty(key)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border font-bold transition-all ${
                                    difficulty === key ? cfg.color : 'border-border bg-background text-muted hover:border-border'
                                }`}
                            >
                                <span className="text-xs font-black">{cfg.label}</span>
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 opacity-70" />
                                    <span className="text-[10px] opacity-70">{cfg.time}s</span>
                                </div>
                                <span className="text-[10px] opacity-70">+{cfg.points}pts</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => onStart(category, difficulty)}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-accent text-white font-black text-base hover:opacity-90 transition-all active:scale-[0.99]"
                >
                    <Play className="w-5 h-5" />
                    Começar — {availableCount} perguntas
                </button>

                <p className="text-center text-[11px] text-muted mt-3">
                    As perguntas são sorteadas aleatoriamente a cada rodada
                </p>
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
    const score = answers.filter((a, i) => a === questions[i]?.correct).length
    const result = getResult(score, questions.length, points)

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

    const shareText = `Fiz o Quiz Hallyu no HallyuHub! 🎯 Acertei ${score}/${questions.length} e fiz ${points} pts. Tente você também:`
    const shareUrl = typeof window !== 'undefined' ? window.location.href : 'https://www.hallyuhub.com.br/quiz'

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Quiz Hallyu', text: shareText, url: shareUrl })
                return
            } catch { /* fallback */ }
        }
        navigator.clipboard?.writeText(`${shareText} ${shareUrl}`)
    }

    const wrongAnswers = questions.filter((_, i) => answers[i] !== questions[i].correct)

    return (
        <>
            {score === questions.length && <Confetti />}
            <style>{`
                @keyframes confetti-fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
                }
            `}</style>
            <div className="min-h-screen bg-background px-4 py-10 pb-28 sm:pb-16 flex items-start justify-center">
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

                    {/* Revisão de erros */}
                    {wrongAnswers.length > 0 && (
                        <div className="bg-surface border border-border rounded-2xl mb-4 overflow-hidden">
                            <button
                                onClick={() => setShowReview(v => !v)}
                                className="w-full flex items-center justify-between p-4 hover:bg-surface-hover transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                                    <p className="text-xs font-black uppercase tracking-widest text-muted">
                                        Revisar erros ({wrongAnswers.length})
                                    </p>
                                </div>
                                {showReview ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                            </button>
                            {showReview && (
                                <div className="px-4 pb-4 space-y-4">
                                    {wrongAnswers.map((q, wi) => {
                                        const origIdx = questions.indexOf(q)
                                        const userAnswer = answers[origIdx]
                                        return (
                                            <div key={q.id} className="border border-border rounded-xl overflow-hidden">
                                                <div className="bg-background p-3">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <span className={`text-[10px] font-black uppercase tracking-wider border rounded-full px-2 py-0.5 ${CATEGORY_COLORS[q.category]}`}>
                                                            {CATEGORY_LABELS[q.category]}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs font-bold text-foreground leading-snug mb-2">{q.question}</p>
                                                    {userAnswer !== null && userAnswer >= 0 && (
                                                        <p className="text-[11px] text-red-400 mb-1">
                                                            ✗ Sua resposta: {q.options[userAnswer]}
                                                        </p>
                                                    )}
                                                    {userAnswer === -1 && (
                                                        <p className="text-[11px] text-red-400 mb-1">✗ Tempo esgotado</p>
                                                    )}
                                                    <p className="text-[11px] text-green-400 mb-2">
                                                        ✓ Correto: {q.options[q.correct]}
                                                    </p>
                                                    <p className="text-[11px] text-muted leading-relaxed">{q.explanation}</p>
                                                    {q.relatedHref && (
                                                        <Link
                                                            href={q.relatedHref}
                                                            className="inline-flex items-center gap-1 text-[11px] text-accent font-bold mt-2 hover:underline"
                                                        >
                                                            <BookOpen className="w-3 h-3" />
                                                            {q.relatedLabel}
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Leitura recomendada */}
                    {relatedContent.length > 0 && (
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

                    <div className="flex flex-col gap-2.5">
                        {/* Compartilhar nativo / fallback */}
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-accent/30 bg-accent/10 text-accent text-sm font-bold hover:bg-accent/20 transition-all"
                        >
                            <Share2 className="w-4 h-4" />
                            Compartilhar resultado
                        </button>

                        {/* WhatsApp */}
                        <button
                            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank')}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[#25D366]/30 bg-[#25D366]/10 text-[#25D366] text-sm font-bold hover:bg-[#25D366]/20 transition-all"
                        >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            Compartilhar no WhatsApp
                        </button>

                        <button
                            onClick={onReset}
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

// ─── Main Quiz ────────────────────────────────────────────────────────────────

export function QuizClient() {
    const [screen, setScreen] = useState<Screen>('start')
    const [questions, setQuestions] = useState<Question[]>([])
    const [difficulty, setDifficulty] = useState<Difficulty>('medium')
    const [current, setCurrent] = useState(0)
    const [selected, setSelected] = useState<number | null>(null)
    const [answers, setAnswers] = useState<(number | null)[]>([])
    const [showExplanation, setShowExplanation] = useState(false)
    const [animating, setAnimating] = useState(false)
    const [timeLeft, setTimeLeft] = useState(15)
    const [streak, setStreak] = useState(0)
    const [points, setPoints] = useState(0)
    const [showStreak, setShowStreak] = useState(false)
    const [feedbackAnim, setFeedbackAnim] = useState<'correct' | 'wrong' | null>(null)
    const [bestScore, setBestScore] = useState<number | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const startTracked = useRef(false)

    const { trackQuizStart, trackQuizAnswer, trackQuizComplete } = useUmami()

    // Load best score from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem('quiz_best_score')
            if (stored) setBestScore(parseInt(stored))
        } catch { /* ignore */ }
    }, [])

    const timePerQuestion = DIFFICULTY_CONFIG[difficulty].time
    const basePoints = DIFFICULTY_CONFIG[difficulty].points

    const q = questions[current]

    const stopTimer = useCallback(() => {
        if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    }, [])

    const handleStart = useCallback(async (cat: CategoryFilter, diff: Difficulty) => {
        setScreen('quiz') // show loading state immediately
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
            const params = new URLSearchParams({
                category: cat,
                difficulty: diff,
                limit: String(QUIZ_SIZE),
            })
            const res = await fetch(`/api/quiz/questions?${params}`)
            const data: Question[] = await res.json()
            setQuestions(data)
            setAnswers(Array(data.length).fill(null))
        } catch {
            setScreen('start') // revert on error
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
            const timeBonus = Math.floor(timeLeft * 3)
            const newStreak = streak + 1
            setStreak(newStreak)
            setPoints(p => p + basePoints + timeBonus)
            if (newStreak >= 2) { setShowStreak(true); setTimeout(() => setShowStreak(false), 1500) }
            setFeedbackAnim('correct')
        } else {
            setStreak(0)
            setFeedbackAnim('wrong')
        }
        setTimeout(() => setFeedbackAnim(null), 600)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selected, answers, current, questions, timeLeft, streak, stopTimer, basePoints])

    // Timer
    useEffect(() => {
        if (screen !== 'quiz' || selected !== null) return
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
                    setTimeout(() => setFeedbackAnim(null), 600)
                    return 0
                }
                return t - 1
            })
        }, 1000)
        return stopTimer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, screen])

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
                // Save best score
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
        }, 200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [current, questions.length, answers, points, stopTimer])

    // Keyboard shortcuts
    useEffect(() => {
        if (screen !== 'quiz') return
        const handler = (e: KeyboardEvent) => {
            if (selected === null) {
                if (['1','2','3','4'].includes(e.key)) handleSelect(parseInt(e.key) - 1)
                if (['a','b','c','d'].includes(e.key.toLowerCase())) handleSelect(e.key.toLowerCase().charCodeAt(0) - 97)
            } else if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleNext()
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [screen, selected, handleSelect, handleNext])

    if (screen === 'start') return <StartScreen onStart={handleStart} bestScore={bestScore} />
    if (screen === 'result') return (
        <ResultScreen
            questions={questions}
            answers={answers}
            points={points}
            onReset={() => setScreen('start')}
        />
    )

    // Loading questions from API
    if (!q) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
                <p className="text-muted text-sm">Carregando perguntas...</p>
            </div>
        </div>
    )

    const score = answers.filter((a, i) => a === questions[i]?.correct).length
    const timerPct = (timeLeft / timePerQuestion) * 100
    const timerColor = timeLeft > timePerQuestion * 0.5 ? 'bg-accent' : timeLeft > timePerQuestion * 0.25 ? 'bg-amber-400' : 'bg-red-400'
    const diffCfg = DIFFICULTY_CONFIG[difficulty]

    return (
        <div className="min-h-screen bg-background px-4 pt-8 pb-28 sm:pb-16 flex items-start justify-center">
            {showStreak && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-amber-500 text-white text-sm font-black px-4 py-2 rounded-full shadow-lg animate-bounce">
                    <Flame className="w-4 h-4" />
                    {streak}x sequência!
                </div>
            )}

            <style>{`
                @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)} 40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
                @keyframes pop { 0%{transform:scale(1)} 50%{transform:scale(1.03)} 100%{transform:scale(1)} }
            `}</style>

            <div
                className="max-w-xl w-full"
                style={{
                    opacity: animating ? 0 : 1,
                    transform: animating ? 'translateY(4px)' : 'translateY(0)',
                    transition: 'opacity 0.2s, transform 0.2s',
                    animation: feedbackAnim === 'wrong' ? 'shake 0.4s ease' : feedbackAnim === 'correct' ? 'pop 0.3s ease' : 'none',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5">
                            <Trophy className="w-3.5 h-3.5 text-accent" />
                            <span className="text-xs font-black text-accent uppercase tracking-wider">Quiz</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-wider border rounded-full px-2 py-1 ${diffCfg.color}`}>
                            {diffCfg.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
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
                        <span className="text-xs text-muted font-semibold">
                            {current + 1}/{questions.length}
                            <span className="ml-2 text-green-400 font-bold">{score} ✓</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                            <Clock className={`w-3.5 h-3.5 ${timeLeft <= 3 ? 'text-red-400 animate-pulse' : 'text-muted'}`} />
                            <span className={`text-xs font-black tabular-nums ${timeLeft <= 3 ? 'text-red-400' : 'text-muted'}`}>{timeLeft}s</span>
                        </div>
                    </div>
                    <div className="h-1 bg-surface rounded-full overflow-hidden mb-2">
                        <div className={`h-full rounded-full transition-all duration-1000 ${timerColor}`} style={{ width: `${timerPct}%` }} />
                    </div>
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
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-[10px] font-black uppercase tracking-wider border rounded-full px-2.5 py-1 ${CATEGORY_COLORS[q.category]}`}>
                            {CATEGORY_LABELS[q.category]}
                        </span>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-foreground leading-snug mb-5">{q.question}</p>

                    <div className="space-y-2.5">
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
                                    className={`w-full text-left px-4 py-3.5 rounded-xl border text-sm font-semibold transition-all flex items-center gap-3 ${cls} ${selected === null ? 'cursor-pointer active:scale-[0.99]' : 'cursor-default'}`}
                                >
                                    <span className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px] font-black flex-shrink-0">
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="flex-1 leading-snug">{opt}</span>
                                    {selected !== null && idx === q.correct && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                                    {selected !== null && idx === selected && idx !== q.correct && <XCircle className="w-4 h-4 flex-shrink-0" />}
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Explicação */}
                {showExplanation && (
                    <div className={`rounded-xl border p-4 mb-3 text-sm leading-relaxed ${selected === q.correct ? 'border-green-500/30 bg-green-500/5 text-green-300' : 'border-red-500/30 bg-red-500/5 text-red-300'}`}>
                        {selected === -1
                            ? <p className="font-bold mb-1">⏱ Tempo esgotado!</p>
                            : selected === q.correct
                                ? <p className="font-bold mb-1">{streak >= 3 ? '🔥 Em chamas!' : streak >= 2 ? '⚡ Sequência!' : '✓ Correto!'}</p>
                                : <p className="font-bold mb-1">✗ Incorreto</p>
                        }
                        <p className="text-xs opacity-90 mb-2">{q.explanation}</p>
                        {q.relatedHref && (
                            <Link
                                href={q.relatedHref}
                                className="inline-flex items-center gap-1 text-[11px] font-bold opacity-80 hover:opacity-100 underline underline-offset-2"
                            >
                                <BookOpen className="w-3 h-3" />
                                {q.relatedLabel}
                            </Link>
                        )}
                        <p className="text-[10px] opacity-40 mt-2 hidden sm:block">Pressione Enter ou Espaço para continuar</p>
                    </div>
                )}

                {/* Next — sticky no mobile */}
                {selected !== null && (
                    <div className="fixed bottom-[70px] sm:bottom-auto sm:static left-0 right-0 px-4 sm:px-0 pb-3 sm:pb-0 bg-background/95 sm:bg-transparent backdrop-blur-sm sm:backdrop-blur-none border-t border-border/40 sm:border-0 pt-3 sm:pt-0 z-30">
                        <button
                            onClick={handleNext}
                            className="w-full flex items-center justify-center gap-2 py-4 sm:py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:opacity-90 transition-all active:scale-[0.99]"
                        >
                            {current < questions.length - 1 ? (
                                <><ChevronRight className="w-4 h-4" />Próxima pergunta</>
                            ) : (
                                <><Trophy className="w-4 h-4" />Ver resultado</>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
