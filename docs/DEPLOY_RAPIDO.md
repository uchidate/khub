# ⚡ Deploy Rápido - Usando Scripts Existentes

## 🚀 Deploy em 3 Comandos

### 1️⃣ Commitar Código

```bash
git add .
git commit -m "feat(auth): integrate email service

- Add welcome email on registration
- Add password reset email
- Complete authentication system

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin main
```

### 2️⃣ Deploy em Staging

```bash
./scripts/deploy.sh staging
```

### 3️⃣ Deploy em Produção (após testar staging)

```bash
./scripts/deploy.sh production
```

---

## ⚙️ Configuração Pré-Deploy

### Antes do Primeiro Deploy

#### A. Configurar .env.staging no servidor

```bash
ssh root@165.227.200.98
cd /var/www/hallyuhub
nano .env.staging
```

**Adicionar:**

```env
# Email SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=YOUR_SMTP_PASSWORD_HERE
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub Staging
```

#### B. Configurar .env.production no servidor

```bash
nano .env.production
```

**Adicionar:**

```env
# Email SMTP
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=YOUR_SMTP_PASSWORD_HERE
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub
```

---

## ✅ Testes Pós-Deploy

### Testar Staging

```bash
# 1. Registro
curl -X POST http://staging.hallyuhub.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste","email":"seu_email@gmail.com","password":"teste123"}'

# 2. Verificar email recebido

# 3. Verificar staging
./scripts/verify-staging.sh
```

### Testar Produção

```bash
# 1. Registro
curl -X POST https://hallyuhub.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Teste Prod","email":"seu_email@gmail.com","password":"teste123"}'

# 2. Verificar email recebido

# 3. Verificar produção
./scripts/verify-production.sh
```

---

## 📊 Monitorar

### Ver Logs

```bash
# Staging
ssh root@165.227.200.98 "cd /var/www/hallyuhub && docker-compose -f docker-compose.staging.yml logs -f hallyuhub"

# Produção
ssh root@165.227.200.98 "cd /var/www/hallyuhub && docker-compose -f docker-compose.prod.yml logs -f hallyuhub"
```

### Ver Status

```bash
# Staging
ssh root@165.227.200.98 "cd /var/www/hallyuhub && docker-compose -f docker-compose.staging.yml ps"

# Produção
ssh root@165.227.200.98 "cd /var/www/hallyuhub && docker-compose -f docker-compose.prod.yml ps"
```

---

## 🆘 Rollback

Se algo der errado:

```bash
# 1. Reverter código
git revert HEAD
git push origin main

# 2. Re-deploy
./scripts/deploy.sh production
```

---

## 📚 Documentação Completa

Para guia detalhado, consulte: [DEPLOY_GUIA_COMPLETO.md](./DEPLOY_GUIA_COMPLETO.md)

---

**Pronto para deploy! 🚀**
