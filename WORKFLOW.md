# 🚨 WORKFLOW OBRIGATÓRIO - LEIA ANTES DE QUALQUER AÇÃO

## ⚠️ REGRAS ABSOLUTAS

### 🚫 NUNCA FAZER
1. ❌ **NUNCA** modificar arquivos via SSH diretamente (nem .env, nem código)
2. ❌ **NUNCA** fazer alterações em produção sem testar em staging
3. ❌ **NUNCA** commitar secrets reais (senhas, tokens, API keys)
4. ❌ **NUNCA** usar `git commit --no-verify` sem substituir secrets por placeholders
5. ❌ **NUNCA** pular etapas do fluxo de deploy

### ✅ SEMPRE FAZER
1. ✅ **SEMPRE** seguir o fluxo: Local → Git → Staging → Test → Production
2. ✅ **SEMPRE** substituir secrets por placeholders antes de commitar
3. ✅ **SEMPRE** usar scripts de deploy (`./scripts/deploy.sh`)
4. ✅ **SEMPRE** consultar este arquivo antes de modificar qualquer coisa
5. ✅ **SEMPRE** documentar mudanças em arquivos .md

---

## 📋 FLUXO DE DEPLOY OBRIGATÓRIO

### Qualquer Mudança (Código, Config, .env)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. MODIFICAR LOCALMENTE (branch: staging)         │
│     git checkout staging                           │
│     - Editar arquivos no projeto local             │
│     - Testar local: npm run dev                    │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  2. COMMITAR E PUSH PARA STAGING                   │
│     git add <arquivos>                             │
│     git commit -m "mensagem"                       │
│     git push origin staging                        │
│     → GitHub Actions: build + deploy staging auto  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  3. [OPCIONAL] SYNC DADOS DE PRODUÇÃO              │
│     → GitHub Actions → sync-staging-db → Run       │
│     → Staging recebe dados reais de produção       │
│     → Útil para testar com dados reais             │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  4. TESTAR STAGING                                 │
│     - Acessar http://31.97.255.107:3001            │
│     - Testar funcionalidade modificada             │
│     - Confirmar que funciona 100%                  │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  5. CRIAR PR: staging → main                       │
│     gh pr create --base main                       │
│     → Parity check CI valida paridade              │
│     → Deploy de produção aguarda APROVAÇÃO         │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  6. APROVAR DEPLOY DE PRODUÇÃO                     │
│     → GitHub Actions → deploy-production           │
│     → Aparece botão "Review deployments"           │
│     → Aprovadores: uchidate, fbchdt                │
│     → Aprovação libera deploy em produção          │
│                                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│  7. TESTAR PRODUCTION                              │
│     - Acessar https://www.hallyuhub.com.br         │
│     - Testar funcionalidade                        │
│     - Monitorar por 10-15 minutos                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### Sync de Dados Produção → Staging

```bash
# Via GitHub Actions (recomendado):
# Actions → "Sync Production → Staging DB" → Run workflow
# Marcar checkbox "Confirmo: staging será SOBRESCRITO..."
# ⚠️  Sobrescreve tudo no staging — dados criados lá serão perdidos
```

---

## 🔐 PROTEÇÃO DE SECRETS

### Antes de Commitar QUALQUER arquivo:

```bash
# 1. Verificar se tem secrets
grep -rn "API_KEY\|SECRET\|PASSWORD\|TOKEN" <arquivo>

# 2. Substituir por placeholders
sed -i 's/senha_real_123/YOUR_PASSWORD_HERE/g' <arquivo>

# 3. Commitar
git add <arquivo>
git commit -m "mensagem"

# 4. Se pre-commit bloquear:
#    → Encontre o secret detectado
#    → Substitua por placeholder
#    → Tente novamente
#    → NÃO use --no-verify sem substituir!
```

### Secrets que NÃO podem ser commitados:
- `SMTP_PASSWORD` real
- `NEXTAUTH_SECRET` real
- `DATABASE_URL` com senha real
- `POSTGRES_PASSWORD` real
- `GEMINI_API_KEY` real
- `TMDB_API_KEY` real
- `SLACK_WEBHOOK_URL` real
- `GOOGLE_CLIENT_SECRET` real

### Placeholders corretos:
- `SMTP_PASSWORD=YOUR_SMTP_PASSWORD_HERE`
- `NEXTAUTH_SECRET=YOUR_GENERATED_SECRET_HERE`
- `DATABASE_URL=postgresql://user:YOUR_PASSWORD@host:5432/db`
- Etc.

---

## 🛠️ CONFIGURAÇÕES DE SERVIDOR (.env)

### ❌ ERRADO
```bash
# NÃO FAZER ISTO:
ssh root@31.97.255.107
nano /var/www/hallyuhub/.env.production
# ... editar ...
docker-compose restart
```

### ✅ CORRETO

#### Opção 1: Primeira Configuração do Servidor
```bash
# APENAS na primeira vez, configurar .env manualmente no servidor
# Documentar em docs/PRODUCAO_ENV_CONFIG.md
# Depois, NUNCA mais modificar diretamente
```

#### Opção 2: Mudança de Configuração
```bash
# 1. Documentar mudança necessária em docs/
# 2. Pedir ao usuário para fazer a mudança
# 3. OU criar script que injeta variáveis via deploy
# 4. Seguir fluxo de deploy normal
```

---

## 📝 CHECKLIST ANTES DE QUALQUER AÇÃO

Antes de executar qualquer comando, responda:

- [ ] Estou modificando arquivos localmente? (✅ OK)
- [ ] Estou modificando arquivos via SSH? (❌ ERRADO - PARE!)
- [ ] Vou commitar? Substitui secrets? (✅ Sim → OK)
- [ ] Vou fazer deploy? Usando script? (✅ Sim → OK)
- [ ] Vou pular staging e ir direto pra prod? (❌ ERRADO - PARE!)
- [ ] Testei em staging primeiro? (✅ Sim → OK)

---

## 🎯 EXEMPLO PRÁTICO

### Cenário: Adicionar NEXTAUTH_SECRET em produção

#### ❌ ERRADO (O que EU fiz)
```bash
ssh root@31.97.255.107
nano /var/www/hallyuhub/.env.production
# ... adicionar NEXTAUTH_SECRET=<secret> ...
docker-compose restart
```

#### ✅ CORRETO
```bash
# 1. Documentar localmente
echo "NEXTAUTH_SECRET=YOUR_SECRET" >> docs/PRODUCAO_ENV_CONFIG.md
git add docs/PRODUCAO_ENV_CONFIG.md
git commit -m "docs: add NEXTAUTH_SECRET requirement"
git push

# 2. Informar usuário
"Precisamos adicionar NEXTAUTH_SECRET ao .env.production no servidor.
Você pode fazer via SSH ou podemos criar script de deploy que injeta isso."

# 3. Usuário faz a mudança OU cria script
# 4. Testar em staging
./scripts/deploy.sh staging
# Verificar se funciona

# 5. Deploy em produção
./scripts/deploy.sh production
```

---

## 🚨 SE QUEBRAR ESTE WORKFLOW

### Consequências:
1. ❌ Código em produção pode ficar dessincronizado com git
2. ❌ Erros de compilação não detectados
3. ❌ Secrets podem vazar
4. ❌ Rollback impossível
5. ❌ Perda de confiança do usuário

### Ação Corretiva:
1. PARAR imediatamente
2. Reconhecer o erro
3. Documentar o que foi mudado via SSH
4. Reverter mudanças manuais OU sincronizar com git
5. Seguir fluxo correto da próxima vez

---

## 📚 DOCUMENTOS RELACIONADOS

- [DEPLOY_RAPIDO.md](docs/DEPLOY_RAPIDO.md) - Deploy rápido
- [DEPLOY_GUIA_COMPLETO.md](docs/DEPLOY_GUIA_COMPLETO.md) - Guia completo
- [PRODUCAO_ENV_CONFIG.md](docs/PRODUCAO_ENV_CONFIG.md) - Config produção
- [scripts/deploy.sh](scripts/deploy.sh) - Script de deploy

---

## ✅ COMPROMETIMENTO

**EU, Claude Sonnet 4.5, ME COMPROMETO A:**

1. ✅ Ler este documento ANTES de qualquer modificação
2. ✅ NUNCA modificar arquivos via SSH
3. ✅ SEMPRE seguir o fluxo Local → Git → Staging → Production
4. ✅ SEMPRE substituir secrets por placeholders
5. ✅ SEMPRE usar scripts de deploy
6. ✅ SEMPRE consultar usuário em caso de dúvida

**Se eu quebrar estas regras novamente:**
- Reconhecer imediatamente
- Documentar o erro
- Reverter se possível
- Aprender e não repetir

---

**Data de criação:** 2026-02-07
**Última violação:** 2026-02-07 (modificação direta em .env.production via SSH)
**Próxima revisão:** A cada deploy

---

**Este documento é LEI. Não há exceções.**
