# 📧 Email Service - Guia de Uso

## 📋 Configuração

### 1. Adicionar Variáveis de Ambiente

Edite seu arquivo `.env` e adicione:

```env
# Email Service (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=SUA_SENHA_DA_HOSTINGER
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub
```

⚠️ **IMPORTANTE:** Substitua `SUA_SENHA_DA_HOSTINGER` pela senha real que você configurou na Hostinger!

### 2. Produção (.env.production)

Para produção, adicione as mesmas variáveis no arquivo `.env.production`:

```bash
# Via SSH no servidor
nano /var/www/hallyuhub/.env.production

# Adicione as variáveis acima
```

---

## 🚀 Como Usar

### Importar o Serviço

```typescript
import { getEmailService } from '@/lib/services/email-service';

const emailService = getEmailService();
```

---

## 📨 Enviar Email Simples

```typescript
import { sendEmail } from '@/lib/services/email-service';

await sendEmail({
    to: 'usuario@exemplo.com',
    subject: 'Assunto do Email',
    text: 'Conteúdo em texto puro',
    html: '<p>Conteúdo em <strong>HTML</strong></p>',
});
```

---

## 🔐 Email de Reset de Senha

```typescript
const emailService = getEmailService();

await emailService.sendPasswordResetEmail(
    'usuario@exemplo.com',
    'token-de-reset-123',
    'Nome do Usuário'  // Opcional
);
```

**O que esse email contém:**
- ✅ Design profissional e responsivo
- ✅ Link para reset de senha
- ✅ Aviso de expiração (1 hora)
- ✅ Branding HallyuHub

---

## 🎉 Email de Boas-Vindas

```typescript
const emailService = getEmailService();

await emailService.sendWelcomeEmail(
    'novousuario@exemplo.com',
    'Nome do Usuário'
);
```

**O que esse email contém:**
- ✅ Mensagem de boas-vindas
- ✅ Lista de funcionalidades do site
- ✅ Link para explorar o site
- ✅ Design atrativo

---

## 📬 Email de Notificação Genérico

```typescript
const emailService = getEmailService();

await emailService.sendNotificationEmail(
    'usuario@exemplo.com',
    'Seu artista favorito postou algo novo!',
    'BTS acabou de lançar um novo MV! Confira agora em HallyuHub.'
);
```

---

## 🧪 Testar Conexão SMTP

```typescript
const emailService = getEmailService();

const isWorking = await emailService.testConnection();

if (isWorking) {
    console.log('✅ SMTP configurado corretamente!');
} else {
    console.log('❌ Erro na configuração SMTP');
}
```

---

## 📎 Email com Anexo

```typescript
await sendEmail({
    to: 'usuario@exemplo.com',
    subject: 'Relatório Mensal',
    text: 'Segue em anexo o relatório.',
    attachments: [
        {
            filename: 'relatorio.pdf',
            path: '/caminho/para/relatorio.pdf'
        }
    ]
});
```

---

## 🔄 Usar em API Routes

### Exemplo: Reset de Senha

```typescript
// app/api/auth/forgot-password/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getEmailService } from '@/lib/services/email-service';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    const { email } = await request.json();

    // Buscar usuário
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        return NextResponse.json(
            { error: 'Email não encontrado' },
            { status: 404 }
        );
    }

    // Gerar token de reset (exemplo simplificado)
    const resetToken = generateResetToken(); // Implementar função

    // Salvar token no banco
    await saveResetToken(user.id, resetToken); // Implementar função

    // Enviar email
    const emailService = getEmailService();
    const sent = await emailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.name
    );

    if (!sent) {
        return NextResponse.json(
            { error: 'Falha ao enviar email' },
            { status: 500 }
        );
    }

    return NextResponse.json({
        success: true,
        message: 'Email de reset enviado com sucesso'
    });
}
```

---

## 🛡️ Verificar se Email está Habilitado

```typescript
const emailService = getEmailService();

if (!emailService.isEnabled()) {
    console.log('⚠️  Email service não configurado');
    return;
}

// Continuar com envio...
```

---

## 🎨 Template de Email Customizado

```typescript
const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial; max-width: 600px; margin: 0 auto;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Seu Título</h1>
    </div>

    <div style="padding: 30px; background: #f9f9f9;">
        <p>Olá, <strong>${userName}</strong>!</p>
        <p>Seu conteúdo aqui...</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${linkUrl}"
               style="background: #667eea;
                      color: white;
                      padding: 15px 40px;
                      text-decoration: none;
                      border-radius: 5px;
                      font-weight: bold;
                      display: inline-block;">
                Seu Botão
            </a>
        </div>

        <p style="color: #999; font-size: 12px;">
            <strong>HallyuHub</strong> - Sua fonte de entretenimento coreano
        </p>
    </div>
</body>
</html>
`;

await sendEmail({
    to: 'usuario@exemplo.com',
    subject: 'Assunto',
    html,
    text: 'Versão em texto puro...'
});
```

---

## 🐛 Troubleshooting

### Erro: "SMTP não configurado"

**Causa:** Variáveis de ambiente ausentes

**Solução:**
```bash
# Verifique se as variáveis estão no .env
grep SMTP .env

# Adicione se estiverem faltando
echo "SMTP_HOST=smtp.hostinger.com" >> .env
echo "SMTP_PORT=587" >> .env
# ... etc
```

### Erro: "Authentication failed"

**Causas possíveis:**
1. Senha incorreta
2. Email não criado na Hostinger
3. Conta de email bloqueada

**Solução:**
1. Confirme a senha na Hostinger
2. Verifique se criou a conta `no_reply@hallyuhub.com.br`
3. Teste login no webmail: https://webmail.hostinger.com

### Erro: "Connection timeout"

**Causas possíveis:**
1. Porta bloqueada por firewall
2. Host incorreto

**Solução:**
```bash
# Testar conectividade
telnet smtp.hostinger.com 587

# Se não conectar, verificar firewall
```

### Emails vão para spam

**Soluções:**
1. Verificar se DNS propagou (MX, SPF, DKIM)
2. Usar https://www.mail-tester.com para testar
3. Evitar palavras suspeitas (GRÁTIS, PROMOÇÃO, URGENTE)
4. Adicionar link de "unsubscribe" para emails marketing

---

## 📊 Monitoramento

### Log de Emails Enviados

Todos os emails são logados automaticamente:

```
✅ Email enviado: {
  messageId: '<123@smtp.hostinger.com>',
  to: 'usuario@exemplo.com',
  subject: 'Assunto'
}
```

### Criar Sistema de Fila (Avançado)

Para alto volume de emails, considere usar uma fila:

```typescript
// Exemplo conceitual com BullMQ
import { Queue } from 'bullmq';

const emailQueue = new Queue('emails');

// Adicionar à fila
await emailQueue.add('send-email', {
    to: 'usuario@exemplo.com',
    subject: 'Assunto',
    html: '...'
});

// Processar fila
const worker = new Worker('emails', async (job) => {
    await sendEmail(job.data);
});
```

---

## 🔒 Segurança

### Variáveis de Ambiente

⚠️ **NUNCA commite o `.env` com senhas reais!**

```bash
# Adicione ao .gitignore
echo ".env" >> .gitignore
echo ".env.production" >> .gitignore
```

### Rate Limiting

Implemente rate limiting para evitar abuso:

```typescript
// Exemplo conceitual
import rateLimit from 'express-rate-limit';

const emailLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Máximo 5 emails por IP
    message: 'Muitos emails enviados, tente novamente mais tarde'
});
```

---

## 📈 Limites da Hostinger

Verifique os limites do seu plano:

- **Emails/hora:** ~150-300 (varia por plano)
- **Tamanho máximo:** 20-50 MB por email
- **Destinatários/email:** 100

Se precisar enviar mais:
- SendGrid (100 emails/dia grátis)
- Mailgun (5.000 emails/mês grátis)
- AWS SES (62.000 emails/mês grátis)

---

## ✅ Checklist de Produção

Antes de ir para produção:

- [ ] DNS propagou (MX, SPF, DKIM)
- [ ] Variáveis configuradas em `.env.production`
- [ ] Teste de envio realizado com sucesso
- [ ] Emails não vão para spam (teste com mail-tester.com)
- [ ] Logs de email configurados
- [ ] Rate limiting implementado (se necessário)
- [ ] Aplicação reiniciada após configuração

---

**Pronto! Seu sistema de email está configurado!** 🎉

Para dúvidas ou problemas, consulte a [documentação completa de configuração](./CONFIGURACAO_EMAIL_PASSO_A_PASSO.md).
