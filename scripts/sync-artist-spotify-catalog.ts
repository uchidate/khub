import prisma from '@/lib/prisma'
import { syncSpotifyCatalogForArtist } from '@/lib/services/spotify-catalog-sync-service'
import { getPublicMusicCatalog } from '@/lib/music/public-music-catalog'

type Args = {
  artist?: string
  maxReleases: number
  includeTracks: boolean
}

function parseArgs(argv: string[]): Args {
  const args: Args = { maxReleases: 12, includeTracks: true }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--artist') args.artist = argv[++i]
    else if (arg === '--max-releases') args.maxReleases = Number(argv[++i])
    else if (arg === '--releases-only') args.includeTracks = false
    else if (arg === '--with-tracks') args.includeTracks = true
    else if (arg === '--help') {
      printUsage()
      process.exit(0)
    }
  }
  if (!args.artist) throw new Error('Informe --artist com id ou slug do artista')
  if (!Number.isFinite(args.maxReleases) || args.maxReleases < 1) {
    throw new Error('--max-releases deve ser um numero positivo')
  }
  args.maxReleases = Math.floor(args.maxReleases)
  return args
}

function printUsage() {
  console.log([
    'Uso:',
    '  npx tsx scripts/sync-artist-spotify-catalog.ts --artist lee-ji-eun --max-releases 12 --releases-only',
    '',
    'Opcoes:',
    '  --artist <id|slug>       Artista a sincronizar',
    '  --max-releases <n>       Limite aplicado na origem Spotify',
    '  --releases-only          Sincroniza releases sem buscar faixas',
    '  --with-tracks            Sincroniza releases e faixas',
  ].join('\n'))
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const artist = await prisma.artist.findFirst({
    where: {
      OR: [
        { id: args.artist },
        { slug: args.artist },
      ],
    },
    select: { id: true, slug: true, nameRomanized: true },
  })
  if (!artist) throw new Error(`Artista nao encontrado: ${args.artist}`)

  const before = await getPublicMusicCatalog({ artistId: artist.id }, args.maxReleases)
  const result = await syncSpotifyCatalogForArtist(artist.id, {
    maxReleases: args.maxReleases,
    includeTracks: args.includeTracks,
  })
  const after = await getPublicMusicCatalog({ artistId: artist.id }, args.maxReleases)

  console.log(JSON.stringify({
    artist,
    mode: args.includeTracks ? 'with_tracks' : 'releases_only',
    maxReleases: args.maxReleases,
    before: {
      profileLinks: before.profileLinks.length,
      releases: before.releases.length,
      tracks: before.releases.reduce((sum, release) => sum + release.tracks.length, 0),
    },
    result,
    after: {
      profileLinks: after.profileLinks.length,
      releases: after.releases.length,
      tracks: after.releases.reduce((sum, release) => sum + release.tracks.length, 0),
      sample: after.releases.slice(0, 5).map(release => ({
        title: release.title,
        type: release.type,
        releaseDate: release.releaseDate,
        links: release.links.map(link => link.platform),
        tracks: release.tracks.length,
      })),
    },
  }, null, 2))
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
