import prisma from '@/lib/prisma'

export async function renderTemplate(
    slug: string,
    vars: Record<string, string>
): Promise<{ html: string; subject: string }> {
    const tpl = await prisma.emailTemplate.findUnique({ where: { slug } })
    if (!tpl || !tpl.isActive) throw new Error(`Email template not found or inactive: ${slug}`)

    const replace = (str: string) =>
        str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')

    return {
        html: replace(tpl.htmlContent),
        subject: replace(tpl.subject),
    }
}
