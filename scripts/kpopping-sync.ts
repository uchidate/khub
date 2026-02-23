/**
 * Script: Sincroniza idols, grupos e membros do kpopping.com via JSON API
 *
 * Uso:
 *   npx tsx scripts/kpopping-sync.ts                # Sync completo: idols + grupos + links
 *   npx tsx scripts/kpopping-sync.ts --only=idols   # Só idols
 *   npx tsx scripts/kpopping-sync.ts --only=groups  # Só grupos + IdolInGroup
 *   npx tsx scripts/kpopping-sync.ts --dry-run      # Simula sem salvar
 *   npx tsx scripts/kpopping-sync.ts --limit=2000    # Limita N idols E N grupos
 *   npx tsx scripts/kpopping-sync.ts --offset=2000  # Pula os primeiros N (para batches)
 *   npx tsx scripts/kpopping-sync.ts --slug=Jisoo   # Inspeciona um idol específico
 *
 * Banco separado:
 *   Requer KPOPPING_DATABASE_URL no .env
 *   Ex: postgresql://hallyuhub:pass@postgres-production:5432/kpopping_db
 */

import 'dotenv/config'
import { PrismaClient } from '../node_modules/.prisma/kpopping-client'
import { PrismaPg } from '@prisma/adapter-pg'

// ============================================================================
// Config
// ============================================================================
const KPOPPING_API = 'https://kpopping.com/api'
const DELAY_MS = 300

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const onlyArg = args.find(a => a.startsWith('--only='))?.split('=')[1] // 'idols' | 'groups'
const limitArg = args.find(a => a.startsWith('--limit='))?.split('=')[1]
const offsetArg = args.find(a => a.startsWith('--offset='))?.split('=')[1]
const slugArg = args.find(a => a.startsWith('--slug='))?.split('=')[1]
const LIMIT = limitArg ? parseInt(limitArg) : Infinity
const OFFSET = offsetArg ? parseInt(offsetArg) : 0

const syncIdols = !onlyArg || onlyArg === 'idols'
const syncGroups = !onlyArg || onlyArg === 'groups'

// ============================================================================
// DB
// ============================================================================
const dbUrl = process.env.KPOPPING_DATABASE_URL
if (!isDryRun && !slugArg && !dbUrl) {
  console.error('❌ KPOPPING_DATABASE_URL não configurada no .env')
  process.exit(1)
}
const adapter = dbUrl ? new PrismaPg({ connectionString: dbUrl }) : null
const db = adapter ? new PrismaClient({ adapter }) : null as any

// ============================================================================
// HTTP
// ============================================================================
const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: HEADERS })
    if (res.status === 429) {
      console.warn('  Rate limit! Aguardando 15s...')
      await sleep(15000)
      return fetchJson(url)
    }
    if (!res.ok) {
      console.warn(`  HTTP ${res.status} para ${url}`)
      return null
    }
    return res.json() as Promise<T>
  } catch (err: any) {
    console.warn(`  Erro: ${err.message}`)
    return null
  }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// API Types
// ============================================================================
interface IdolListItem {
  id: string
  slug: string
  stageName: string
  fullName: string | null
  image: string | null
  birthdate: string | null
  gender: string | null
  country: string | null
  status: string | null
  groupName: string | null
}

interface IdolDetail extends IdolListItem {
  nativeName: string | null
  debutDate: string | null
  hometown: string | null
  height: number | null
  weight: number | null
  bloodType: string | null
  mbti: string | null
  education: string | null
  fandomName: string | null
  fandomColors: string | null // JSON string
  bioRaw: string | null
}

interface GroupListItem {
  id: string
  slug: string
  name: string
  image: string | null
  debutDate: string | null
  agency: string | null
  status: string | null
}

interface GroupMember {
  id: string
  slug: string
  name: string
  koreanName: string | null
  position: string | null
  birthday: string | null
  nationality: string | null
  image: string | null
}

interface GroupDetail extends GroupListItem {
  koreanName: string | null
  nativeName: string | null
  groupType: string | null
  company: string | null
  disbandDate: string | null
  fandomName: string | null
  fandom: string | null
  fandomColors: Array<{ hex: string; name: string }> | null
  memberCount: number | null
  bioRaw: string | null
  members: GroupMember[]
  formerMembers: GroupMember[]
}

// ============================================================================
// Helpers
// ============================================================================
function parseDate(raw: string | null | undefined): Date | null {
  if (!raw || raw.trim() === '') return null
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

// ============================================================================
// API Calls
// ============================================================================
async function fetchAllIdols(): Promise<IdolListItem[]> {
  console.log('📋 Buscando lista de idols via API...')
  const data = await fetchJson<IdolListItem[]>(`${KPOPPING_API}/idols`)
  if (!data || !Array.isArray(data)) {
    console.error('❌ Resposta inesperada de /api/idols')
    return []
  }
  console.log(`   ${data.length} idols encontrados`)
  return data
}

async function fetchIdolDetail(slug: string): Promise<IdolDetail | null> {
  return fetchJson<IdolDetail>(`${KPOPPING_API}/idols/${encodeURIComponent(slug)}`)
}

async function fetchAllGroups(): Promise<GroupListItem[]> {
  console.log('📋 Buscando lista de grupos via API...')
  const data = await fetchJson<GroupListItem[]>(`${KPOPPING_API}/groups`)
  if (!data || !Array.isArray(data)) {
    console.error('❌ Resposta inesperada de /api/groups')
    return []
  }
  console.log(`   ${data.length} grupos encontrados`)
  return data
}

async function fetchGroupDetail(slug: string): Promise<GroupDetail | null> {
  return fetchJson<GroupDetail>(`${KPOPPING_API}/groups/${encodeURIComponent(slug)}`)
}

// ============================================================================
// Sync idol
// ============================================================================
async function syncIdol(slug: string, listItem?: IdolListItem): Promise<boolean> {
  const detail = await fetchIdolDetail(slug)
  if (!detail && !listItem) return false

  const fandomColorsRaw = detail?.fandomColors
  let fandomColors = null
  if (fandomColorsRaw) {
    try { fandomColors = JSON.parse(fandomColorsRaw) } catch { /* ignore */ }
  }

  const data = {
    slug,
    nameRomanized: detail?.stageName || listItem?.stageName || slug,
    nameHangul: detail?.nativeName || null,
    fullName: detail?.fullName || listItem?.fullName || null,
    birthday: parseDate(detail?.birthdate || listItem?.birthdate),
    height: detail?.height ?? null,
    weight: detail?.weight ?? null,
    bloodType: detail?.bloodType || null,
    mbti: detail?.mbti || null,
    debutDate: parseDate(detail?.debutDate),
    education: detail?.education || null,
    hometown: detail?.hometown || null,
    country: detail?.country || listItem?.country || null,
    gender: detail?.gender || listItem?.gender || null,
    status: detail?.status || listItem?.status || null,
    fandomName: detail?.fandomName || null,
    fandomColors,
    bio: detail?.bioRaw || null,
    imageUrl: detail?.image || listItem?.image || null,
    profileUrl: `https://kpopping.com/profiles/idol/${slug}`,
  }

  console.log(
    `  ✅ ${data.nameRomanized}${data.nameHangul ? ' (' + data.nameHangul + ')' : ''}` +
    `${data.mbti ? ' · ' + data.mbti : ''}` +
    `${data.height ? ' · ' + data.height + 'cm' : ''}`
  )

  if (!isDryRun && db) {
    await db.idol.upsert({
      where: { slug },
      update: { ...data, updatedAt: new Date() },
      create: data,
    })
  }

  return true
}

// ============================================================================
// Sync group + IdolInGroup
// ============================================================================
async function syncGroup(slug: string, listItem?: GroupListItem): Promise<boolean> {
  const detail = await fetchGroupDetail(slug)
  if (!detail && !listItem) return false

  const data = {
    slug,
    name: detail?.name || listItem?.name || slug,
    nameHangul: detail?.koreanName || detail?.nativeName || null,
    groupType: detail?.groupType || null,
    status: detail?.status || listItem?.status || null,
    agency: detail?.company || listItem?.agency || null,
    debutDate: parseDate(detail?.debutDate || listItem?.debutDate),
    disbandDate: parseDate(detail?.disbandDate),
    fandomName: detail?.fandomName || detail?.fandom || null,
    fandomColors: detail?.fandomColors ?? null,
    memberCount: detail?.memberCount ?? null,
    bio: detail?.bioRaw || null,
    imageUrl: detail?.image || listItem?.image || null,
  }

  console.log(
    `  ✅ ${data.name}${data.nameHangul ? ' (' + data.nameHangul + ')' : ''}` +
    `${data.groupType ? ' · ' + data.groupType : ''}` +
    `${data.memberCount ? ' · ' + data.memberCount + ' membros' : ''}`
  )

  if (!isDryRun && db) {
    await db.group.upsert({
      where: { slug },
      update: { ...data, updatedAt: new Date() },
      create: data,
    })

    // Vincular membros (ativos e ex-membros)
    if (detail) {
      const allMembers = [
        ...detail.members.map(m => ({ ...m, isActive: true })),
        ...detail.formerMembers.map(m => ({ ...m, isActive: false })),
      ]

      for (const member of allMembers) {
        const idol = await db.idol.findUnique({ where: { slug: member.slug } })
        if (!idol) continue

        const group = await db.group.findUnique({ where: { slug } })
        if (!group) continue

        await db.idolInGroup.upsert({
          where: { idolId_groupId: { idolId: idol.id, groupId: group.id } },
          update: { isActive: member.isActive, position: member.position || null },
          create: {
            idolId: idol.id,
            groupId: group.id,
            isActive: member.isActive,
            position: member.position || null,
          },
        })
      }
    }
  }

  return true
}

// ============================================================================
// Main
// ============================================================================
async function main() {
  console.log('🎤 Kpopping Sync (JSON API)')
  console.log(`   Dry run: ${isDryRun}`)
  console.log(`   Modo:    ${onlyArg ?? 'completo (idols + grupos)'}`)
  if (OFFSET > 0) console.log(`   Offset:  ${OFFSET}`)
  if (LIMIT !== Infinity) console.log(`   Limite:  ${LIMIT}`)
  if (slugArg) console.log(`   Slug:    ${slugArg}`)

  // Modo single (inspecionar um idol)
  if (slugArg) {
    const detail = await fetchIdolDetail(slugArg)
    if (detail) {
      console.log('\nDados da API:')
      console.log(JSON.stringify(detail, null, 2))
    } else {
      console.log(`❌ Idol "${slugArg}" não encontrado`)
    }
    await db?.$disconnect()
    return
  }

  // ── Sync idols ──────────────────────────────────────────────────────────
  if (syncIdols) {
    console.log('\n🎤 Sincronizando idols...')
    const allIdols = await fetchAllIdols()
    if (allIdols.length === 0) {
      console.error('❌ Nenhum idol encontrado. Abortando.')
      process.exit(1)
    }

    const toSync = allIdols.slice(OFFSET, OFFSET + (LIMIT === Infinity ? allIdols.length : LIMIT))
    let done = 0, fail = 0
    for (let i = 0; i < toSync.length; i++) {
      const item = toSync[i]
      process.stdout.write(`[${i + 1}/${toSync.length}] ${item.slug} `)
      const ok = await syncIdol(item.slug, item)
      ok ? done++ : fail++
      if (i < toSync.length - 1) await sleep(DELAY_MS)
    }

    console.log(`\n   Idols: ${done} sincronizados | ${fail} falhos`)
  }

  // ── Sync grupos + IdolInGroup ──────────────────────────────────────────
  if (syncGroups) {
    console.log('\n🎵 Sincronizando grupos...')
    const allGroups = await fetchAllGroups()
    if (allGroups.length === 0) {
      console.error('❌ Nenhum grupo encontrado.')
    } else {
      const toSync = allGroups.slice(OFFSET, OFFSET + (LIMIT === Infinity ? allGroups.length : LIMIT))
      let done = 0, fail = 0
      for (let i = 0; i < toSync.length; i++) {
        const item = toSync[i]
        process.stdout.write(`[${i + 1}/${toSync.length}] ${item.slug} `)
        const ok = await syncGroup(item.slug, item)
        ok ? done++ : fail++
        if (i < toSync.length - 1) await sleep(DELAY_MS)
      }

      console.log(`\n   Grupos: ${done} sincronizados | ${fail} falhos`)
    }
  }

  console.log('\n✅ Concluído!')
  if (isDryRun) console.log('   ⚠️  Dry run — nenhuma alteração salva')

  await db?.$disconnect()
}

main().catch(async err => {
  console.error('❌ Erro:', err)
  await db?.$disconnect()
  process.exit(1)
})
