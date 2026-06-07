import type { Metadata } from 'next'
import { QuizClient } from './QuizClient'
import { JsonLd } from '@/components/seo/JsonLd'
import { QuizTrivia } from './QuizTrivia'
import prisma from '@/lib/prisma'
import { SITE_URL } from '@/lib/constants/site'

export const revalidate = 3600

const BASE_URL = SITE_URL

export const metadata: Metadata = {
    title: 'Quiz K-Pop e K-Drama — Teste seus conhecimentos',
    description: 'Teste seus conhecimentos sobre K-Pop, K-Drama, cultura coreana e história. Perguntas de diferentes dificuldades com placar e estatísticas.',
    keywords: ['quiz kpop', 'quiz kdrama', 'teste kpop', 'perguntas kpop', 'quiz cultura coreana', 'trivia kpop'],
    alternates: { canonical: `${BASE_URL}/quiz` },
    openGraph: {
        title: 'Quiz K-Pop e K-Drama — Teste seus conhecimentos!',
        description: 'Quantas perguntas sobre K-Pop e K-Drama você acerta? Faça o quiz agora no HallyuHub.',
        url: `${BASE_URL}/quiz`,
    },
}

async function getQuestionsForSeo() {
    if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
    return prisma.quizQuestion.findMany({
        where: { isActive: true },
        select: { id: true, question: true, options: true, correct: true, explanation: true, category: true, difficulty: true },
        orderBy: [{ category: 'asc' }, { difficulty: 'asc' }],
        take: 60,
    })
}

export default async function QuizPage() {
    const questions = await getQuestionsForSeo()

    const faqSchema = questions.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.slice(0, 20).map(q => {
            const opts = q.options as string[]
            return {
                '@type': 'Question',
                name: q.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: `${opts[q.correct]}. ${q.explanation}`,
                },
            }
        }),
    } : null

    const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: BASE_URL },
            { '@type': 'ListItem', position: 2, name: 'Quiz', item: `${BASE_URL}/quiz` },
        ],
    }

    return (
        <>
            <JsonLd data={breadcrumbSchema} />
            {faqSchema && <JsonLd data={faqSchema} />}
            <QuizClient />
            {questions.length > 0 && <QuizTrivia questions={questions} />}
        </>
    )
}
