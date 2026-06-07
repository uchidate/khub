export type HubLocale = 'pt' | 'en' | 'es' | 'th' | 'id'

export const HUB_LOCALE_BASE_PATH: Record<HubLocale, string> = {
  pt: '/hubs',
  en: '/en/hubs',
  es: '/es/hubs',
  th: '/th/hubs',
  id: '/id/hubs',
}

export const HUB_LOCALE_HTML_LANG: Record<HubLocale, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  th: 'th-TH',
  id: 'id-ID',
}

type HubIndexUiStrings = {
  metaTitle: string
  metaDescription: string
  collectionName: string
  collectionDescription: string
  eyebrow: string
  heading: string
  intro: string
}

export const HUB_INDEX_UI_STRINGS: Record<HubLocale, HubIndexUiStrings> = {
  pt: {
    metaTitle: 'Guias e hubs de K-Pop e K-Drama',
    metaDescription: 'Hubs editoriais do HallyuHub para descobrir artistas, grupos, idols, doramas e cultura coreana por tema.',
    collectionName: 'Guias e hubs HallyuHub',
    collectionDescription: 'Coleções editoriais para navegar por K-Pop, K-Drama e cultura coreana.',
    eyebrow: 'Navegação editorial',
    heading: 'Guias para descobrir o universo Hallyu',
    intro: 'Explore coleções com artistas, grupos e produções organizados por intenção de busca.',
  },
  en: {
    metaTitle: 'K-Pop and K-Drama guides and hubs',
    metaDescription: 'Editorial hubs from HallyuHub to discover artists, groups, idols, K-dramas and Korean culture by topic.',
    collectionName: 'HallyuHub guides',
    collectionDescription: 'Editorial collections to navigate K-Pop, K-Drama and Korean culture.',
    eyebrow: 'Editorial navigation',
    heading: 'Guides to discover the Hallyu universe',
    intro: 'Explore collections of artists, groups and productions organized by search intent.',
  },
  es: {
    metaTitle: 'Guías y hubs de K-Pop y K-Drama',
    metaDescription: 'Hubs editoriales de HallyuHub para descubrir artistas, grupos, idols, doramas y cultura coreana por tema.',
    collectionName: 'Guías de HallyuHub',
    collectionDescription: 'Colecciones editoriales para navegar por K-Pop, K-Drama y cultura coreana.',
    eyebrow: 'Navegación editorial',
    heading: 'Guías para descubrir el universo Hallyu',
    intro: 'Explora colecciones de artistas, grupos y producciones organizadas por intención de búsqueda.',
  },
  th: {
    metaTitle: 'คู่มือและฮับ K-Pop และ K-Drama',
    metaDescription: 'ฮับบรรณาธิการจาก HallyuHub เพื่อค้นพบศิลปิน วงดนตรี ไอดอล ซีรีส์เกาหลี และวัฒนธรรมเกาหลีตามหัวข้อ',
    collectionName: 'คู่มือ HallyuHub',
    collectionDescription: 'คอลเลกชันบรรณาธิการสำหรับสำรวจ K-Pop, K-Drama และวัฒนธรรมเกาหลี',
    eyebrow: 'การนำทางบรรณาธิการ',
    heading: 'คู่มือสำรวจโลกแห่ง Hallyu',
    intro: 'สำรวจคอลเลกชันศิลปิน วงดนตรี และผลงานที่จัดเรียงตามความตั้งใจในการค้นหา',
  },
  id: {
    metaTitle: 'Panduan dan hub K-Pop dan K-Drama',
    metaDescription: 'Hub editorial dari HallyuHub untuk menemukan artis, grup, idola, drama Korea, dan budaya Korea berdasarkan topik.',
    collectionName: 'Panduan HallyuHub',
    collectionDescription: 'Koleksi editorial untuk menjelajahi K-Pop, K-Drama, dan budaya Korea.',
    eyebrow: 'Navigasi editorial',
    heading: 'Panduan untuk menjelajahi dunia Hallyu',
    intro: 'Jelajahi koleksi artis, grup, dan produksi yang disusun berdasarkan maksud pencarian.',
  },
}

type HubUiStrings = {
  eyebrow: string
  updatedOn: (date: string) => string
  resultsSelected: (count: number) => string
  exploreProfiles: string
  emptyState: string
  faqTitle: string
  breadcrumbHubs: string
  defaultArtistSubtitle: string
  defaultGroupSubtitle: string
  defaultProductionSubtitle: string
  debutYear: (year: number) => string
}

export const HUB_UI_STRINGS: Record<HubLocale, HubUiStrings> = {
  pt: {
    eyebrow: 'Guia HallyuHub',
    updatedOn: (date) => `Atualizado em ${date}`,
    resultsSelected: (count) => `${count} resultados selecionados`,
    exploreProfiles: 'Explore os perfis',
    emptyState: 'Nenhum item encontrado para este hub no momento.',
    faqTitle: 'Perguntas frequentes',
    breadcrumbHubs: 'Hubs',
    defaultArtistSubtitle: 'Artista',
    defaultGroupSubtitle: 'Grupo K-Pop',
    defaultProductionSubtitle: 'Dorama coreano',
    debutYear: (year) => `Debut em ${year}`,
  },
  en: {
    eyebrow: 'HallyuHub Guide',
    updatedOn: (date) => `Updated on ${date}`,
    resultsSelected: (count) => `${count} curated results`,
    exploreProfiles: 'Explore the profiles',
    emptyState: 'No items found for this hub right now.',
    faqTitle: 'Frequently asked questions',
    breadcrumbHubs: 'Hubs',
    defaultArtistSubtitle: 'Artist',
    defaultGroupSubtitle: 'K-Pop group',
    defaultProductionSubtitle: 'Korean drama',
    debutYear: (year) => `Debuted in ${year}`,
  },
  es: {
    eyebrow: 'Guía HallyuHub',
    updatedOn: (date) => `Actualizado el ${date}`,
    resultsSelected: (count) => `${count} resultados seleccionados`,
    exploreProfiles: 'Explora los perfiles',
    emptyState: 'No se encontraron elementos para este hub por ahora.',
    faqTitle: 'Preguntas frecuentes',
    breadcrumbHubs: 'Hubs',
    defaultArtistSubtitle: 'Artista',
    defaultGroupSubtitle: 'Grupo de K-Pop',
    defaultProductionSubtitle: 'Drama coreano',
    debutYear: (year) => `Debut en ${year}`,
  },
  th: {
    eyebrow: 'คู่มือ HallyuHub',
    updatedOn: (date) => `อัปเดตเมื่อ ${date}`,
    resultsSelected: (count) => `คัดสรรแล้ว ${count} รายการ`,
    exploreProfiles: 'สำรวจโปรไฟล์',
    emptyState: 'ยังไม่พบรายการสำหรับฮับนี้ในตอนนี้',
    faqTitle: 'คำถามที่พบบ่อย',
    breadcrumbHubs: 'ฮับ',
    defaultArtistSubtitle: 'ศิลปิน',
    defaultGroupSubtitle: 'วง K-Pop',
    defaultProductionSubtitle: 'ซีรีส์เกาหลี',
    debutYear: (year) => `เดบิวต์ในปี ${year}`,
  },
  id: {
    eyebrow: 'Panduan HallyuHub',
    updatedOn: (date) => `Diperbarui pada ${date}`,
    resultsSelected: (count) => `${count} hasil pilihan`,
    exploreProfiles: 'Jelajahi profil',
    emptyState: 'Belum ada item yang ditemukan untuk hub ini saat ini.',
    faqTitle: 'Pertanyaan yang sering diajukan',
    breadcrumbHubs: 'Hub',
    defaultArtistSubtitle: 'Artis',
    defaultGroupSubtitle: 'Grup K-Pop',
    defaultProductionSubtitle: 'Drama Korea',
    debutYear: (year) => `Debut pada ${year}`,
  },
}

const HUB_LOCALE_DATE_LOCALE: Record<HubLocale, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  th: 'th-TH',
  id: 'id-ID',
}

export function formatHubDate(locale: HubLocale, date: Date): string {
  return date.toLocaleDateString(HUB_LOCALE_DATE_LOCALE[locale], { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
}
