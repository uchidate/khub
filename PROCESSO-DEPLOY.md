# Processo de Deploy - HallyuHub

**REGRA DE OURO:** Local → Staging → Produção (sempre nessa ordem!)

## 📋 Checklist de Deploy

### 1️⃣ Desenvolvimento Local

**Antes de commitar:**

```bash
# 1. Testar build local
cd v1
npm run build

# 2. Testar Docker build (opcional, mas recomendado)
docker build -t hallyuhub:test -f Dockerfile .

# 3. Verificar se não há secrets expostos
git diff  # Revisar mudanças
# Pre-commit hook vai verificar automaticamente

# 4. Commitar para develop
git add .
git commit -m "feat: descrição da mudança"
git push origin develop
```

**Validação:**
- ✅ Build local passou
- ✅ Sem secrets no código
- ✅ Commit em develop (não em main!)

---

### 2️⃣ Deploy em Homologação (Staging)

**Processo Automático via GitHub Actions:**

1. **Push para develop** → Trigger automático do workflow
2. **Build da imagem** → Tag: `ghcr.io/uchidate/khub:staging`
3. **Deploy no servidor** → Container: `hallyuhub-staging`

**Endpoints:**
- Aplicação: http://31.97.255.107:3001
- Health: http://31.97.255.107:3001/api/health

**Validação Obrigatória:**

```bash
# 1. Verificar se build completou
# Via GitHub Actions web UI ou aguardar ~4-5 minutos

# 2. Verificar container
ssh root@31.97.255.107 "docker ps --filter 'name=hallyuhub-staging'"
# Deve mostrar: Up X minutes (healthy)

# 3. Testar health endpoint
curl http://31.97.255.107:3001/api/health
# Deve retornar: {"ok":true,"deploy_env":"staging",...}

# 4. Testar funcionalidade
# Acessar http://31.97.255.107:3001 e validar features
```

**Critérios de Aprovação:**
- ✅ Container healthy
- ✅ Health endpoint respondendo
- ✅ `deploy_env: "staging"`
- ✅ Funcionalidades testadas manualmente
- ✅ **SEM ERROS** (zero tolerância!)

**Se houver erro:**
- ❌ **NÃO IR PARA PRODUÇÃO**
- 🔍 Investigar logs: `ssh root@31.97.255.107 "docker logs hallyuhub-staging"`
- 🔧 Corrigir em develop
- 🔄 Repetir processo de staging

---

### 3️⃣ Deploy em Produção

**ATENÇÃO:** Só prosseguir se staging estiver 100% validado!

**Processo:**

```bash
# 1. Merge develop → main
git checkout main
git merge develop --no-edit

# 2. Push para main (trigger deploy produção)
git push origin main

# 3. Aguardar build (~5-6 minutos)
```

**Validação Obrigatória:**

```bash
# 1. Verificar container
ssh root@31.97.255.107 "docker ps --filter 'name=hallyuhub' --format 'table {{.Names}}\t{{.Status}}'"

# 2. Verificar healthcheck
curl http://31.97.255.107:3000/api/health
# Deve retornar: {"ok":true,"deploy_env":"production",...}

# 3. Monitorar logs (primeiros 2 minutos)
ssh root@31.97.255.107 "docker logs -f hallyuhub --tail 50"
# Ctrl+C para sair

# 4. Validação funcional
# Acessar http://31.97.255.107:3000 e testar features críticas
```

**Critérios de Sucesso:**
- ✅ Container healthy
- ✅ Health endpoint: `deploy_env: "production"`
- ✅ Sem erros nos logs
- ✅ Features funcionando
- ✅ Performance aceitável

**Rollback (se necessário):**

```bash
# 1. Identificar último commit bom
git log --oneline -5

# 2. Reverter para commit anterior
git checkout main
git revert <commit-hash-ruim>
git push origin main

# OU fazer rollback manual no servidor:
ssh root@31.97.255.107
cd /var/www/hallyuhub
docker pull ghcr.io/uchidate/khub:latest@sha256:<hash-anterior>
bash robust-deploy.sh --pull ghcr.io/uchidate/khub:<tag-anterior> --prod
```

---

## 🔧 Troubleshooting

### Build Falhou no GitHub Actions

**Sintomas:** Workflow com status "failed"

**Diagnóstico:**
1. Acessar: https://github.com/uchidate/khub/actions
2. Clicar no workflow que falhou
3. Verificar qual step falhou

**Soluções comuns:**

| Step que falhou | Causa provável | Solução |
|----------------|----------------|---------|
| Build and push Docker image | Erro no Dockerfile ou código TypeScript | Testar build local, corrigir, commitar |
| Copy Docker Compose files | Path errado no scp-action | Verificar `source:` em deploy-image.yml |
| Deploy to VPS | Script robust-deploy.sh com erro | Testar script manualmente no servidor |

### Container Não Fica Healthy

**Sintomas:** Status mostra `(unhealthy)` ou `(health: starting)` permanentemente

**Diagnóstico:**
```bash
ssh root@31.97.255.107
docker inspect hallyuhub-staging --format='{{.State.Health.Log}}'
```

**Causas comuns:**
- Health endpoint `/api/health` não responde
- Porta 3000 não está escutando
- Aplicação travou no startup

**Solução:**
```bash
# Ver logs detalhados
docker logs hallyuhub-staging --tail 100

# Entrar no container
docker exec -it hallyuhub-staging sh
wget -qO- http://localhost:3000/api/health
```

### Deploy Manual (Emergência)

Se GitHub Actions estiver fora do ar:

```bash
# 1. SSH no servidor
ssh root@31.97.255.107
cd /var/www/hallyuhub

# 2. Deploy staging
bash robust-deploy.sh --pull ghcr.io/uchidate/khub:staging --staging

# 3. Deploy produção
bash robust-deploy.sh --pull ghcr.io/uchidate/khub:latest --prod
```

---

## 📊 Ambientes

| Ambiente | Branch | URL | Container | Health Check |
|----------|--------|-----|-----------|--------------|
| **Local** | qualquer | http://localhost:3000 | - | - |
| **Staging** | develop | http://31.97.255.107:3001 | hallyuhub-staging | (healthy) |
| **Produção** | main | http://31.97.255.107:3000 | hallyuhub | (healthy) |

---

## 🎯 Boas Práticas

### ✅ SEMPRE FAZER

1. **Testar local primeiro**
2. **Commitar para develop** (nunca direto em main)
3. **Aguardar staging completar** antes de ir para produção
4. **Validar health endpoint** em cada ambiente
5. **Testar funcionalidades críticas** após deploy
6. **Monitorar logs** nos primeiros minutos

### ❌ NUNCA FAZER

1. ❌ Push direto para main sem passar por staging
2. ❌ Commitar secrets (API keys, senhas, tokens)
3. ❌ Ignorar erros em staging e ir para produção mesmo assim
4. ❌ Fazer deploy em produção às sextas-feiras tarde (risco!)
5. ❌ Interromper deploy em andamento (deixar completar)
6. ❌ Usar `--force` em comandos do git sem necessidade

---

## 📝 Histórico de Melhorias

### Melhoria #1 - Segurança API Keys ✅
- Removido .env do Git
- Adicionado pre-commit hook
- Status: **COMPLETO**

### Melhoria #2 - Docker Healthcheck + DEPLOY_ENV ✅
- Adicionado HEALTHCHECK ao Dockerfile
- Criado campo deploy_env para diferenciar ambientes
- Corrigido robust-deploy.sh para service names corretos
- Status: **COMPLETO**

### Próximas Melhorias
- Melhoria #3: Consolidar estrutura (eliminar duplicação root vs v1/)
- Melhoria #4: Migrar SQLite → PostgreSQL

---

## 🆘 Contatos de Emergência

**Se algo der muito errado:**

1. Verificar status: http://31.97.255.107:3000/api/health
2. Acessar servidor: `ssh root@31.97.255.107`
3. Ver logs: `docker logs hallyuhub --tail 100`
4. Último recurso: Fazer rollback para versão anterior estável

---

**Última atualização:** 2026-02-03
**Mantido por:** Equipe HallyuHub + Claude
