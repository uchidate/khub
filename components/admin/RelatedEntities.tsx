import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, ExternalLink } from 'lucide-react'

/**
 * RelatedEntities
 *
 * Painel lateral para mostrar entidades relacionadas nas páginas de detalhe.
 * Ex: na página de um artista, mostra grupos, álbuns e produções associadas.
 *
 * Uso:
 *   <RelatedEntities.Panel title="Grupos">
 *     {groups.map(g => (
 *       <RelatedEntities.Item
 *         key={g.id}
 *         title={g.name}
 *         subtitle={g.nameHangul}
 *         imageUrl={g.profileImageUrl}
 *         href={`/admin/groups/${g.id}`}
 *       />
 *     ))}
 *   </RelatedEntities.Panel>
 */

interface RelatedItem {
  id: string
  title: string
  subtitle?: string | null
  imageUrl?: string | null
  href: string
  badge?: string
}

function Panel({
  title,
  count,
  viewAllHref,
  children,
  empty,
}: {
  title: string
  count?: number
  viewAllHref?: string
  children?: React.ReactNode
  empty?: string
}) {
  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {count !== undefined && (
            <span className="text-xs text-muted bg-surface px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
          >
            Ver todos
            <ExternalLink size={11} />
          </Link>
        )}
      </div>

      {children ? (
        <div className="divide-y divide-border">{children}</div>
      ) : (
        <div className="px-4 py-5 text-sm text-muted text-center">
          {empty ?? 'Nenhum item'}
        </div>
      )}
    </div>
  )
}

function Item({ title, subtitle, imageUrl, href, badge }: RelatedItem) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover transition-colors group"
    >
      <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-surface border border-border flex items-center justify-center">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            width={28}
            height={28}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-surface" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-foreground group-hover:text-foreground transition-colors truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-muted truncate">{subtitle}</div>
        )}
      </div>
      {badge && (
        <span className="text-[10px] text-muted bg-surface px-1.5 py-0.5 rounded flex-shrink-0">
          {badge}
        </span>
      )}
      <ChevronRight size={13} className="text-muted group-hover:text-muted transition-colors flex-shrink-0" />
    </Link>
  )
}

function SimpleItem({
  label,
  value,
}: {
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0">
      <span className="text-xs text-muted">{label}</span>
      <span className="text-xs text-foreground font-medium">{value}</span>
    </div>
  )
}

export const RelatedEntities = { Panel, Item, SimpleItem }
