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

const IGNORED_DIFF_FIELDS = new Set(['updatedAt'])

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalize(value: unknown) {
    if (value instanceof Date) return value.toISOString()
    return JSON.stringify(value ?? null)
}

export function getChangedAuditFields(before: unknown, after: unknown): string[] {
    if (!isPlainObject(before) || !isPlainObject(after)) return []

    const keys = new Set([...Object.keys(before), ...Object.keys(after)])
    return Array.from(keys)
        .filter(key => !IGNORED_DIFF_FIELDS.has(key))
        .filter(key => normalize(before[key]) !== normalize(after[key]))
}

export function buildAuditChangeDetails(prefix: string, before: unknown, after: unknown): string {
    const changed = getChangedAuditFields(before, after)
    if (changed.length === 0) return prefix

    const visible = changed.slice(0, 8)
    const suffix = changed.length > visible.length ? ` +${changed.length - visible.length}` : ''
    return `${prefix} — campos: ${visible.join(', ')}${suffix}`
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
