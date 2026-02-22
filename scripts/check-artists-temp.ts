import prisma from '../lib/prisma'

async function main() {
  const [total, noHangul, noHangulNoPlace, sample] = await Promise.all([
    prisma.artist.count({ where: { flaggedAsNonKorean: false } }),
    prisma.artist.count({ where: { flaggedAsNonKorean: false, nameHangul: null } }),
    prisma.artist.count({ where: { flaggedAsNonKorean: false, nameHangul: null, placeOfBirth: null } }),
    prisma.artist.findMany({
      where: { flaggedAsNonKorean: false, nameHangul: null },
      select: { nameRomanized: true, placeOfBirth: true, tmdbId: true },
      take: 20,
      orderBy: { trendingScore: 'desc' }
    })
  ])
  console.log('Total artistas visíveis:', total)
  console.log('Sem nome Hangul:', noHangul)
  console.log('Sem Hangul E sem birthplace:', noHangulNoPlace)
  console.log('\nAmostra (top 20 sem Hangul, por trending):')
  sample.forEach(a => console.log(' -', a.nameRomanized, '|', a.placeOfBirth || '(sem birthplace)', '| tmdbId:', a.tmdbId))
  await prisma.$disconnect()
}
main().catch(console.error)
