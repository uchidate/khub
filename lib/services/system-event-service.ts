import prisma from '@/lib/prisma'

type Level = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export async function logSystemEvent(
    level: Level,
    source: string,
    message: string,
    metadata?: Record<string, unknown>,
): Promise<void> {
    await prisma.systemEvent.create({
        data: { level, source, message, metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined },
    }).catch(() => { /* best-effort — nunca falha a operação principal */ })
}
