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
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
          {count !== undefined && (
            <span className="text-xs text-zinc-600 bg-zinc-800 px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        {viewAllHref && (
          <Link
            href={viewAllHref}
            className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            Ver todos
            <ExternalLink size={11} />
          </Link>
        )}
      </div>

      {children ? (
        <div className="divide-y divide-zinc-800/50">{children}</div>
      ) : (
        <div className="px-4 py-5 text-sm text-zinc-600 text-center">
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
      className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/50 transition-colors group"
    >
      <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800 border border-zinc-700/50 flex items-center justify-center">
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
          <div className="w-full h-full bg-zinc-700/50" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-zinc-300 group-hover:text-white transition-colors truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-zinc-600 truncate">{subtitle}</div>
        )}
      </div>
      {badge && (
        <span className="text-[10px] text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded flex-shrink-0">
          {badge}
        </span>
      )}
      <ChevronRight size={13} className="text-zinc-700 group-hover:text-zinc-400 transition-colors flex-shrink-0" />
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
    <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/50 last:border-0">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs text-zinc-300 font-medium">{value}</span>
    </div>
  )
}

export const RelatedEntities = { Panel, Item, SimpleItem }
