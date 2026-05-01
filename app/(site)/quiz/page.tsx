import type { Metadata } from 'next'
import { QuizClient } from './QuizClient'

export const metadata: Metadata = {
    title: 'Quiz K-Pop e K-Drama | HallyuHub',
    description: 'Teste seus conhecimentos sobre K-Pop, K-Drama e cultura coreana. Quantas perguntas você acerta?',
    openGraph: {
        title: 'Quiz K-Pop e K-Drama — Teste seus conhecimentos!',
        description: 'Quantas perguntas sobre K-Pop e K-Drama você acerta? Faça o quiz agora no HallyuHub.',
    },
}

export default function QuizPage() {
    return <QuizClient />
}
