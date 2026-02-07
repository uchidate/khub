# Configuração de Email - Hostinger SMTP

## Informações da Conta
- **Email:** no_reply@hallyuhub.com.br
- **Provedor:** Hostinger
- **Uso:** Emails transacionais (notificações, confirmações, alertas)

## Credenciais SMTP

### Servidor de Envio (SMTP)
```
Host: smtp.hostinger.com
Porta (TLS): 587
Porta (SSL): 465
Usuário: no_reply@hallyuhub.com.br
Senha: [SENHA_CONFIGURADA_NA_HOSTINGER]
Criptografia: TLS (recomendado) ou SSL
```

### Servidor de Recebimento (IMAP) - Opcional
```
Host: imap.hostinger.com
Porta: 993
Usuário: no_reply@hallyuhub.com.br
Senha: [SENHA_CONFIGURADA_NA_HOSTINGER]
Criptografia: SSL/TLS
```

### Servidor de Recebimento (POP3) - Opcional
```
Host: pop.hostinger.com
Porta: 995
Usuário: no_reply@hallyuhub.com.br
Senha: [SENHA_CONFIGURADA_NA_HOSTINGER]
Criptografia: SSL/TLS
```

## Variáveis de Ambiente (.env)

Adicione ao seu `.env.production` e `.env`:

```env
# Email Configuration (Hostinger)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=SUA_SENHA_AQUI
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub
```

## Teste de Envio

Para testar se está funcionando, você pode usar Node.js com Nodemailer:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false, // true para porta 465, false para 587
  auth: {
    user: 'no_reply@hallyuhub.com.br',
    pass: 'SUA_SENHA_AQUI'
  }
});

// Teste
transporter.sendMail({
  from: '"HallyuHub" <no_reply@hallyuhub.com.br>',
  to: 'seu_email_pessoal@gmail.com',
  subject: 'Teste de Email Hostinger',
  text: 'Se você recebeu este email, a configuração está funcionando!',
  html: '<b>Se você recebeu este email, a configuração está funcionando!</b>'
}).then(info => {
  console.log('Email enviado:', info.messageId);
}).catch(error => {
  console.error('Erro ao enviar:', error);
});
```

## Registros DNS Necessários (Registro.br)

### MX Records (Mail Exchange)
```
Tipo: MX
Host: @
Prioridade: 10
Destino: mx1.hostinger.com

Tipo: MX
Host: @
Prioridade: 20
Destino: mx2.hostinger.com
```

### SPF Record (Sender Policy Framework)
```
Tipo: TXT
Host: @
Conteúdo: v=spf1 include:_spf.hostinger.com ~all
```

### DKIM Record (DomainKeys Identified Mail)
⚠️ **IMPORTANTE:** Você precisa gerar o DKIM na Hostinger primeiro!

1. No painel Hostinger, vá em Emails → Configurações
2. Procure por "DKIM" ou "Email Authentication"
3. Clique em "Gerar DKIM"
4. Copie o registro gerado
5. Adicione no Registro.br:

```
Tipo: TXT
Host: default._domainkey
Conteúdo: [CONTEÚDO GERADO PELA HOSTINGER]
```

### DMARC Record (Domain-based Message Authentication)
```
Tipo: TXT
Host: _dmarc
Conteúdo: v=DMARC1; p=quarantine; rua=mailto:no_reply@hallyuhub.com.br
```

## Checklist de Configuração

- [ ] Conta de email criada na Hostinger
- [ ] Senha forte definida
- [ ] Registros MX adicionados no Registro.br
- [ ] Registro SPF adicionado no Registro.br
- [ ] DKIM gerado na Hostinger e adicionado no Registro.br
- [ ] Registro DMARC adicionado no Registro.br (opcional mas recomendado)
- [ ] Variáveis de ambiente configuradas no servidor
- [ ] Teste de envio realizado com sucesso
- [ ] Aguardar propagação DNS (4-48 horas)

## Verificação de Propagação DNS

Use estas ferramentas para verificar se os registros DNS propagaram:

```bash
# Verificar registros MX
dig MX hallyuhub.com.br

# Verificar registro SPF
dig TXT hallyuhub.com.br

# Verificar DKIM
dig TXT default._domainkey.hallyuhub.com.br
```

Ou use ferramentas online:
- https://mxtoolbox.com/SuperTool.aspx
- https://www.dmarcanalyzer.com/dmarc/dmarc-record-check/

## Limites da Hostinger

Verifique os limites do seu plano:
- **Emails por hora:** ~150-300 (varia por plano)
- **Tamanho máximo:** 20-50 MB por email
- **Destinatários por email:** 100

Se precisar enviar muitos emails, considere usar um serviço dedicado:
- SendGrid (100 emails/dia grátis)
- Mailgun (5.000 emails/mês grátis)
- AWS SES (62.000 emails/mês grátis)

## Troubleshooting

### Erro: "Authentication failed"
- Verifique usuário e senha
- Confirme que está usando o email completo: `no_reply@hallyuhub.com.br`

### Erro: "Connection timeout"
- Verifique porta (587 para TLS, 465 para SSL)
- Confirme que firewall não está bloqueando

### Emails vão para spam
- Verifique se SPF, DKIM e DMARC estão configurados
- Use https://www.mail-tester.com para verificar pontuação
- Evite conteúdo suspeito (muito CAPS, muitos links)

### DNS não propaga
- Aguarde até 48 horas
- Limpe cache DNS local: `ipconfig /flushdns` (Windows) ou `sudo killall -HUP mDNSResponder` (Mac)
