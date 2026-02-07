/**
 * Email Service - Hostinger SMTP
 *
 * Serviço centralizado para envio de emails usando Nodemailer + Hostinger
 *
 * Uso:
 * - Reset de senha
 * - Notificações para usuários
 * - Emails transacionais
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailOptions {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        content?: string | Buffer;
        path?: string;
    }>;
}

interface EmailConfig {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
    from: string;
    fromName: string;
}

/**
 * Serviço de Email usando SMTP Hostinger
 */
export class EmailService {
    private transporter: Transporter | null = null;
    private config: EmailConfig;
    private enabled: boolean;

    constructor() {
        // Carregar configurações do ambiente
        this.config = {
            host: process.env.SMTP_HOST || 'smtp.hostinger.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // false para porta 587 (TLS)
            user: process.env.SMTP_USER || '',
            password: process.env.SMTP_PASSWORD || '',
            from: process.env.SMTP_FROM || 'no_reply@hallyuhub.com.br',
            fromName: process.env.SMTP_FROM_NAME || 'HallyuHub',
        };

        // Verificar se está configurado
        this.enabled = !!(this.config.user && this.config.password);

        if (!this.enabled) {
            console.warn('⚠️  Email Service: SMTP não configurado (SMTP_USER ou SMTP_PASSWORD ausentes)');
        }
    }

    /**
     * Retorna se o serviço de email está habilitado
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Obtém ou cria o transporter do Nodemailer
     */
    private getTransporter(): Transporter {
        if (!this.transporter) {
            this.transporter = nodemailer.createTransport({
                host: this.config.host,
                port: this.config.port,
                secure: this.config.secure,
                auth: {
                    user: this.config.user,
                    pass: this.config.password,
                },
                tls: {
                    // Não falhar em certificados inválidos (necessário para alguns hosts)
                    rejectUnauthorized: false,
                },
            });
        }

        return this.transporter;
    }

    /**
     * Envia um email
     */
    async sendEmail(options: EmailOptions): Promise<boolean> {
        if (!this.enabled) {
            console.warn('⚠️  Email não enviado: serviço desabilitado');
            return false;
        }

        try {
            const transporter = this.getTransporter();

            const mailOptions = {
                from: `"${this.config.fromName}" <${this.config.from}>`,
                to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
                subject: options.subject,
                text: options.text,
                html: options.html,
                attachments: options.attachments,
            };

            const info = await transporter.sendMail(mailOptions);

            console.log('✅ Email enviado:', {
                messageId: info.messageId,
                to: mailOptions.to,
                subject: options.subject,
            });

            return true;
        } catch (error: any) {
            console.error('❌ Erro ao enviar email:', {
                error: error.message,
                to: options.to,
                subject: options.subject,
            });

            return false;
        }
    }

    /**
     * Envia email de reset de senha
     */
    async sendPasswordResetEmail(
        to: string,
        resetToken: string,
        userName?: string
    ): Promise<boolean> {
        const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://hallyuhub.com.br'}/auth/reset-password?token=${resetToken}`;

        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Reset de Senha</h1>
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        ${userName ? `<p style="font-size: 16px;">Olá, <strong>${userName}</strong>!</p>` : '<p style="font-size: 16px;">Olá!</p>'}

        <p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>HallyuHub</strong>.</p>

        <p>Clique no botão abaixo para criar uma nova senha:</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 15px 40px;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                      display: inline-block;">
                Redefinir Senha
            </a>
        </div>

        <p style="color: #666; font-size: 14px;">
            Ou copie e cole este link no seu navegador:<br>
            <a href="${resetUrl}" style="color: #667eea; word-break: break-all;">${resetUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">

        <p style="color: #999; font-size: 12px;">
            ⚠️ <strong>Importante:</strong> Este link expira em 1 hora por questões de segurança.
        </p>

        <p style="color: #999; font-size: 12px;">
            Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.
        </p>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                <strong>HallyuHub</strong> - Sua fonte de entretenimento coreano
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                <a href="https://hallyuhub.com.br" style="color: #667eea; text-decoration: none;">hallyuhub.com.br</a>
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const text = `
Reset de Senha - HallyuHub

${userName ? `Olá, ${userName}!` : 'Olá!'}

Recebemos uma solicitação para redefinir a senha da sua conta no HallyuHub.

Clique no link abaixo para criar uma nova senha:
${resetUrl}

⚠️ IMPORTANTE: Este link expira em 1 hora por questões de segurança.

Se você não solicitou esta redefinição, ignore este email. Sua senha permanecerá inalterada.

---
HallyuHub - Sua fonte de entretenimento coreano
https://hallyuhub.com.br
        `;

        return this.sendEmail({
            to,
            subject: '🔐 Reset de Senha - HallyuHub',
            text,
            html,
        });
    }

    /**
     * Envia email de boas-vindas
     */
    async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo ao HallyuHub!</h1>
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <p style="font-size: 16px;">Olá, <strong>${userName}</strong>!</p>

        <p>É com muito prazer que te damos as boas-vindas ao <strong>HallyuHub</strong>, sua nova fonte de entretenimento coreano! 🇰🇷</p>

        <p>Aqui você vai encontrar:</p>

        <ul style="line-height: 2;">
            <li>🎤 <strong>Artistas</strong> - Perfis completos de seus ídolos favoritos</li>
            <li>📰 <strong>Notícias</strong> - Fique por dentro de tudo no K-pop e K-drama</li>
            <li>🎬 <strong>Produções</strong> - Filmes e séries coreanas</li>
            <li>⭐ <strong>Favoritos</strong> - Salve e acompanhe seus conteúdos preferidos</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://hallyuhub.com.br'}"
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      color: white;
                      padding: 15px 40px;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                      display: inline-block;">
                Explorar Agora
            </a>
        </div>

        <p>Se tiver qualquer dúvida ou sugestão, não hesite em nos contatar!</p>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                <strong>HallyuHub</strong> - Sua fonte de entretenimento coreano
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                <a href="https://hallyuhub.com.br" style="color: #667eea; text-decoration: none;">hallyuhub.com.br</a>
            </p>
        </div>
    </div>
</body>
</html>
        `;

        const text = `
Bem-vindo ao HallyuHub!

Olá, ${userName}!

É com muito prazer que te damos as boas-vindas ao HallyuHub, sua nova fonte de entretenimento coreano! 🇰🇷

Aqui você vai encontrar:
• Artistas - Perfis completos de seus ídolos favoritos
• Notícias - Fique por dentro de tudo no K-pop e K-drama
• Produções - Filmes e séries coreanas
• Favoritos - Salve e acompanhe seus conteúdos preferidos

Explore agora: ${process.env.NEXT_PUBLIC_SITE_URL || 'https://hallyuhub.com.br'}

Se tiver qualquer dúvida ou sugestão, não hesite em nos contatar!

---
HallyuHub - Sua fonte de entretenimento coreano
https://hallyuhub.com.br
        `;

        return this.sendEmail({
            to,
            subject: '🎉 Bem-vindo ao HallyuHub!',
            text,
            html,
        });
    }

    /**
     * Envia email de notificação genérico
     */
    async sendNotificationEmail(
        to: string,
        subject: string,
        message: string
    ): Promise<boolean> {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">${subject}</h1>
    </div>

    <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
        <div style="white-space: pre-wrap;">${message}</div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                <strong>HallyuHub</strong> - Sua fonte de entretenimento coreano
            </p>
            <p style="color: #999; font-size: 12px; margin: 5px 0;">
                <a href="https://hallyuhub.com.br" style="color: #667eea; text-decoration: none;">hallyuhub.com.br</a>
            </p>
        </div>
    </div>
</body>
</html>
        `;

        return this.sendEmail({
            to,
            subject: `📬 ${subject}`,
            text: message,
            html,
        });
    }

    /**
     * Testa a configuração SMTP
     */
    async testConnection(): Promise<boolean> {
        if (!this.enabled) {
            console.error('❌ Email Service não configurado');
            return false;
        }

        try {
            const transporter = this.getTransporter();
            await transporter.verify();
            console.log('✅ SMTP configurado corretamente!');
            return true;
        } catch (error: any) {
            console.error('❌ Erro ao conectar com SMTP:', error.message);
            return false;
        }
    }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

/**
 * Retorna instância singleton do EmailService
 */
export function getEmailService(): EmailService {
    if (!emailServiceInstance) {
        emailServiceInstance = new EmailService();
    }
    return emailServiceInstance;
}

/**
 * Helper function para enviar emails rapidamente
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
    const service = getEmailService();
    return service.sendEmail(options);
}
