import Link from 'next/link'
import { Trophy, ChevronRight, Sparkles } from 'lucide-react'

const PREVIEW_QUESTIONS = [
    'Qual é o fandom do BTS?',
    'Quem estrelou Crash Landing on You?',
    'O que significa "Hallyu"?',
]

export function HomeQuizBanner() {
    return (
        <section className="bg-background py-4 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link
                    href="/quiz"
                    className="group relative flex flex-col sm:flex-row items-center gap-6 bg-surface border border-border hover:border-accent/40 rounded-2xl p-6 sm:p-8 overflow-hidden transition-all duration-300 hover:bg-surface-hover"
                >
                    {/* Glow de fundo */}
                    <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-purple-500/5 pointer-events-none" />

                    {/* Ícone */}
                    <div className="relative flex-shrink-0 w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Trophy className="w-8 h-8 text-accent" />
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-white" />
                        </div>
                    </div>

                    {/* Texto */}
                    <div className="flex-1 text-center sm:text-left">
                        <div className="inline-flex items-center gap-1.5 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-2">
                            <span className="text-[10px] font-black text-accent uppercase tracking-wider">Quiz</span>
                        </div>
                        <h2 className="text-xl font-black text-foreground mb-1 group-hover:text-accent transition-colors">
                            Quanto você sabe sobre K-Pop e K-Drama?
                        </h2>
                        <p className="text-sm text-muted mb-3">
                            10 perguntas sobre cultura coreana. Perguntas novas a cada rodada!
                        </p>
                        <div className="hidden sm:flex flex-wrap gap-2">
                            {PREVIEW_QUESTIONS.map((q, i) => (
                                <span key={i} className="text-[11px] text-muted bg-background border border-border rounded-full px-3 py-1">
                                    {q}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* CTA */}
                    <div className="flex-shrink-0">
                        <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold group-hover:opacity-90 transition-all shadow-lg shadow-accent/20">
                            Fazer o quiz
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                    </div>
                </Link>
            </div>
        </section>
    )
}
