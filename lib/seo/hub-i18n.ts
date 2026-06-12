export type HubLocale = 'pt' | 'en' | 'es' | 'th' | 'id' | 'fr' | 'ja' | 'vi' | 'fil' | 'it'

export const HUB_LOCALE_BASE_PATH: Record<HubLocale, string> = {
  pt: '/hubs',
  en: '/en/hubs',
  es: '/es/hubs',
  th: '/th/hubs',
  id: '/id/hubs',
  fr: '/fr/hubs',
  ja: '/ja/hubs',
  vi: '/vi/hubs',
  fil: '/fil/hubs',
  it: '/it/hubs',
}

export const HUB_LOCALE_HTML_LANG: Record<HubLocale, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  th: 'th-TH',
  id: 'id-ID',
  fr: 'fr-FR',
  ja: 'ja-JP',
  vi: 'vi-VN',
  fil: 'fil-PH',
  it: 'it-IT',
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
  fr: {
    metaTitle: 'Guides et hubs K-Pop et K-Drama',
    metaDescription: 'Hubs éditoriaux de HallyuHub pour découvrir artistes, groupes, idols, dramas coréens et culture coréenne par thème.',
    collectionName: 'Guides HallyuHub',
    collectionDescription: 'Collections éditoriales pour naviguer dans le K-Pop, K-Drama et la culture coréenne.',
    eyebrow: 'Navigation éditoriale',
    heading: 'Guides pour découvrir l\'univers Hallyu',
    intro: 'Explorez des collections d\'artistes, groupes et productions organisées par intention de recherche.',
  },
  ja: {
    metaTitle: 'K-PopとK-Dramaのガイドとハブ',
    metaDescription: 'HallyuHubのエディトリアルハブ — アーティスト、グループ、アイドル、韓国ドラマをテーマ別に発見しよう。',
    collectionName: 'HallyuHubガイド',
    collectionDescription: 'K-Pop、K-Drama、韓国文化を探索するエディトリアルコレクション。',
    eyebrow: 'エディトリアルナビゲーション',
    heading: 'ハルリュの世界を発見するガイド',
    intro: '検索インテント別に整理されたアーティスト、グループ、作品のコレクションを探索しよう。',
  },
  vi: {
    metaTitle: 'Hướng dẫn và hub K-Pop và K-Drama',
    metaDescription: 'Hub biên tập từ HallyuHub để khám phá nghệ sĩ, nhóm nhạc, idol, phim Hàn Quốc và văn hóa Hàn Quốc theo chủ đề.',
    collectionName: 'Hướng dẫn HallyuHub',
    collectionDescription: 'Bộ sưu tập biên tập để khám phá K-Pop, K-Drama và văn hóa Hàn Quốc.',
    eyebrow: 'Điều hướng biên tập',
    heading: 'Hướng dẫn khám phá thế giới Hallyu',
    intro: 'Khám phá các bộ sưu tập nghệ sĩ, nhóm nhạc và tác phẩm được tổ chức theo mục đích tìm kiếm.',
  },
  fil: {
    metaTitle: 'Mga gabay at hub ng K-Pop at K-Drama',
    metaDescription: 'Mga editorial hub mula sa HallyuHub para tuklasin ang mga artista, grupo, idol, K-drama at kulturang Koreano sa pamamagitan ng paksa.',
    collectionName: 'Mga gabay ng HallyuHub',
    collectionDescription: 'Mga editorial na koleksyon para mag-navigate sa K-Pop, K-Drama at kulturang Koreano.',
    eyebrow: 'Editorial na nabigasyon',
    heading: 'Mga gabay para tuklasin ang mundo ng Hallyu',
    intro: 'I-explore ang mga koleksyon ng mga artista, grupo at produksyon na inayos ayon sa layunin ng paghahanap.',
  },
  it: {
    metaTitle: 'Guide e hub K-Pop e K-Drama',
    metaDescription: 'Hub editoriali di HallyuHub per scoprire artisti, gruppi, idol, drama coreani e cultura coreana per tema.',
    collectionName: 'Guide HallyuHub',
    collectionDescription: 'Collezioni editoriali per navigare nel K-Pop, K-Drama e nella cultura coreana.',
    eyebrow: 'Navigazione editoriale',
    heading: 'Guide per scoprire l\'universo Hallyu',
    intro: 'Esplora collezioni di artisti, gruppi e produzioni organizzate per intenzione di ricerca.',
  },
}

type HubUiStrings = {
  eyebrow: string
  updatedOn: (date: string) => string
  resultsSelected: (count: number) => string
  exploreProfiles: string
  emptyState: string
  faqTitle: string
  relatedTitle: string
  blogArticlesTitle: string
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
    relatedTitle: 'Guias relacionados',
    blogArticlesTitle: 'Artigos relacionados',
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
    relatedTitle: 'Related guides',
    blogArticlesTitle: 'Related articles',
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
    relatedTitle: 'Guías relacionadas',
    blogArticlesTitle: 'Artículos relacionados',
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
    relatedTitle: 'คู่มือที่เกี่ยวข้อง',
    blogArticlesTitle: 'บทความที่เกี่ยวข้อง',
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
    relatedTitle: 'Panduan terkait',
    blogArticlesTitle: 'Artikel terkait',
    breadcrumbHubs: 'Hub',
    defaultArtistSubtitle: 'Artis',
    defaultGroupSubtitle: 'Grup K-Pop',
    defaultProductionSubtitle: 'Drama Korea',
    debutYear: (year) => `Debut pada ${year}`,
  },
  fr: {
    eyebrow: 'Guide HallyuHub',
    updatedOn: (date) => `Mis à jour le ${date}`,
    resultsSelected: (count) => `${count} résultats sélectionnés`,
    exploreProfiles: 'Explorer les profils',
    emptyState: 'Aucun élément trouvé pour ce hub pour l\'instant.',
    faqTitle: 'Questions fréquentes',
    relatedTitle: 'Guides associés',
    blogArticlesTitle: 'Articles associés',
    breadcrumbHubs: 'Hubs',
    defaultArtistSubtitle: 'Artiste',
    defaultGroupSubtitle: 'Groupe K-Pop',
    defaultProductionSubtitle: 'Drama coréen',
    debutYear: (year) => `Début en ${year}`,
  },
  ja: {
    eyebrow: 'HallyuHubガイド',
    updatedOn: (date) => `${date}に更新`,
    resultsSelected: (count) => `${count}件の厳選結果`,
    exploreProfiles: 'プロフィールを探索',
    emptyState: '現在このハブのアイテムが見つかりません。',
    faqTitle: 'よくある質問',
    relatedTitle: '関連ガイド',
    blogArticlesTitle: '関連記事',
    breadcrumbHubs: 'ハブ',
    defaultArtistSubtitle: 'アーティスト',
    defaultGroupSubtitle: 'K-Popグループ',
    defaultProductionSubtitle: '韓国ドラマ',
    debutYear: (year) => `${year}年デビュー`,
  },
  vi: {
    eyebrow: 'Hướng dẫn HallyuHub',
    updatedOn: (date) => `Cập nhật ngày ${date}`,
    resultsSelected: (count) => `${count} kết quả được tuyển chọn`,
    exploreProfiles: 'Khám phá hồ sơ',
    emptyState: 'Hiện không tìm thấy mục nào cho hub này.',
    faqTitle: 'Câu hỏi thường gặp',
    relatedTitle: 'Hướng dẫn liên quan',
    blogArticlesTitle: 'Bài viết liên quan',
    breadcrumbHubs: 'Hub',
    defaultArtistSubtitle: 'Nghệ sĩ',
    defaultGroupSubtitle: 'Nhóm K-Pop',
    defaultProductionSubtitle: 'Phim Hàn Quốc',
    debutYear: (year) => `Ra mắt năm ${year}`,
  },
  fil: {
    eyebrow: 'Gabay ng HallyuHub',
    updatedOn: (date) => `Na-update noong ${date}`,
    resultsSelected: (count) => `${count} na napiling resulta`,
    exploreProfiles: 'I-explore ang mga profile',
    emptyState: 'Walang nahanap na item para sa hub na ito ngayon.',
    faqTitle: 'Mga madalas na tanong',
    relatedTitle: 'Mga kaugnay na gabay',
    blogArticlesTitle: 'Mga kaugnay na artikulo',
    breadcrumbHubs: 'Mga Hub',
    defaultArtistSubtitle: 'Artista',
    defaultGroupSubtitle: 'Grupo ng K-Pop',
    defaultProductionSubtitle: 'Koreanovela',
    debutYear: (year) => `Nag-debut noong ${year}`,
  },
  it: {
    eyebrow: 'Guida HallyuHub',
    updatedOn: (date) => `Aggiornato il ${date}`,
    resultsSelected: (count) => `${count} risultati selezionati`,
    exploreProfiles: 'Esplora i profili',
    emptyState: 'Nessun elemento trovato per questo hub al momento.',
    faqTitle: 'Domande frequenti',
    relatedTitle: 'Guide correlate',
    blogArticlesTitle: 'Articoli correlati',
    breadcrumbHubs: 'Hub',
    defaultArtistSubtitle: 'Artista',
    defaultGroupSubtitle: 'Gruppo K-Pop',
    defaultProductionSubtitle: 'Drama coreano',
    debutYear: (year) => `Debutto nel ${year}`,
  },
}

const HUB_LOCALE_DATE_LOCALE: Record<HubLocale, string> = {
  pt: 'pt-BR',
  en: 'en-US',
  es: 'es-ES',
  th: 'th-TH',
  id: 'id-ID',
  fr: 'fr-FR',
  ja: 'ja-JP',
  vi: 'vi-VN',
  fil: 'fil-PH',
  it: 'it-IT',
}

export function formatHubDate(locale: HubLocale, date: Date): string {
  return date.toLocaleDateString(HUB_LOCALE_DATE_LOCALE[locale], { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
}
