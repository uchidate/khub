/**
 * Email Service — Resend
 *
 * Camada centralizada de envio de email.
 * - Usa Resend API (https://resend.com)
 * - Loga TODOS os envios em EmailLog
 * - Renderiza templates do banco (EmailTemplate)
 * - Interface pública idêntica à versão anterior (Nodemailer)
 */

import { Resend } from 'resend'
import prisma from '@/lib/prisma'
import { renderTemplate } from '@/lib/email/render-template'
import { createLogger } from '@/lib/utils/logger'
import { logSystemEvent } from '@/lib/services/system-event-service'

const log = createLogger('EMAIL')

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://hallyuhub.com.br'
const FROM = 'HallyuHub <no_reply@hallyuhub.com.br>'

let resendClient: Resend | null = null

function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null
    if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY)
    return resendClient
}

// ─── Core sender ────────────────────────────────────────────────────────────

interface SendOptions {
    to: string
    type: string
    templateSlug: string
    vars: Record<string, string>
    userId?: string
    metadata?: Record<string, unknown>
}

async function send(opts: SendOptions): Promise<boolean> {
    const resend = getResend()
    if (!resend) {
        log.warn('RESEND_API_KEY não configurada — email não enviado', { type: opts.type, to: opts.to })
        return false
    }

    let subject = ''
    let html = ''

    try {
        const rendered = await renderTemplate(opts.templateSlug, opts.vars)
        subject = rendered.subject
        html = rendered.html
    } catch (err: unknown) {
        log.error('Falha ao renderizar template', { slug: opts.templateSlug, err })
        return false
    }

    // Cria log PENDING antes de enviar
    const emailLog = await prisma.emailLog.create({
        data: {
            to: opts.to,
            subject,
            type: opts.type,
            templateSlug: opts.templateSlug,
            userId: opts.userId ?? null,
            metadata: opts.metadata ? JSON.parse(JSON.stringify(opts.metadata)) : undefined,
            status: 'PENDING',
        },
    })

    try {
        const { data, error } = await resend.emails.send({ from: FROM, to: opts.to, subject, html })

        if (error) throw new Error(error.message)

        await prisma.emailLog.update({
            where: { id: emailLog.id },
            data: { status: 'SENT', resendId: data?.id ?? null, sentAt: new Date() },
        })

        log.info('Email enviado', { type: opts.type, to: opts.to, resendId: data?.id })
        return true
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        await prisma.emailLog.update({
            where: { id: emailLog.id },
            data: { status: 'FAILED', errorMessage: msg, sentAt: new Date() },
        })
        log.error('Falha ao enviar email', { type: opts.type, to: opts.to, err: msg })
        await logSystemEvent('ERROR', 'email-service', `Falha ao enviar email (${opts.type}) para ${opts.to}: ${msg}`, { type: opts.type, to: opts.to })
        return false
    }
}

// ─── Public API (mesma interface que antes) ──────────────────────────────────

export function isEmailEnabled(): boolean {
    return !!process.env.RESEND_API_KEY
}

export async function sendWelcomeEmail(to: string, userName: string, userId?: string): Promise<boolean> {
    return send({
        to,
        type: 'WELCOME',
        templateSlug: 'welcome',
        vars: { name: userName, url: SITE_URL },
        userId,
    })
}

export async function sendPasswordResetEmail(
    to: string,
    resetToken: string,
    userName?: string,
    userId?: string
): Promise<boolean> {
    const resetUrl = `${SITE_URL}/auth/reset-password?token=${resetToken}`
    return send({
        to,
        type: 'PASSWORD_RESET',
        templateSlug: 'password-reset',
        vars: { name: userName ?? 'Usuário', resetUrl, expires: '1 hora' },
        userId,
    })
}

export async function sendNewsInstantEmail(
    to: string,
    userName: string,
    newsTitle: string,
    newsId: string,
    artists: string,
    userId?: string
): Promise<boolean> {
    return send({
        to,
        type: 'NEWS_INSTANT',
        templateSlug: 'news-instant',
        vars: { name: userName, newsTitle, newsUrl: `${SITE_URL}/news/${newsId}`, artists },
        userId,
        metadata: { newsId, newsTitle },
    })
}

export async function sendNewsDigestEmail(
    to: string,
    userName: string,
    period: string,
    newsListHtml: string,
    userId?: string
): Promise<boolean> {
    return send({
        to,
        type: 'NEWS_DIGEST',
        templateSlug: 'news-digest',
        vars: { name: userName, period, newsListHtml },
        userId,
        metadata: { period },
    })
}

export async function sendManualEmail(
    to: string,
    templateSlug: string,
    vars: Record<string, string>,
    userId?: string
): Promise<boolean> {
    return send({ to, type: 'MANUAL', templateSlug, vars, userId })
}

// ─── Compat: singleton getEmailService() ────────────────────────────────────

export class EmailService {
    isEnabled() { return isEmailEnabled() }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async sendEmail(...args: unknown[]): Promise<boolean> {
        log.warn('sendEmail() direto foi depreciado — use as funções específicas')
        return false
    }

    async sendWelcomeEmail(to: string, userName: string) {
        return sendWelcomeEmail(to, userName)
    }

    async sendPasswordResetEmail(to: string, resetToken: string, userName?: string) {
        return sendPasswordResetEmail(to, resetToken, userName)
    }

    async sendNotificationEmail(to: string, subject: string, message: string) {
        return send({
            to,
            type: 'MANUAL',
            templateSlug: 'news-instant',
            vars: { name: 'Usuário', newsTitle: subject, newsUrl: SITE_URL, artists: message },
        })
    }

    async testConnection(): Promise<boolean> {
        const resend = getResend()
        if (!resend) {
            log.error('RESEND_API_KEY não configurada')
            return false
        }
        log.info('Resend configurado corretamente')
        return true
    }
}

let _instance: EmailService | null = null
export function getEmailService(): EmailService {
    if (!_instance) _instance = new EmailService()
    return _instance
}
