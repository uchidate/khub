import Link from 'next/link'
import { Trophy, ChevronRight, Sparkles } from 'lucide-react'

const PREVIEW_QUESTIONS = [
    'Qual é o fandom do BTS?',
    'Quem estrelou Crash Landing on You?',
    'O que significa "Hallyu"?',
]

export function HomeQuizBanner() {
    return (
        <section className="bg-background py-4 sm:py-6">
            <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
                <Link
                    href="/quiz"
                    className="group grid gap-4 border-y border-border py-5 transition-colors hover:border-accent sm:grid-cols-[48px_minmax(0,1fr)_auto] sm:items-center"
                >
                    <div className="relative flex h-12 w-12 items-center justify-center border border-border bg-surface text-accent transition-colors group-hover:border-accent">
                        <Trophy className="h-5 w-5" />
                        <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center bg-accent">
                            <Sparkles className="h-2.5 w-2.5 text-white" />
                        </div>
                    </div>

                    <div className="min-w-0">
                        <p className="font-mono text-[9px] font-black uppercase tracking-[0.18em] text-accent">Quiz</p>
                        <h2 className="mt-1 text-[18px] font-black leading-tight tracking-[-0.02em] text-foreground transition-colors group-hover:text-accent sm:text-[20px]">
                            Quanto você sabe sobre K-Pop e K-Drama?
                        </h2>
                        <p className="mt-1 text-sm leading-6 text-muted">
                            10 perguntas sobre cultura coreana. Perguntas novas a cada rodada!
                        </p>
                        <div className="mt-3 hidden flex-wrap gap-2 lg:flex">
                            {PREVIEW_QUESTIONS.map((q, i) => (
                                <span key={i} className="border border-border bg-surface px-2.5 py-1 text-[10px] text-muted">
                                    {q}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className="inline-flex items-center gap-2 border border-foreground px-4 py-2 text-[12px] font-black uppercase tracking-[0.08em] text-foreground transition-colors group-hover:border-accent group-hover:text-accent">
                            Fazer o quiz
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                    </div>
                </Link>
            </div>
        </section>
    )
}
