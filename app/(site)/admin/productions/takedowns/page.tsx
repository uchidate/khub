import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
import { ShieldAlert, ExternalLink } from 'lucide-react'

const REASON_LABELS: Record<string, string> = {
  DMCA: 'DMCA',
  COPYRIGHT: 'Direitos Autorais',
  LEGAL_NOTICE: 'Notificação Legal',
  MANUAL: 'Manual',
}

const REASON_STYLES: Record<string, string> = {
  DMCA:         'bg-red-500/20 text-red-300 border-red-500/30',
  COPYRIGHT:    'bg-orange-500/20 text-orange-300 border-orange-500/30',
  LEGAL_NOTICE: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  MANUAL:       'bg-surface text-foreground border-border',
}

async function getActiveTakedowns() {
  return prisma.productionTakedown.findMany({
    where: { isActive: true },
    include: {
      production: { select: { id: true, titlePt: true, type: true } },
      hiddenBy: { select: { id: true, name: true, email: true } },
    },
    orderBy: { hiddenAt: 'desc' },
  })
}

export default async function TakedownsPage() {
  const session = await auth()
  if (!session) redirect('/auth/login?callbackUrl=/admin/productions/takedowns')
  if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

  const takedowns = await getActiveTakedowns()

  return (
    <AdminLayout title="Takedowns Legais" subtitle="Gerencie produções com pedidos de remoção e restrições legais">
      <div className="space-y-6">
        {/* Header info */}
        <div className="flex items-center gap-3 rounded-xl border border-red-800/30 bg-red-950/10 p-4">
          <ShieldAlert className="h-5 w-5 flex-shrink-0 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-300">
              {takedowns.length} {takedowns.length === 1 ? 'takedown ativo' : 'takedowns ativos'}
            </p>
            <p className="text-xs text-red-500/80">
              Produções ocultadas por notificação legal. Para restaurar, acesse a edição da produção.
            </p>
          </div>
        </div>

        {takedowns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldAlert className="mb-3 h-10 w-10 text-muted" />
            <p className="text-sm font-medium text-muted">Nenhum takedown ativo</p>
            <p className="mt-1 text-xs text-muted">Todas as produções estão disponíveis publicamente.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Produção</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Tipo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Motivo</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Referência</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Ocultado em</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Por</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-muted">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {takedowns.map(td => (
                  <tr key={td.id} className="bg-background hover:bg-surface transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/productions/${td.production.id}`}
                        className="font-medium text-foreground hover:text-purple-400 transition-colors"
                      >
                        {td.production.titlePt}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {td.production.type}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${REASON_STYLES[td.reason] ?? 'bg-surface text-foreground border-border'}`}>
                        {REASON_LABELS[td.reason] ?? td.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted max-w-[160px] truncate">
                      {td.noticeReference ?? <span className="text-muted">—</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                      {new Date(td.hiddenAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted max-w-[120px] truncate">
                      {td.hiddenBy.name ?? td.hiddenBy.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full border border-red-600/40 bg-red-500/15 px-2 py-0.5 text-[11px] font-black text-red-400">
                        ATIVO
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/productions/${td.production.id}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-muted hover:border-border hover:text-foreground transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
