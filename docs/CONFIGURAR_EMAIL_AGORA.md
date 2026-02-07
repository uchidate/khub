# ⚡ Configurar Email AGORA - Guia Rápido

## 📝 Passo 1: Editar .env Local

```bash
# Abrir arquivo .env
nano .env

# OU usar VS Code
code .env
```

## 📋 Passo 2: Adicionar Estas Linhas

Cole no final do arquivo `.env`:

```env
# Email Service (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=COLOQUE_SUA_SENHA_AQUI
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub
```

⚠️ **IMPORTANTE:** Substitua `COLOQUE_SUA_SENHA_AQUI` pela senha real que você configurou na Hostinger!

## 💾 Passo 3: Salvar

- **Nano:** `Ctrl+X` → `Y` → `Enter`
- **VS Code:** `Ctrl+S` (ou `Cmd+S` no Mac)

---

## 🧪 Passo 4: Testar Localmente

```bash
# Criar arquivo de teste
cat > test-email-quick.js << 'EOF'
const { getEmailService } = require('./lib/services/email-service');

async function test() {
    const emailService = getEmailService();

    console.log('🧪 Testando conexão SMTP...\n');

    const isWorking = await emailService.testConnection();

    if (isWorking) {
        console.log('\n✅ SUCESSO! SMTP configurado corretamente!');
        console.log('\nAgora você pode enviar emails! 🎉');
    } else {
        console.log('\n❌ ERRO na configuração SMTP');
        console.log('\nVerifique:');
        console.log('1. Senha está correta?');
        console.log('2. DNS propagou? (aguarde 4-24h)');
        console.log('3. Email foi criado na Hostinger?');
    }

    process.exit(0);
}

test();
EOF

# Executar teste
node test-email-quick.js
```

---

## 🚀 Passo 5: Configurar em Produção

### SSH no Servidor

```bash
ssh root@165.227.200.98
cd /var/www/hallyuhub
```

### Editar .env.production

```bash
nano .env.production
```

### Adicionar as Mesmas Linhas

```env
# Email Service (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=SUA_SENHA_REAL_AQUI
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub
```

### Salvar e Reiniciar

```bash
# Salvar: Ctrl+X → Y → Enter

# Reiniciar aplicação
docker-compose restart hallyuhub

# Verificar logs
docker-compose logs -f hallyuhub | grep -i smtp
```

---

## 📧 Passo 6: Enviar Email de Teste

```bash
# No servidor de produção
cat > test-prod-email.js << 'EOF'
const nodemailer = require('nodemailer');

async function test() {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        }
    });

    try {
        await transporter.verify();
        console.log('✅ Conexão OK!');

        const info = await transporter.sendMail({
            from: '"HallyuHub" <no_reply@hallyuhub.com.br>',
            to: 'SEU_EMAIL_PESSOAL@gmail.com', // MUDE AQUI
            subject: '✅ Teste Email Produção',
            text: 'Se você recebeu este email, está funcionando!',
            html: '<b>Se você recebeu este email, está funcionando!</b>'
        });

        console.log('📧 Email enviado:', info.messageId);
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

test();
EOF

# MUDE O EMAIL no arquivo acima!
nano test-prod-email.js

# Executar
cd /var/www/hallyuhub
docker-compose exec hallyuhub node test-prod-email.js
```

---

## ✅ Checklist Final

- [ ] Adicionei variáveis no `.env` local
- [ ] Senha está correta
- [ ] Teste local passou (`node test-email-quick.js`)
- [ ] Adicionei variáveis no `.env.production`
- [ ] Reiniciei aplicação em produção
- [ ] Teste de produção passou
- [ ] Recebi email de teste no meu email pessoal

---

## 🎯 Usar no Código

Agora você pode usar em qualquer lugar do código:

```typescript
import { getEmailService } from '@/lib/services/email-service';

const emailService = getEmailService();

// Reset de senha
await emailService.sendPasswordResetEmail(
    'usuario@exemplo.com',
    'token-123',
    'Nome do Usuário'
);

// Boas-vindas
await emailService.sendWelcomeEmail(
    'novousuario@exemplo.com',
    'João Silva'
);

// Genérico
await emailService.sendNotificationEmail(
    'usuario@exemplo.com',
    'Novo conteúdo disponível!',
    'BTS lançou novo MV! Confira agora.'
);
```

---

## 🆘 Problemas?

### "Authentication failed"
```bash
# Verificar senha
echo $SMTP_PASSWORD

# Testar login manual
curl -v smtp://no_reply%40hallyuhub.com.br:SENHA@smtp.hostinger.com:587
```

### "Connection refused"
```bash
# Testar porta
telnet smtp.hostinger.com 587

# Verificar DNS propagou
dig MX hallyuhub.com.br
```

### "Service not configured"
```bash
# Verificar variáveis estão carregadas
grep SMTP .env

# Reiniciar aplicação
docker-compose restart hallyuhub
```

---

**⏰ Lembre-se:** DNS pode levar 4-24h para propagar! Se o teste falhar agora, tente novamente daqui algumas horas.

**🎉 Pronto!** Email configurado! 📧
