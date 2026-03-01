import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AdminLayout } from '@/components/admin/AdminLayout'
import prisma from '@/lib/prisma'
import { FileText, Pencil, CheckCircle, XCircle } from 'lucide-react'

export default async function AdminEmailTemplatesPage() {
    const session = await auth()
    if (!session) redirect('/auth/login?callbackUrl=/admin/emails/templates')
    if (session.user.role?.toLowerCase() !== 'admin') redirect('/dashboard')

    const templates = await prisma.emailTemplate.findMany({
        orderBy: { slug: 'asc' },
    })

    return (
        <AdminLayout title="Templates de Email">
            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <FileText size={20} className="text-purple-400" />
                    <h1 className="text-2xl font-black text-white">Templates de Email</h1>
                </div>

                <div className="space-y-3">
                    {templates.length === 0 && (
                        <div className="glass-card p-8 text-center text-zinc-600 rounded-xl">
                            <p>Nenhum template encontrado.</p>
                            <p className="text-sm mt-1">Execute o seed para criar os templates padrão.</p>
                        </div>
                    )}
                    {templates.map(tpl => (
                        <div key={tpl.id} className="glass-card p-5 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <p className="font-black text-white">{tpl.name}</p>
                                    <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">{tpl.slug}</span>
                                    {tpl.isActive
                                        ? <CheckCircle size={13} className="text-green-400" />
                                        : <XCircle size={13} className="text-red-400" />}
                                </div>
                                <p className="text-sm text-zinc-400 truncate">{tpl.subject}</p>
                                <p className="text-[11px] text-zinc-600 mt-1">
                                    Variáveis: {tpl.variables.map(v => `{{${v}}}`).join(', ')}
                                </p>
                                <p className="text-[11px] text-zinc-700 mt-0.5">
                                    Atualizado: {new Date(tpl.updatedAt).toLocaleDateString('pt-BR')}
                                </p>
                            </div>
                            <Link
                                href={`/admin/emails/templates/${tpl.slug}`}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-bold text-sm rounded-lg transition-colors border border-purple-500/20 flex-shrink-0"
                            >
                                <Pencil size={13} />
                                Editar
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    )
}
