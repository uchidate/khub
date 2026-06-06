import type { Metadata } from 'next'
import BlogPage from '../../page'
import { SITE_URL } from '@/lib/constants/site'
import { BLOG_CATEGORY_BY_SLUG } from '@/lib/config/categories'

const BASE_URL = SITE_URL

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
    const category = BLOG_CATEGORY_BY_SLUG[slug]
    const title = category ? `${category.name} no HallyuHub` : `Categoria ${slug}`
    const description = category
        ? `Artigos, guias e listas sobre ${category.name}, K-Pop, K-Drama e cultura coreana em português.`
        : `Artigos do HallyuHub na categoria ${slug}.`
    const canonical = `${BASE_URL}/blog/category/${slug}`
    return {
        title,
        description,
        alternates: { canonical },
        openGraph: { title: `${title} | HallyuHub`, description, url: canonical },
    }
}

export default async function BlogCategoryPage({ params, searchParams }: {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ page?: string; sortBy?: string }>
}) {
    const [{ slug }, sp] = await Promise.all([params, searchParams])
    return <BlogPage searchParams={Promise.resolve({ ...sp, category: slug })} />
}
