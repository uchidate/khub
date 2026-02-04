# 🔧 Troubleshooting: Sistema de Cron Não Está Funcionando

## 🎯 Problema Reportado

O sistema de atualização automática a cada 15 minutos não está gerando novos artistas e notícias em produção.

## 📋 Diagnóstico

Você tem **DUAS** implementações de cron configuradas:

### 1. **GitHub Actions** (Sistema Original)
- Arquivo: `.github/workflows/daily-content.yml`
- Frequência: A cada 15 minutos (`*/15 * * * *`)
- Método: Conecta via SSH no servidor Docker
- Comando: `docker exec hallyuhub npm run atualize:ai -- --provider=ollama`
- Status: **Ativo mas pode estar falhando**

### 2. **Vercel Cron** (Novo - Implementado Agora)
- Arquivo: `vercel.json`
- Frequência: A cada 15 minutos
- Método: Chama endpoint `/api/cron/update`
- Comando: API route nativa Next.js
- Status: **Pronto para usar**

---

## 🔍 Por Que o GitHub Actions Pode Estar Falhando

### Verificação 1: Secrets Configurados?

```bash
# Verifique se os secrets estão configurados:
gh secret list
```

**Secrets necessários**:
- `HOST` - IP ou domínio do servidor
- `USER` - Usuário SSH
- `SSH_PRIVATE_KEY` - Chave privada SSH

**Como verificar**:
1. GitHub → Repositório → Settings → Secrets and variables → Actions
2. Confirme que os 3 secrets existem

**Se não existirem**, adicione:
```bash
# Adicionar secrets via CLI
gh secret set HOST --body "seu.servidor.com"
gh secret set USER --body "seu-usuario"
gh secret set SSH_PRIVATE_KEY < ~/.ssh/id_rsa
```

### Verificação 2: Workflow Está Executando?

```bash
# Ver últimas execuções
gh run list --workflow="Content Generation (Production)" --limit 10

# Ver detalhes de uma execução específica
gh run view <RUN_ID>

# Ver logs
gh run view <RUN_ID> --log
```

**Sinais de problema**:
- ❌ Nenhuma execução nos últimos 15 minutos
- ❌ Status: "failed" ou "cancelled"
- ❌ Erro: "Connection refused" ou "Authentication failed"

### Verificação 3: Servidor Está Acessível?

```bash
# Teste SSH manual
ssh -i ~/.ssh/id_rsa usuario@servidor

# Se conectar, teste o comando:
cd /var/www/hallyuhub
docker exec hallyuhub npm run atualize:ai -- --provider=ollama
```

**Problemas comuns**:
- ❌ Servidor desligado ou inacessível
- ❌ Porta SSH (22) bloqueada por firewall
- ❌ Chave SSH incorreta ou sem permissões
- ❌ Container Docker não está rodando

### Verificação 4: Ollama Está Funcionando?

```bash
# No servidor, verifique Ollama
docker exec hallyuhub curl http://localhost:11434/api/tags

# Ou se Ollama estiver fora do container:
curl http://localhost:11434/api/tags
```

**Resposta esperada**:
```json
{
  "models": [
    {"name": "llama2", ...},
    {"name": "mistral", ...}
  ]
}
```

**Se falhar**:
- ❌ Ollama não está instalado
- ❌ Ollama não está rodando
- ❌ Porta 11434 não está acessível

---

## ✅ Soluções

### Opção A: Corrigir GitHub Actions (Manter Sistema Original)

#### 1. Verificar e Adicionar Secrets

```bash
# 1. Obter IP do servidor
echo "Seu servidor: $(curl -s ifconfig.me)"

# 2. Adicionar secrets
gh secret set HOST --body "seu-ip-aqui"
gh secret set USER --body "root"  # ou seu usuário

# 3. Adicionar chave SSH
cat ~/.ssh/id_rsa | gh secret set SSH_PRIVATE_KEY
```

#### 2. Testar Conexão SSH

```bash
# Teste se consegue conectar
ssh -i ~/.ssh/id_rsa usuario@servidor "echo 'SSH OK'"
```

#### 3. Testar Comando Manual

```bash
ssh usuario@servidor << 'EOF'
cd /var/www/hallyuhub
docker exec hallyuhub npm run atualize:ai -- --provider=ollama --artists=2 --news=2
EOF
```

#### 4. Verificar Ollama no Servidor

```bash
ssh usuario@servidor << 'EOF'
# Verificar se Ollama está rodando
docker exec hallyuhub curl http://localhost:11434/api/tags || \
  echo "❌ Ollama não está respondendo"
EOF
```

#### 5. Forçar Execução Manual do Workflow

```bash
# Trigger manual via CLI
gh workflow run "Content Generation (Production)"

# Ou via web
# GitHub → Actions → Content Generation (Production) → Run workflow
```

#### 6. Ver Logs em Tempo Real

```bash
# Aguarde 1 minuto e veja logs
gh run list --workflow="Content Generation (Production)" --limit 1
gh run view <RUN_ID> --log
```

---

### Opção B: Migrar para Vercel Cron (Recomendado)

**Vantagens**:
- ✅ Não depende de servidor externo
- ✅ Configuração automática
- ✅ Logs integrados na Vercel
- ✅ Funciona com Ollama se configurado

#### 1. Configure Ollama (Se Não Estiver em Servidor Próprio)

**Opção 1: Usar Ollama em Servidor Separado**
```bash
# Configure Ollama em um servidor acessível
# Na Vercel, adicione:
OLLAMA_BASE_URL=http://seu-servidor-ollama:11434
```

**Opção 2: Usar API Paga (Mais Simples)**
```bash
# Use Gemini (mais barato)
GEMINI_API_KEY=sua-chave
# OU
OPENAI_API_KEY=sua-chave
# OU
ANTHROPIC_API_KEY=sua-chave
```

#### 2. Configure Secrets na Vercel

```bash
# Via CLI
vercel env add CRON_SECRET
# Cole o secret (gere com: openssl rand -hex 32)

vercel env add OLLAMA_BASE_URL
# Cole a URL do seu Ollama

# OU adicione API key de provider pago
vercel env add GEMINI_API_KEY
```

#### 3. Deploy

```bash
git push origin main  # ou develop
# Vercel faz deploy automático
```

#### 4. Verificar

```bash
# Após deploy, veja em:
# Vercel Dashboard → Project → Cron Jobs
# Deve aparecer: /api/cron/update executando a cada 15 min
```

---

## 🔄 Executar Ambos (Híbrido)

Você pode manter ambos funcionando:

- **GitHub Actions**: Atualiza servidor Docker (produção principal)
- **Vercel Cron**: Atualiza Vercel deployment (staging/preview)

Vantagens:
- Redundância
- Diferentes ambientes
- Fallback se um falhar

Configure `CRON_SECRET` diferente para cada um.

---

## 📊 Verificar Se Está Funcionando

### Método 1: Logs

**GitHub Actions**:
```bash
gh run list --workflow="Content Generation (Production)" --limit 1
gh run view <RUN_ID> --log | grep "Content generation completed"
```

**Vercel Cron**:
```bash
vercel logs | grep CRON
```

### Método 2: Banco de Dados

```bash
# Conte registros recentes
psql $DATABASE_URL -c "
  SELECT
    'Artists criados hoje' as tipo,
    COUNT(*) as total
  FROM \"Artist\"
  WHERE \"createdAt\" >= CURRENT_DATE
  UNION ALL
  SELECT
    'News criadas hoje',
    COUNT(*)
  FROM \"News\"
  WHERE \"createdAt\" >= CURRENT_DATE;
"
```

### Método 3: Timestamp

```bash
# Veja o último artista criado
psql $DATABASE_URL -c "
  SELECT \"nameRomanized\", \"createdAt\"
  FROM \"Artist\"
  ORDER BY \"createdAt\" DESC
  LIMIT 5;
"
```

Se a data for antiga (>1 hora), o cron NÃO está funcionando.

---

## 🆘 Ainda Não Funciona?

### Debug Checklist

- [ ] Secrets configurados (GitHub ou Vercel)
- [ ] Servidor acessível (se usando GitHub Actions)
- [ ] Container Docker rodando (se usando GitHub Actions)
- [ ] Ollama respondendo em localhost:11434 (ou URL configurada)
- [ ] Workflow habilitado no GitHub (Actions tab)
- [ ] Logs mostram erro específico
- [ ] Banco de dados acessível (DATABASE_URL correto)
- [ ] Pelo menos um AI provider configurado

### Comandos de Debug

```bash
# GitHub Actions
gh run list --limit 10
gh run view --log

# Vercel
vercel logs --follow | grep CRON

# Servidor
ssh servidor "docker ps | grep hallyuhub"
ssh servidor "docker logs hallyuhub --tail 50"

# Ollama
curl http://localhost:11434/api/tags
# ou
curl http://seu-servidor:11434/api/tags

# Banco
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Artist\";"
```

---

## 📞 Próximos Passos

1. **Identifique qual sistema usar**:
   - Servidor próprio → GitHub Actions
   - Vercel deployment → Vercel Cron
   - Ambos → Híbrido

2. **Execute checklist de verificação**

3. **Teste manualmente primeiro**

4. **Monitore logs por 30 minutos**

5. **Confirme novos registros no banco**

Se ainda assim não funcionar, compartilhe:
- Logs completos (GitHub Actions ou Vercel)
- Configuração de secrets
- Erro específico encontrado
