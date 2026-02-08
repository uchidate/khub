# 🔧 Setup do Servidor - Configuração Inicial

## ⚠️ IMPORTANTE: Use Este Guia APENAS na Configuração Inicial

Este guia é para configurar um servidor **pela primeira vez**. Após a configuração inicial, **NUNCA mais modifique .env via SSH** - use o fluxo de deploy correto.

---

## 📋 Pré-requisitos

- Servidor Ubuntu com Docker e Docker Compose instalados
- Acesso SSH ao servidor
- Repositório clonado em `/var/www/hallyuhub`
- Chaves SSH configuradas

---

## 🚀 Configuração Inicial (APENAS primeira vez)

### 1. Conectar ao Servidor

```bash
ssh root@31.97.255.107
cd /var/www/hallyuhub
```

### 2. Criar Arquivos .env

#### Staging (.env.staging)

```bash
# Copiar template
cp .env.staging.template .env.staging

# Editar e preencher valores REAIS
nano .env.staging
```

**Valores a preencher:**
- `DATABASE_URL`: Senha do PostgreSQL (SEM caractere @)
- `POSTGRES_PASSWORD`: Mesma senha
- `NEXTAUTH_SECRET`: Gerar com `openssl rand -base64 32`
- `SMTP_PASSWORD`: Senha do email Hostinger
- `GEMINI_API_KEY`: Chave da API Google Gemini
- `TMDB_API_KEY`: Chave da API TMDB
- `SLACK_WEBHOOK_DEPLOYS`: URL do webhook Slack

#### Production (.env.production)

```bash
# Copiar template
cp .env.production.template .env.production

# Editar e preencher valores REAIS (diferentes de staging!)
nano .env.production
```

**IMPORTANTE:**
- Use senhas DIFERENTES para staging e production
- Use NEXTAUTH_SECRET DIFERENTE para cada ambiente
- Use bancos de dados DIFERENTES (hallyuhub_staging vs hallyuhub_production)

### 3. Iniciar Containers

```bash
# Staging
docker-compose -f docker-compose.staging.yml up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Verificar

```bash
# Staging
docker-compose -f docker-compose.staging.yml ps
docker-compose -f docker-compose.staging.yml logs -f --tail=50 hallyuhub-staging

# Production
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f --tail=50 hallyuhub
```

---

## ✅ Após Configuração Inicial

**NUNCA MAIS MODIFIQUE .env VIA SSH!**

Futuras mudanças devem seguir o fluxo:

```
Local → Git → Deploy Script → Staging → Test → Production
```

Se precisar mudar uma variável de ambiente:
1. Documentar em `docs/PRODUCAO_ENV_CONFIG.md`
2. Pedir ao usuário para fazer a mudança no servidor
3. OU criar script de deploy que injeta variáveis

---

## 🔐 Valores Reais (Não Versionados)

Os valores reais das variáveis estão documentados em `SETUP_SERVIDOR_SECRETS.md` (não versionado).

Para criar esse arquivo:

```bash
cp docs/SETUP_SERVIDOR_SECRETS.template.md docs/SETUP_SERVIDOR_SECRETS.md
# Preencher com valores reais
```

---

## 📝 Notas

- Valores reais devem estar em `SETUP_SERVIDOR_SECRETS.md` (gitignored)
- Use templates para versionar estrutura
- Mantenha backup seguro dos secrets
