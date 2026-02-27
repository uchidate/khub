import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Clock, User } from 'lucide-react'
import { AdminLayout } from '@/components/admin/AdminLayout'
import prisma from '@/lib/prisma'

export default async function AdminActivityPage() {
  const session = await auth()

  if (!session) {
    redirect('/auth/login?callbackUrl=/admin/activity')
  }

  if (session.user.role?.toLowerCase() !== 'admin') {
    redirect('/dashboard')
  }

  // Get recent users as activity
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      role: true,
    },
  })

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''} atrás`
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hora${hours !== 1 ? 's' : ''} atrás`
    } else {
      const days = Math.floor(diffInMinutes / 1440)
      return `${days} dia${days !== 1 ? 's' : ''} atrás`
    }
  }

  return (
    <AdminLayout title="Atividade do Sistema">
      <div className="space-y-6">
        <p className="text-zinc-400 text-sm -mt-6">Monitore logs e atividades recentes</p>

        {/* Recent Activity */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Usuários Recentes</h2>
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between py-4 border-t border-zinc-800 first:border-t-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <User className="text-purple-500" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{user.name || 'Sem nome'}</p>
                    <p className="text-sm text-zinc-500">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Clock size={14} />
                    {formatTimeAgo(user.createdAt)}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.role?.toLowerCase() === 'admin'
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {user.role?.toLowerCase() === 'admin' ? 'Admin' : 'Usuário'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <p className="text-sm text-blue-400">
            💡 Logs avançados e rastreamento de atividades estarão disponíveis em breve.
          </p>
        </div>
      </div>
    </AdminLayout>
  )
}
