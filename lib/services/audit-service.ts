import prisma from '@/lib/prisma'

interface AuditParams {
    adminId: string
    action: string   // CREATE | UPDATE | DELETE | APPROVE | REJECT | RESEND | SEED
    entity: string   // Artist | News | User | EmailTemplate | Comment | Translation
    entityId?: string
    details?: string
    before?: unknown
    after?: unknown
    ip?: string
}

export async function logAudit(params: AuditParams): Promise<void> {
    await prisma.auditLog.create({
        data: {
            adminId: params.adminId,
            action: params.action,
            entity: params.entity,
            entityId: params.entityId,
            details: params.details,
            before: params.before ? JSON.parse(JSON.stringify(params.before)) : undefined,
            after: params.after ? JSON.parse(JSON.stringify(params.after)) : undefined,
            ip: params.ip,
        },
    }).catch(() => { /* best-effort — nunca falha a operação principal */ })
}
