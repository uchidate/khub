/**
 * Instagram Image Downloader
 *
 * Baixa imagens do CDN do Instagram e salva localmente em public/instagram/.
 * Isso evita dependência de URLs de CDN que expiram (~6 meses).
 *
 * Imagens servidas em: /instagram/{postId}.jpg
 * Path no filesystem: public/instagram/{postId}.jpg
 */
import fs from 'fs'
import path from 'path'

const INSTAGRAM_DIR = path.join(process.cwd(), 'public', 'instagram')

function ensureDir() {
  if (!fs.existsSync(INSTAGRAM_DIR)) {
    fs.mkdirSync(INSTAGRAM_DIR, { recursive: true })
  }
}

/**
 * Baixa a imagem de `sourceUrl` e salva em public/instagram/{postId}.jpg.
 * Retorna o caminho local "/instagram/{postId}.jpg" em caso de sucesso,
 * ou o `sourceUrl` original como fallback se o download falhar.
 */
export async function downloadInstagramImage(
  postId: string,
  sourceUrl: string
): Promise<string> {
  const ext = sourceUrl.match(/\.(jpe?g|png|webp)/i)?.[1] ?? 'jpg'
  const filename = `${postId}.${ext}`
  const localPath = path.join(INSTAGRAM_DIR, filename)
  const publicPath = `/instagram/${filename}`

  // Já existe localmente → reutiliza
  if (fs.existsSync(localPath)) {
    return publicPath
  }

  try {
    ensureDir()

    const res = await fetch(sourceUrl, {
      headers: { 'User-Agent': 'HallyuHub-Sync/1.0' },
      signal: AbortSignal.timeout(15_000),
    })

    if (!res.ok) {
      console.warn(`[instagram-img] HTTP ${res.status} para ${postId}, usando URL original`)
      return sourceUrl
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(localPath, buffer)

    return publicPath
  } catch (err) {
    console.warn(`[instagram-img] Falha ao baixar ${postId}: ${err}, usando URL original`)
    return sourceUrl
  }
}
