import sitemap from './app/sitemap'
import prisma from './lib/prisma'

async function test() {
    try {
        console.log('Testing sitemap generation...')
        const result = await sitemap()
        console.log('Result length:', result.length)
        console.log('Sample item:', result[0])
    } catch (error) {
        console.error('Sitemap Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

test()
