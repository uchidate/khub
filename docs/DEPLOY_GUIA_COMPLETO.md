# 🚀 Deploy - Guia Completo (Staging → Produção)

## 📋 Pré-requisitos

- ✅ Código commitado no Git
- ✅ Acesso SSH ao servidor (root@165.227.200.98)
- ✅ Email SMTP configurado (Hostinger)
- ✅ Variáveis de ambiente prontas
- ✅ Banco de dados rodando

---

## 🎯 Fluxo de Deploy

```
Local → Git → Staging → Testes → Produção
```

**Tempo estimado:** 20-30 minutos

---

## 📦 FASE 1: Preparar Código Local

### 1.1 Verificar Status

```bash
# Ver arquivos modificados
git status

# Ver diferenças
git diff
```

### 1.2 Commitar Mudanças

```bash
# Adicionar arquivos
git add .

# Commitar com mensagem descritiva
git commit -m "feat(auth): integrate email service with authentication

- Add email service to registration (welcome email)
- Add email service to password reset
- Update SMTP configuration
- Add complete authentication documentation

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push para repositório
git push origin main
```

### 1.3 Verificar Push

```bash
# Confirmar que está no repositório
git log --oneline -5

# Ver branch remota
git remote -v
```

---

## 🧪 FASE 2: Deploy em STAGING

### 2.1 Conectar ao Servidor

```bash
ssh root@165.227.200.98
```

### 2.2 Navegar para Diretório

```bash
cd /var/www/hallyuhub
```

### 2.3 Atualizar Código

```bash
# Pull últimas mudanças
git pull origin main

# Verificar branch
git branch
git log --oneline -3
```

### 2.4 Atualizar Variáveis de Ambiente (.env.staging)

```bash
nano .env.staging
```

**Adicionar/Verificar:**

```env
# Database
DATABASE_URL=postgresql://postgres:PASSWORD@postgres-staging:5432/hallyuhub_staging

# NextAuth
NEXTAUTH_SECRET=your-staging-secret-here
NEXTAUTH_URL=http://staging.hallyuhub.com.br

# Email Service (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=YOUR_SMTP_PASSWORD_HERE
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub Staging

# App
NEXT_PUBLIC_SITE_URL=http://staging.hallyuhub.com.br
DEPLOY_ENV=staging
NODE_ENV=production

# APIs
TMDB_API_KEY=your-tmdb-key
GEMINI_API_KEY=your-gemini-key

# Ollama
OLLAMA_BASE_URL=http://ollama-staging:11434

# Cron
CRON_SECRET=your-cron-secret

# Slack (opcional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Google OAuth (staging)
GOOGLE_CLIENT_ID=your-google-staging-client-id
GOOGLE_CLIENT_SECRET=your-google-staging-client-secret
```

**Salvar:** `Ctrl+X` → `Y` → `Enter`

### 2.5 Build e Deploy em Staging

```bash
# Parar containers antigos
docker-compose -f docker-compose.staging.yml down

# Remover volumes antigos (CUIDADO: apaga dados!)
# docker volume prune -f  # Apenas se necessário

# Build nova imagem
docker-compose -f docker-compose.staging.yml build --no-cache

# Subir serviços
docker-compose -f docker-compose.staging.yml up -d

# Ver logs
docker-compose -f docker-compose.staging.yml logs -f hallyuhub
```

### 2.6 Executar Migrações (se houver)

```bash
# Se adicionou novos models no Prisma
docker-compose -f docker-compose.staging.yml exec hallyuhub npx prisma migrate deploy

# Gerar client Prisma
docker-compose -f docker-compose.staging.yml exec hallyuhub npx prisma generate
```

### 2.7 Verificar Saúde

```bash
# Healthcheck
curl http://localhost:3001/api/health

# Deve retornar: {"ok":true}
```

### 2.8 Ver Logs

```bash
# Logs gerais
docker-compose -f docker-compose.staging.yml logs -f

# Apenas erros
docker-compose -f docker-compose.staging.yml logs -f | grep -i error

# Logs de email
docker-compose -f docker-compose.staging.yml logs -f | grep -i email
```

---

## ✅ FASE 3: Testar em STAGING

### 3.1 Testes Básicos

#### A. Teste de Registro

```bash
# Via cURL
curl -X POST http://staging.hallyuhub.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Staging",
    "email": "teste.staging@gmail.com",
    "password": "teste123"
  }'
```

**Esperado:**
```json
{
  "success": true,
  "message": "Usuário criado com sucesso!",
  "user": { ... }
}
```

**Verificar:** Email de boas-vindas recebido!

#### B. Teste de Login

1. Acesse: http://staging.hallyuhub.com.br/auth/login
2. Use credenciais criadas no teste A
3. Deve fazer login com sucesso

#### C. Teste de Reset de Senha

```bash
curl -X POST http://staging.hallyuhub.com.br/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste.staging@gmail.com"
  }'
```

**Verificar:** Email de reset recebido!

#### D. Teste de Cron

```bash
# No servidor
curl -X GET "http://localhost:3001/api/cron/update?token=YOUR_CRON_SECRET"

# Ou
docker-compose -f docker-compose.staging.yml exec hallyuhub \
  curl "http://localhost:3000/api/cron/update?token=$CRON_SECRET"
```

**Verificar logs:** Deve mostrar artistas e notícias sendo gerados

### 3.2 Testes de Integração

#### E. Testar SMTP

```bash
# Criar teste rápido
cat > test-staging-email.js << 'EOF'
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 587,
  secure: false,
  auth: {
    user: 'no_reply@hallyuhub.com.br',
    pass: 'YOUR_SMTP_PASSWORD_HERE'
  }
});

transporter.sendMail({
  from: '"HallyuHub Staging" <no_reply@hallyuhub.com.br>',
  to: 'SEU_EMAIL@gmail.com',
  subject: '✅ Teste Email Staging',
  text: 'Email staging funcionando!',
  html: '<b>Email staging funcionando!</b>'
}).then(info => {
  console.log('✅ Email enviado:', info.messageId);
}).catch(error => {
  console.error('❌ Erro:', error);
});
EOF

# Executar
docker-compose -f docker-compose.staging.yml exec hallyuhub node test-staging-email.js
```

### 3.3 Checklist de Staging

- [ ] Registro funciona
- [ ] Email de boas-vindas recebido
- [ ] Login funciona
- [ ] Reset de senha envia email
- [ ] Link de reset funciona
- [ ] Cron executa sem erros
- [ ] SMTP enviando emails
- [ ] Logs sem erros críticos
- [ ] Healthcheck OK
- [ ] Performance aceitável

---

## 🎯 FASE 4: Deploy em PRODUÇÃO

⚠️ **ATENÇÃO:** Só faça deploy em produção após TODOS os testes em staging passarem!

### 4.1 Backup de Produção

```bash
# Backup do banco de dados
docker-compose -f docker-compose.prod.yml exec postgres-production \
  pg_dump -U postgres hallyuhub > backup-pre-deploy-$(date +%Y%m%d-%H%M%S).sql

# Backup de volumes (opcional)
docker run --rm \
  -v hallyuhub-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/volumes-backup-$(date +%Y%m%d-%H%M%S).tar.gz /data
```

### 4.2 Atualizar Código

```bash
cd /var/www/hallyuhub

# Pull
git pull origin main

# Verificar
git log --oneline -5
```

### 4.3 Atualizar Variáveis de Ambiente (.env.production)

```bash
nano .env.production
```

**Adicionar/Verificar:**

```env
# Database
DATABASE_URL=postgresql://postgres:PASSWORD@postgres-production:5432/hallyuhub

# NextAuth
NEXTAUTH_SECRET=your-production-secret-STRONG
NEXTAUTH_URL=https://hallyuhub.com.br

# Email Service (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=YOUR_SMTP_PASSWORD_HERE
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub

# App
NEXT_PUBLIC_SITE_URL=https://hallyuhub.com.br
DEPLOY_ENV=production
NODE_ENV=production

# APIs
TMDB_API_KEY=your-tmdb-key
GEMINI_API_KEY=your-gemini-key

# Ollama
OLLAMA_BASE_URL=http://ollama-production:11434

# Cron
CRON_SECRET=your-production-cron-secret

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Google OAuth (production)
GOOGLE_CLIENT_ID=your-google-production-client-id
GOOGLE_CLIENT_SECRET=your-google-production-client-secret
```

**Salvar:** `Ctrl+X` → `Y` → `Enter`

### 4.4 Deploy em Produção (Zero Downtime)

```bash
# Build nova imagem
docker-compose -f docker-compose.prod.yml build --no-cache hallyuhub

# Executar migrações (se houver)
docker-compose -f docker-compose.prod.yml exec hallyuhub npx prisma migrate deploy

# Restart com zero downtime (usa healthcheck)
docker-compose -f docker-compose.prod.yml up -d --no-deps hallyuhub

# Aguardar healthcheck passar
sleep 10

# Verificar
docker-compose -f docker-compose.prod.yml ps hallyuhub
```

### 4.5 Verificar Saúde

```bash
# Healthcheck
curl https://hallyuhub.com.br/api/health

# Deve retornar: {"ok":true}
```

### 4.6 Monitorar Logs (10 minutos)

```bash
# Logs em tempo real
docker-compose -f docker-compose.prod.yml logs -f hallyuhub

# Procurar erros
docker-compose -f docker-compose.prod.yml logs --tail=100 hallyuhub | grep -i error

# Monitorar emails
docker-compose -f docker-compose.prod.yml logs -f hallyuhub | grep -i "email\|smtp"
```

---

## 🧪 FASE 5: Testes em PRODUÇÃO

### 5.1 Smoke Tests (Testes Rápidos)

```bash
# A. Healthcheck
curl https://hallyuhub.com.br/api/health

# B. Home page
curl -I https://hallyuhub.com.br

# C. API funcionando
curl https://hallyuhub.com.br/api/metrics
```

### 5.2 Teste de Registro (Use email real!)

```bash
curl -X POST https://hallyuhub.com.br/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Teste Producao",
    "email": "seu_email_real@gmail.com",
    "password": "teste123"
  }'
```

**Verificar:** Email de boas-vindas recebido!

### 5.3 Teste de Login

1. Acesse: https://hallyuhub.com.br/auth/login
2. Use credenciais criadas
3. Deve fazer login

### 5.4 Teste de Reset de Senha

1. Acesse: https://hallyuhub.com.br/auth/forgot-password
2. Digite seu email
3. **Verificar:** Email de reset recebido!
4. Clicar no link e redefinir senha

### 5.5 Verificar Cron (Aguardar 15 min)

```bash
# Monitorar logs do cron
docker-compose -f docker-compose.prod.yml logs -f hallyuhub | grep CRON

# Ou disparar manualmente
curl -X GET "https://hallyuhub.com.br/api/cron/update?token=YOUR_CRON_SECRET"
```

---

## 📊 FASE 6: Monitoramento Pós-Deploy

### 6.1 Métricas

```bash
# Ver métricas Prometheus
curl https://hallyuhub.com.br/api/metrics
```

### 6.2 Logs

```bash
# Últimas 100 linhas
docker-compose -f docker-compose.prod.yml logs --tail=100 hallyuhub

# Seguir logs
docker-compose -f docker-compose.prod.yml logs -f hallyuhub

# Apenas erros
docker-compose -f docker-compose.prod.yml logs hallyuhub | grep ERROR
```

### 6.3 Performance

```bash
# Uso de recursos
docker stats hallyuhub-hallyuhub-1

# Uptime
docker-compose -f docker-compose.prod.yml ps
```

### 6.4 Banco de Dados

```sql
-- Conectar ao banco
docker-compose -f docker-compose.prod.yml exec postgres-production \
  psql -U postgres -d hallyuhub

-- Verificar últimos usuários
SELECT id, name, email, "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 5;

-- Verificar tokens de reset
SELECT COUNT(*) FROM "PasswordResetToken";

-- Verificar últimas notícias
SELECT COUNT(*) FROM "News"
WHERE "createdAt" > NOW() - INTERVAL '1 hour';
```

---

## ⚠️ Rollback (Se Necessário)

Se algo der errado em produção:

### Opção A: Rollback Rápido (Reverter Código)

```bash
cd /var/www/hallyuhub

# Ver commits recentes
git log --oneline -10

# Reverter para commit anterior
git revert HEAD --no-commit
git commit -m "revert: rollback deploy"

# Rebuild e restart
docker-compose -f docker-compose.prod.yml build hallyuhub
docker-compose -f docker-compose.prod.yml up -d hallyuhub
```

### Opção B: Rollback Completo (Restaurar Backup)

```bash
# Parar produção
docker-compose -f docker-compose.prod.yml down

# Restaurar backup do banco
docker-compose -f docker-compose.prod.yml up -d postgres-production
docker-compose -f docker-compose.prod.yml exec postgres-production \
  psql -U postgres -d hallyuhub < backup-pre-deploy-YYYYMMDD-HHMMSS.sql

# Subir com versão antiga
git checkout COMMIT_ANTERIOR
docker-compose -f docker-compose.prod.yml build hallyuhub
docker-compose -f docker-compose.prod.yml up -d
```

---

## ✅ Checklist Final de Produção

### Funcionalidades
- [ ] Registro funciona
- [ ] Email de boas-vindas recebido
- [ ] Login funciona (email/senha)
- [ ] Login Google funciona (se configurado)
- [ ] Reset de senha envia email
- [ ] Link de reset funciona
- [ ] Nova senha funciona no login
- [ ] Cron executa a cada 15min
- [ ] Notícias sendo geradas
- [ ] Artistas sendo criados

### Infraestrutura
- [ ] Healthcheck OK
- [ ] SSL funcionando (HTTPS)
- [ ] Logs sem erros críticos
- [ ] Performance aceitável (<3s response time)
- [ ] Backup criado antes do deploy
- [ ] Variáveis de ambiente configuradas
- [ ] SMTP enviando emails
- [ ] Slack notifications funcionando

### Segurança
- [ ] NEXTAUTH_SECRET forte e único
- [ ] CRON_SECRET configurado
- [ ] Senhas hasheadas no banco
- [ ] Cookies secure=true
- [ ] HTTPS forçado

---

## 🎯 Comandos Úteis

### Ver Status

```bash
# Staging
docker-compose -f docker-compose.staging.yml ps

# Produção
docker-compose -f docker-compose.prod.yml ps
```

### Restart

```bash
# Staging
docker-compose -f docker-compose.staging.yml restart hallyuhub

# Produção
docker-compose -f docker-compose.prod.yml restart hallyuhub
```

### Logs

```bash
# Staging
docker-compose -f docker-compose.staging.yml logs -f --tail=100 hallyuhub

# Produção
docker-compose -f docker-compose.prod.yml logs -f --tail=100 hallyuhub
```

### Entrar no Container

```bash
# Staging
docker-compose -f docker-compose.staging.yml exec hallyuhub sh

# Produção
docker-compose -f docker-compose.prod.yml exec hallyuhub sh
```

### Executar Comandos

```bash
# Prisma Studio (staging)
docker-compose -f docker-compose.staging.yml exec hallyuhub npx prisma studio

# Migrations (production)
docker-compose -f docker-compose.prod.yml exec hallyuhub npx prisma migrate deploy
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Ver logs:** `docker-compose logs -f`
2. **Verificar variáveis:** `docker-compose config`
3. **Testar healthcheck:** `curl /api/health`
4. **Verificar banco:** `docker-compose exec postgres psql`
5. **Rollback:** Seguir guia acima

---

## 🎉 Sucesso!

Após completar todos os passos:

```
✅ Staging deployado e testado
✅ Produção deployada
✅ Emails funcionando
✅ Autenticação funcionando
✅ Cron rodando
✅ Monitoramento ativo
```

**Próximos passos:**
- Monitorar por 24-48h
- Verificar métricas diárias
- Ajustar performance se necessário
- Implementar melhorias incrementais

---

**Bom deploy! 🚀**
