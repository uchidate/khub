import type { Metadata } from 'next'
import BlogPage from '../../page'
import { SITE_URL } from '@/lib/constants/site'

const BASE_URL = SITE_URL

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
    const { tag } = await params
    const decoded = decodeURIComponent(tag)
    const title = `Artigos sobre ${decoded}`
    const description = `Conteúdos do HallyuHub marcados com ${decoded}, com contexto em português para fãs de cultura coreana.`
    const canonical = `${BASE_URL}/blog/tag/${encodeURIComponent(decoded)}`
    return {
        title,
        description,
        alternates: { canonical },
        openGraph: { title: `${title} | HallyuHub`, description, url: canonical },
    }
}

export default async function BlogTagPage({ params, searchParams }: {
    params: Promise<{ tag: string }>
    searchParams: Promise<{ page?: string; sortBy?: string }>
}) {
    const [{ tag }, sp] = await Promise.all([params, searchParams])
    return <BlogPage searchParams={Promise.resolve({ ...sp, tag: decodeURIComponent(tag) })} />
}
