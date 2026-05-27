export type AdminTelemetryArea =
  | 'Operacao'
  | 'Editorial'
  | 'Catalogo'
  | 'Negocio'
  | 'Automacao'
  | 'Sistema'

export type AdminTelemetryRoute = {
  key: string
  label: string
  area: AdminTelemetryArea
  pattern?: RegExp
}

function page(key: string, label: string, area: AdminTelemetryArea): AdminTelemetryRoute {
  return { key, label, area }
}

export const ADMIN_TELEMETRY_AREAS: Record<AdminTelemetryArea, string> = {
  Operacao: 'Operação',
  Editorial: 'Editorial',
  Catalogo: 'Catálogo',
  Negocio: 'Negócio',
  Automacao: 'Automação',
  Sistema: 'Sistema',
}

// Uma chave por tela/processo; rotas de registro individual sao normalizadas abaixo.
export const ADMIN_TELEMETRY_ROUTES: AdminTelemetryRoute[] = [
  page('/admin', 'Dashboard', 'Operacao'),
  page('/admin/inbox', 'Caixa de trabalho', 'Operacao'),
  page('/admin/processes', 'Processos e melhorias', 'Operacao'),
  page('/admin/pipeline', 'Pipeline', 'Operacao'),
  page('/admin/cron', 'Central de automação', 'Operacao'),
  page('/admin/enrichment', 'Curadoria Gemini', 'Operacao'),
  page('/admin/reports', 'Reportes', 'Operacao'),
  page('/admin/comments', 'Comentários', 'Operacao'),
  page('/admin/translations', 'Traduções', 'Operacao'),
  page('/admin/translations/log', 'Histórico de traduções', 'Operacao'),

  page('/admin/blog', 'Blog', 'Editorial'),
  page('/admin/blog/inspiration', 'Inspiração', 'Editorial'),
  page('/admin/blog/homepage', 'Homepage editorial', 'Editorial'),
  page('/admin/blog/categories', 'Categorias do blog', 'Editorial'),
  page('/admin/blog/import', 'Importar post', 'Editorial'),
  page('/admin/blog/blocks-demo', 'Guia de blocos', 'Editorial'),
  page('/admin/blog/agent', 'Agente de blog', 'Editorial'),
  page('/write', 'Editor de artigos', 'Editorial'),
  page('/admin/news', 'Notícias', 'Editorial'),
  page('/admin/news/import', 'Importar notícias', 'Editorial'),
  page('/admin/news/reprocess', 'Reprocessar notícias', 'Editorial'),
  page('/admin/trending', 'Trending', 'Editorial'),
  page('/admin/home-clusters', 'Home editorial', 'Editorial'),
  page('/admin/seo', 'SEO', 'Editorial'),
  page('/admin/tags', 'Tags', 'Editorial'),

  page('/admin/artists', 'Artistas', 'Catalogo'),
  page('/admin/artists/enrich', 'Curadoria Gemini de artistas', 'Catalogo'),
  page('/admin/artists/social-links', 'Redes sociais de artistas', 'Catalogo'),
  page('/admin/artists/visibility', 'Visibilidade de artistas', 'Catalogo'),
  page('/admin/artists/groups', 'Vínculos de grupos', 'Catalogo'),
  page('/admin/artists/duplicates', 'Duplicados de artistas', 'Catalogo'),
  page('/admin/artists/moderation', 'Moderação de artistas', 'Catalogo'),
  page('/admin/artists/fix-names', 'Correção de nomes', 'Catalogo'),
  page('/admin/artists/mb-import', 'Importação MusicBrainz', 'Catalogo'),
  page('/admin/groups', 'Grupos', 'Catalogo'),
  page('/admin/groups/enrich', 'Curadoria Gemini de grupos', 'Catalogo'),
  page('/admin/kpopping', 'Kpopping', 'Catalogo'),
  page('/admin/productions', 'Produções', 'Catalogo'),
  page('/admin/productions/sync', 'Sync de produções', 'Catalogo'),
  page('/admin/productions/enrich', 'Curadoria Gemini de produções', 'Catalogo'),
  page('/admin/productions/moderation', 'Moderação de produções', 'Catalogo'),
  page('/admin/productions/takedowns', 'Takedowns', 'Catalogo'),
  page('/admin/albums', 'Álbuns', 'Catalogo'),
  page('/admin/music-catalog', 'Catálogo musical', 'Catalogo'),
  page('/admin/agencies', 'Agências', 'Catalogo'),
  page('/admin/filmography', 'Filmografias', 'Catalogo'),
  page('/admin/streaming', 'Streaming', 'Catalogo'),

  page('/admin/analytics', 'Analytics', 'Negocio'),
  page('/admin/analytics/ga4', 'Google Analytics 4', 'Negocio'),
  page('/admin/loja', 'Loja', 'Negocio'),
  page('/admin/loja/import', 'Importar Shopee', 'Negocio'),
  page('/admin/loja/importar', 'Importar Mercado Livre', 'Negocio'),
  page('/admin/loja/cupons', 'Cupons', 'Negocio'),
  page('/admin/users', 'Usuários', 'Negocio'),
  page('/admin/emails', 'Emails', 'Negocio'),
  page('/admin/emails/templates', 'Templates de email', 'Negocio'),

  page('/admin/ai', 'IA', 'Automacao'),
  page('/admin/ai/config', 'Configuração de IA', 'Automacao'),
  page('/admin/instagram', 'Instagram Sync', 'Automacao'),
  page('/admin/instagram/status', 'Status do Instagram', 'Automacao'),
  page('/admin/image-audit', 'Auditoria de imagens', 'Automacao'),
  page('/admin/hidden', 'Central de visibilidade', 'Automacao'),

  page('/admin/activity', 'Atividade', 'Sistema'),
  page('/admin/settings', 'Configurações', 'Sistema'),
  page('/admin/bot-logs', 'Robôs', 'Sistema'),
  page('/admin/server-logs', 'Server logs', 'Sistema'),
  page('/admin/infrastructure', 'Infraestrutura', 'Sistema'),
  page('/admin/database', 'Database', 'Sistema'),

  { key: '/admin/artists/[id]/discography', label: 'Discografia de artista', area: 'Catalogo', pattern: /^\/admin\/artists\/[^/]+\/discography$/ },
  { key: '/admin/artists/[id]/enrich', label: 'Enriquecer artista individual', area: 'Catalogo', pattern: /^\/admin\/artists\/[^/]+\/enrich$/ },
  { key: '/admin/artists/[id]', label: 'Detalhe de artista', area: 'Catalogo', pattern: /^\/admin\/artists\/[^/]+$/ },
  { key: '/admin/groups/[id]/enrich', label: 'Enriquecer grupo individual', area: 'Catalogo', pattern: /^\/admin\/groups\/[^/]+\/enrich$/ },
  { key: '/admin/groups/[id]', label: 'Detalhe de grupo', area: 'Catalogo', pattern: /^\/admin\/groups\/[^/]+$/ },
  { key: '/admin/productions/[id]/enrich', label: 'Enriquecer produção individual', area: 'Catalogo', pattern: /^\/admin\/productions\/[^/]+\/enrich$/ },
  { key: '/admin/productions/[id]', label: 'Detalhe de produção', area: 'Catalogo', pattern: /^\/admin\/productions\/[^/]+$/ },
  { key: '/admin/news/[id]/edit', label: 'Editar notícia', area: 'Editorial', pattern: /^\/admin\/news\/[^/]+\/edit$/ },
  { key: '/admin/news/[id]/preview', label: 'Preview de notícia', area: 'Editorial', pattern: /^\/admin\/news\/[^/]+\/preview$/ },
  { key: '/admin/blog/[id]/history', label: 'Histórico de post', area: 'Editorial', pattern: /^\/admin\/blog\/[^/]+\/history$/ },
  { key: '/admin/emails/templates/[slug]', label: 'Editar template', area: 'Negocio', pattern: /^\/admin\/emails\/templates\/[^/]+$/ },
  { key: '/admin/emails/[id]', label: 'Detalhe de email', area: 'Negocio', pattern: /^\/admin\/emails\/[^/]+$/ },
  { key: '/admin/translations/[type]/[id]', label: 'Editar tradução', area: 'Operacao', pattern: /^\/admin\/translations\/[^/]+\/[^/]+$/ },
]

const EXACT_ROUTES = new Map(
  ADMIN_TELEMETRY_ROUTES.filter(route => !route.pattern).map(route => [route.key, route]),
)

export function resolveAdminTelemetryRoute(pathname: string): AdminTelemetryRoute | null {
  const exact = EXACT_ROUTES.get(pathname)
  if (exact) return exact
  return ADMIN_TELEMETRY_ROUTES.find(route => route.pattern?.test(pathname)) ?? null
}
