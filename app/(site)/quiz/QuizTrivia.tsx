'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface TriviaQuestion {
    id: string
    question: string
    options: unknown
    correct: number
    explanation: string
    category: string
    difficulty: string
}

const CATEGORY_LABEL: Record<string, string> = {
    'k-pop': 'K-Pop',
    'k-drama': 'K-Drama',
    'cultura': 'Cultura Coreana',
    'história': 'História da Coreia',
}

const CATEGORY_SLUGS: Record<string, string> = {
    'k-pop': 'k-pop',
    'k-drama': 'k-drama',
    'cultura': 'cultura',
    'história': 'historia',
}

export function QuizTrivia({ questions }: { questions: TriviaQuestion[] }) {
    const [openCategory, setOpenCategory] = useState<string | null>(null)

    const byCategory = questions.reduce<Record<string, TriviaQuestion[]>>((acc, q) => {
        if (!acc[q.category]) acc[q.category] = []
        acc[q.category].push(q)
        return acc
    }, {})

    return (
        <section className="max-w-4xl mx-auto px-4 py-12 mt-8 border-t border-border">
            <div className="mb-6">
                <h2 className="text-lg font-bold text-foreground">Banco de perguntas — trivia de K-Pop e K-Drama</h2>
                <p className="text-sm text-muted mt-1">
                    {questions.length} perguntas sobre K-Pop, K-Drama, cultura e história coreana em português.
                    Abra uma categoria para ver exemplos ou{' '}
                    <Link href="/quiz" className="text-accent hover:underline">jogue o quiz completo</Link>.
                </p>
            </div>

            <div className="space-y-2">
                {Object.entries(byCategory).map(([cat, qs]) => {
                    const isOpen = openCategory === cat
                    const slug = CATEGORY_SLUGS[cat] ?? cat
                    return (
                        <div key={cat} className="border border-border rounded">
                            <button
                                onClick={() => setOpenCategory(isOpen ? null : cat)}
                                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface transition-colors"
                                aria-expanded={isOpen}
                            >
                                <span className="font-semibold text-sm text-foreground">
                                    {CATEGORY_LABEL[cat] ?? cat}
                                    <span className="text-muted font-normal ml-2">({qs.length} perguntas)</span>
                                </span>
                                <span className="flex items-center gap-2 text-xs text-muted">
                                    <Link
                                        href={`/quiz/${slug}`}
                                        onClick={e => e.stopPropagation()}
                                        className="hover:text-accent transition-colors underline"
                                    >
                                        Jogar só {CATEGORY_LABEL[cat] ?? cat}
                                    </Link>
                                    {isOpen ? <ChevronUp className="w-4 h-4 shrink-0" /> : <ChevronDown className="w-4 h-4 shrink-0" />}
                                </span>
                            </button>

                            {isOpen && (
                                <div className="border-t border-border divide-y divide-border">
                                    {qs.slice(0, 10).map((q, i) => {
                                        const opts = q.options as string[]
                                        return (
                                            <div key={q.id} className="px-4 py-3">
                                                <p className="text-sm font-medium text-foreground">
                                                    <span className="text-muted mr-2">{i + 1}.</span>
                                                    {q.question}
                                                </p>
                                                <p className="text-xs text-accent mt-1 font-semibold">
                                                    Resposta: {opts[q.correct]}
                                                </p>
                                                {q.explanation && (
                                                    <p className="text-xs text-muted mt-0.5">{q.explanation}</p>
                                                )}
                                            </div>
                                        )
                                    })}
                                    {qs.length > 10 && (
                                        <div className="px-4 py-3">
                                            <Link href={`/quiz/${CATEGORY_SLUGS[cat] ?? cat}`} className="text-xs text-accent hover:underline">
                                                Ver todas as {qs.length} perguntas de {CATEGORY_LABEL[cat] ?? cat} no quiz →
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <p className="text-xs text-muted mt-6">
                Quer jogar um quiz específico?{' '}
                {Object.entries(CATEGORY_LABEL).map(([cat, label], i, arr) => (
                    <span key={cat}>
                        <Link href={`/quiz/${CATEGORY_SLUGS[cat]}`} className="text-accent hover:underline">{label}</Link>
                        {i < arr.length - 1 ? ' · ' : ''}
                    </span>
                ))}
            </p>
        </section>
    )
}
