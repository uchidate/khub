import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createLogger } from '@/lib/utils/logger'

const log = createLogger('CONTATO')

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as { name?: string; email?: string; subject?: string; message?: string }

        const { name, email, subject, message } = body
        if (!name || !email || !subject || !message) {
            return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
        }
        if (message.length < 20) {
            return NextResponse.json({ error: 'Mensagem muito curta' }, { status: 400 })
        }
        // Basic email validation
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
        }

        if (!process.env.RESEND_API_KEY) {
            log.warn('RESEND_API_KEY não configurada — formulário de contato não enviado')
            return NextResponse.json({ ok: true }) // fail silently in dev
        }

        const resend = new Resend(process.env.RESEND_API_KEY)

        await resend.emails.send({
            from: 'HallyuHub Contato <no_reply@hallyuhub.com.br>',
            to: 'contato@hallyuhub.com.br',
            replyTo: email,
            subject: `[Contato] ${subject} — ${name}`,
            html: `
<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="color:#a855f7;margin-bottom:4px">Nova mensagem via formulário de contato</h2>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
  <table style="width:100%;border-collapse:collapse">
    <tr><td style="padding:6px 0;color:#6b7280;font-size:13px;width:100px">Nome</td><td style="padding:6px 0;font-size:14px;font-weight:600">${escapeHtml(name)}</td></tr>
    <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">E-mail</td><td style="padding:6px 0;font-size:14px"><a href="mailto:${escapeHtml(email)}" style="color:#a855f7">${escapeHtml(email)}</a></td></tr>
    <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Assunto</td><td style="padding:6px 0;font-size:14px">${escapeHtml(subject)}</td></tr>
  </table>
  <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0" />
  <p style="font-size:13px;color:#6b7280;margin-bottom:8px">Mensagem:</p>
  <p style="font-size:15px;line-height:1.7;white-space:pre-wrap;background:#f9fafb;border-left:3px solid #a855f7;padding:12px 16px;border-radius:4px">${escapeHtml(message)}</p>
  <p style="font-size:12px;color:#9ca3af;margin-top:24px">Enviado via hallyuhub.com.br/contato</p>
</div>
            `.trim(),
        })

        log.info('Formulário de contato enviado', { name, subject })
        return NextResponse.json({ ok: true })
    } catch (err) {
        log.error('Erro ao enviar formulário de contato', { err })
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
}

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}
