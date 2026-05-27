import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { AdminLinkButton, AdminEmptyState } from '@/components/admin'
import prisma from '@/lib/prisma'

import { Pencil, CheckCircle, XCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminEmailTemplatesPage() {
    const session = await auth()
    if (!session) redirect('/auth/login?callbackUrl=/admin/emails/templates')
    if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

    const templates = await prisma.emailTemplate.findMany({
        orderBy: { slug: 'asc' },
    })

    return (
        <AdminLayout title="Templates de Email" hideTitle>
            <div className="space-y-3">
                    {templates.length === 0 && (
                        <AdminEmptyState
                            title="Nenhum template encontrado"
                            description="Execute o seed para criar os templates padrão."
                            size="sm"
                        />
                    )}
                    {templates.map(tpl => (
                        <div key={tpl.id} className="bg-surface p-5 rounded-xl border border-border flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-black text-foreground">{tpl.name}</p>
                                    <span className="text-[10px] font-mono text-muted bg-surface px-1.5 py-0.5 rounded">{tpl.slug}</span>
                                    {tpl.isActive
                                        ? <CheckCircle size={13} className="text-green-400" />
                                        : <XCircle size={13} className="text-red-400" />}
                                </div>
                                <p className="text-sm text-muted truncate">{tpl.subject}</p>
                                <p className="text-[11px] text-muted mt-1">
                                    Variáveis: {tpl.variables.map(v => `{{${v}}}`).join(', ')}
                                </p>
                                <p className="text-[11px] text-muted mt-0.5">
                                    Atualizado: {new Date(tpl.updatedAt).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <AdminLinkButton href={`/admin/emails/templates/${tpl.slug}`} variant="primary">
                                <Pencil size={13} />
                                Editar
                            </AdminLinkButton>
                        </div>
                    ))}
            </div>
        </AdminLayout>
    )
}
