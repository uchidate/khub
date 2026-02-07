# ⚙️ Configuração .env.production - Checklist Completo

## 🎯 Configurações Obrigatórias

### 1. NextAuth (Autenticação)

```env
# NextAuth Configuration
NEXTAUTH_SECRET=YOUR_GENERATED_SECRET_HERE
NEXTAUTH_URL=https://www.hallyuhub.com.br
```

**Como gerar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 2. Database URL (Corrigida)

```env
# Database (PostgreSQL Production)
DATABASE_URL="postgresql://hallyuhub:YOUR_POSTGRES_PASSWORD@postgres-production:5432/hallyuhub_production"
POSTGRES_PASSWORD=YOUR_POSTGRES_PASSWORD
```

**⚠️ IMPORTANTE:**
- O nome do banco DEVE ser `hallyuhub_production` (não `hallyuhub`)
- A senha NÃO pode conter `@` (use outro caractere como `X` ou `-`)
- Senhas com `@` causam erro de parsing na DATABASE_URL

### 3. Email SMTP (Já configurado)

```env
# Email Service (Hostinger SMTP)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=no_reply@hallyuhub.com.br
SMTP_PASSWORD=YOUR_SMTP_PASSWORD
SMTP_FROM=no_reply@hallyuhub.com.br
SMTP_FROM_NAME=HallyuHub
```

### 4. Outras Configurações (Já existentes)

```env
# App
NEXT_PUBLIC_SITE_URL=https://www.hallyuhub.com.br
NODE_ENV=production

# APIs
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
TMDB_API_KEY=YOUR_TMDB_API_KEY

# Ollama
OLLAMA_BASE_URL=http://ollama-production:11434

# Slack
SLACK_WEBHOOK_DEPLOYS=YOUR_SLACK_WEBHOOK_URL
```

---

---

## ⚠️ Armadilhas Conhecidas

### Senha com Caractere `@`

**Problema:** PostgreSQL com senha contendo `@` causa erro no Prisma.

**Exemplo que NÃO funciona:**
```
Password: OldPassword@WithAtSign
DATABASE_URL: postgresql://user:OldPassword@WithAtSign@host:5432/db
                                              ↑ Parser confunde com separador de host
```

**Solução:** Trocar `@` por outro caractere (X, -, _)
```bash
# No servidor PostgreSQL
ALTER USER hallyuhub PASSWORD 'NewPasswordWithoutAtSign';

# No .env
DATABASE_URL=postgresql://hallyuhub:NewPasswordWithoutAtSign@postgres-production:5432/hallyuhub_production
```

**Lição aprendida:** Evite `@`, `:`, `/`, `?`, `#` em senhas de banco de dados.

---

## 🔧 Como Aplicar as Configurações

### ❌ **NÃO FAZER** (Errado)
```bash
# NÃO editar diretamente via SSH!
ssh root@31.97.255.107
nano /var/www/hallyuhub/.env.production
```

### ✅ **FAZER** (Correto)

#### Opção 1: Via Deploy Script (Recomendado)
```bash
# 1. Criar/atualizar .env.production.template localmente
# 2. Documentar no DEPLOY_GUIA_COMPLETO.md
# 3. Seguir processo de deploy normal
./scripts/deploy.sh production
```

#### Opção 2: Configuração Inicial do Servidor (Primeira vez)
```bash
# Apenas na primeira configuração do servidor
ssh root@31.97.255.107
cd /var/www/hallyuhub
nano .env.production

# Adicionar TODAS as variáveis listadas acima
# Salvar e sair

# Reiniciar
docker-compose -f docker-compose.prod.yml restart hallyuhub
```

---

## 🐛 Problemas Identificados e Corrigidos

### 1. ❌ NEXTAUTH_SECRET ausente
**Erro:**
```
[next-auth][error][NO_SECRET] Please define a `secret` in production.
```

**Solução:**
Adicionar `NEXTAUTH_SECRET` ao `.env.production`

### 2. ❌ DATABASE_URL com nome de banco errado
**Erro:**
```
Authentication failed against database server at `postgres-production`
```

**Causa:**
- DATABASE_URL usava `hallyuhub` (errado)
- docker-compose.prod.yml define `POSTGRES_DB: hallyuhub_production` (correto)

**Solução:**
Mudar DATABASE_URL para:
```env
DATABASE_URL="postgresql://hallyuhub:PASSWORD@postgres-production:5432/hallyuhub_production"
```

---

## ✅ Checklist de Verificação

Após configurar, verificar:

- [ ] NEXTAUTH_SECRET está definido (32+ caracteres)
- [ ] NEXTAUTH_URL aponta para domínio correto (https://www.hallyuhub.com.br)
- [ ] DATABASE_URL usa banco `hallyuhub_production`
- [ ] SMTP_PASSWORD tem @ no final (`Hn3VdU9xkpJYvEBW6wnk@`)
- [ ] NODE_ENV=production
- [ ] Container reiniciado após mudanças
- [ ] Logs não mostram erros de autenticação
- [ ] Healthcheck passa: https://www.hallyuhub.com.br/api/health
- [ ] Teste de registro envia email
- [ ] Teste de login funciona

---

## 🚀 Próximos Passos

1. **Reiniciar produção:**
   ```bash
   ssh root@31.97.255.107 "cd /var/www/hallyuhub && docker-compose -f docker-compose.prod.yml restart hallyuhub"
   ```

2. **Verificar logs:**
   ```bash
   ssh root@31.97.255.107 "cd /var/www/hallyuhub && docker-compose -f docker-compose.prod.yml logs -f --tail=50 hallyuhub"
   ```

3. **Testar autenticação:**
   ```bash
   # Registro
   curl -X POST https://www.hallyuhub.com.br/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Teste","email":"seu_email@gmail.com","password":"teste123"}'

   # Verificar email recebido
   ```

---

**📝 Nota:** Este documento foi criado após identificar configurações faltantes em produção. Futuras mudanças devem seguir o processo de deploy correto (git → staging → test → production).
