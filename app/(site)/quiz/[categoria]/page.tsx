import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { QuizClient } from '../QuizClient'
import { JsonLd } from '@/components/seo/JsonLd'
import { QuizTrivia } from '../QuizTrivia'
import prisma from '@/lib/prisma'
import { SITE_URL } from '@/lib/constants/site'

export const revalidate = 3600

const BASE_URL = SITE_URL

const CATEGORIES = {
    'k-pop': {
        dbSlug: 'k-pop',
        label: 'K-Pop',
        title: 'Quiz de K-Pop — Teste seus conhecimentos sobre K-Pop',
        description: 'Teste seus conhecimentos sobre K-Pop: grupos, idols, músicas, comebacks e muito mais. Quiz em português com perguntas de diferentes dificuldades.',
        keywords: ['quiz kpop', 'teste kpop', 'perguntas kpop', 'trivia kpop', 'quiz idols', 'perguntas sobre kpop'],
    },
    'k-drama': {
        dbSlug: 'k-drama',
        label: 'K-Drama',
        title: 'Quiz de K-Drama — Teste seus conhecimentos sobre doramas',
        description: 'Teste seus conhecimentos sobre K-Dramas: séries, atores, personagens, enredos e curiosidades. Quiz de doramas coreanos em português.',
        keywords: ['quiz kdrama', 'teste kdrama', 'perguntas doramas', 'trivia kdrama', 'quiz séries coreanas', 'perguntas sobre doramas'],
    },
    'cultura': {
        dbSlug: 'cultura',
        label: 'Cultura Coreana',
        title: 'Quiz de Cultura Coreana — Teste seus conhecimentos',
        description: 'Teste seus conhecimentos sobre cultura coreana: tradições, gastronomia, idioma, costumes e tudo que envolve o Hallyu. Quiz em português.',
        keywords: ['quiz cultura coreana', 'teste cultura coreia', 'perguntas coreia', 'trivia coreia', 'quiz hallyu'],
    },
    'historia': {
        dbSlug: 'história',
        label: 'História da Coreia',
        title: 'Quiz de História da Coreia — Teste seus conhecimentos',
        description: 'Teste seus conhecimentos sobre a história da Coreia: dinastias, eventos históricos, personagens e marcos que moldaram o país. Quiz em português.',
        keywords: ['quiz história coreia', 'teste história coreana', 'perguntas história coreia', 'trivia história coreia'],
    },
}

export async function generateStaticParams() {
    return Object.keys(CATEGORIES).map(c => ({ categoria: c }))
}

export async function generateMetadata({ params }: { params: Promise<{ categoria: string }> }): Promise<Metadata> {
    const { categoria } = await params
    const cat = CATEGORIES[categoria as keyof typeof CATEGORIES]
    if (!cat) return {}
    const canonical = `${BASE_URL}/quiz/${categoria}`
    return {
        title: cat.title,
        description: cat.description,
        keywords: cat.keywords,
        alternates: { canonical },
        openGraph: {
            title: `${cat.title} | HallyuHub`,
            description: cat.description,
            url: canonical,
        },
    }
}

async function getQuestionsForSeo(dbSlug: string) {
    if (process.env.SKIP_BUILD_STATIC_GENERATION) return []
    return prisma.quizQuestion.findMany({
        where: { isActive: true, category: dbSlug },
        select: { id: true, question: true, options: true, correct: true, explanation: true, category: true, difficulty: true },
        orderBy: { difficulty: 'asc' },
        take: 50,
    })
}

export default async function QuizCategoryPage({ params }: { params: Promise<{ categoria: string }> }) {
    const { categoria } = await params
    const cat = CATEGORIES[categoria as keyof typeof CATEGORIES]
    if (!cat) notFound()

    const questions = await getQuestionsForSeo(cat.dbSlug)

    const faqSchema = questions.length > 0 ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: questions.slice(0, 15).map(q => {
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
            { '@type': 'ListItem', position: 3, name: cat.label, item: `${BASE_URL}/quiz/${categoria}` },
        ],
    }

    return (
        <>
            <JsonLd data={breadcrumbSchema} />
            {faqSchema && <JsonLd data={faqSchema} />}
            <QuizClient initialCategory={cat.dbSlug as 'k-pop' | 'k-drama' | 'cultura' | 'história'} />
            {questions.length > 0 && <QuizTrivia questions={questions} />}
        </>
    )
}
