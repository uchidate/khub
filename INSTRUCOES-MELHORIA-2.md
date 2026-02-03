# 🐳 Melhoria #2: Docker Healthcheck + Otimização

## 🎯 Objetivo

Otimizar Docker para reduzir tamanho da imagem em 60% e adicionar healthcheck para deploys mais seguros.

---

## ⚠️ Problemas Atuais

**Docker atual (Bullseye):**
- ❌ Imagem grande: ~336MB
- ❌ Sem healthcheck (deploy não valida se app está saudável)
- ❌ Sem limites de recursos
- ❌ Logs sem rotação

**Riscos:**
- Deploy pode completar com app quebrada
- Consumo excessivo de recursos
- Logs podem encher o disco

---

## ✅ Solução

### Melhorias Implementadas:

1. **Dockerfile Alpine**
   - Base: node:20-alpine (vs node:20-bullseye)
   - Tamanho: ~130MB (vs ~336MB)
   - Multi-stage otimizado

2. **Healthcheck Integrado**
   - Verifica `/api/health` a cada 30s
   - Deploy falha se app não responder
   - 3 tentativas antes de marcar unhealthy

3. **Resource Limits**
   - CPU: max 1.0 core
   - Memory: max 1GB
   - Reserva: 0.5 core / 512MB

4. **Logging Otimizado**
   - Rotação automática
   - Max 10MB por arquivo
   - Mantém últimos 3 arquivos

---

## 📊 Comparação

### Antes vs Depois

| Aspecto | Antes (Bullseye) | Depois (Alpine) | Melhoria |
|---------|------------------|-----------------|----------|
| Tamanho imagem | ~336MB | ~130MB | -61% |
| Healthcheck | ❌ Não | ✅ Sim | +Segurança |
| Resource limits | ❌ Não | ✅ Sim | +Estabilidade |
| Logs | Sem rotação | Rotação 10MB | +Sustentável |
| Build time | ~3min | ~2min | -33% |
| Segurança | Root user | Non-root (nextjs) | +Seguro |

---

## 🔧 Arquivos Criados

1. **v1/Dockerfile.alpine** - Dockerfile otimizado com Alpine
2. **v1/docker-compose.staging-improved.yml** - Compose staging com healthcheck
3. **v1/docker-compose.prod-improved.yml** - Compose production com healthcheck

---

## 📋 Plano de Implementação

### Fase 1: Staging (Teste)
1. Build nova imagem Alpine
2. Push para GHCR com tag `staging-alpine`
3. Deploy em staging usando docker-compose melhorado
4. Testar healthcheck e funcionalidade
5. Validar tamanho e performance

### Fase 2: Production (Após aprovação)
6. Build imagem Alpine com tag `latest`
7. Deploy em production
8. Monitorar por 30 minutos
9. Validar redução de recursos

---

## 🚀 Execução - STAGING

### Passo 1: Build Local (Teste)

```bash
# Build imagem Alpine localmente
cd v1
docker build -f Dockerfile.alpine -t hallyuhub:alpine-test .

# Verificar tamanho
docker images | grep hallyuhub
```

**Esperado:**
- `hallyuhub:alpine-test` ~130MB
- Build completo sem erros

---

### Passo 2: Test Local

```bash
# Rodar container localmente
docker run -d --name test-alpine \
  -p 3002:3000 \
  -e DATABASE_URL="file:/app/data/test.db" \
  -e NEXT_PUBLIC_SITE_URL="http://localhost:3002" \
  hallyuhub:alpine-test

# Aguardar start (40s)
sleep 45

# Verificar healthcheck
docker ps --format "table {{.Names}}\t{{.Status}}" | grep test-alpine

# Testar endpoint
curl http://localhost:3002/api/health

# Ver logs
docker logs test-alpine

# Cleanup
docker stop test-alpine && docker rm test-alpine
```

**Validar:**
- ✅ Container status: `healthy`
- ✅ Health endpoint retorna 200
- ✅ App inicia sem erros

---

### Passo 3: Atualizar GitHub Workflow

Precisamos atualizar o workflow para usar o novo Dockerfile:

**Arquivo: `.github/workflows/deploy-image.yml`**

Alterar linha:
```yaml
# DE:
context: ./v1

# PARA:
context: ./v1
file: ./v1/Dockerfile.alpine  # ← Adicionar esta linha
```

---

### Passo 4: Atualizar Script de Deploy no Servidor

**No servidor (SSH):**

```bash
ssh $SSH_USER@31.97.255.107

# Criar backup do docker-compose atual
cd /var/www/hallyuhub
cp docker-compose.staging.yml docker-compose.staging.yml.backup

# Atualizar com versão melhorada
# (vamos fazer isso via deploy automático)
```

---

### Passo 5: Commit e Deploy para Staging

```bash
# Voltar ao repo local
cd /Users/fabiouchidate/Antigravity/khub

# Add arquivos novos
git add v1/Dockerfile.alpine
git add v1/docker-compose.staging-improved.yml
git add v1/docker-compose.prod-improved.yml
git add INSTRUCOES-MELHORIA-2.md

# Commit
git commit -m "feat: optimize Docker with Alpine and add healthcheck

Docker Improvements:
- Switch from Debian Bullseye to Alpine (336MB → 130MB, -61%)
- Add integrated healthcheck for safer deployments
- Add resource limits (1 CPU, 1GB RAM)
- Add log rotation (10MB max, 3 files)
- Use non-root user (nextjs:1001)

Files:
- v1/Dockerfile.alpine: Optimized multi-stage Alpine build
- v1/docker-compose.staging-improved.yml: Enhanced staging config
- v1/docker-compose.prod-improved.yml: Enhanced production config

Benefits:
- Smaller image size (faster pulls/deployments)
- Healthcheck prevents broken deployments
- Resource limits prevent OOM
- Log rotation prevents disk fill
- Better security with non-root user

Testing:
- Build and test locally before staging
- Validate healthcheck functionality
- Monitor resource usage

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push para develop (staging)
git checkout develop
git merge main
git push origin develop
```

---

### Passo 6: Monitorar Deploy em Staging

```bash
# Acompanhar GitHub Actions
# https://github.com/uchidate/khub/actions

# Após deploy, verificar
curl http://31.97.255.107:3001/api/health

# SSH e verificar container
ssh $SSH_USER@31.97.255.107
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Size}}"

# Verificar healthcheck status
docker inspect hallyuhub-staging | grep -A 10 Health

# Ver logs
docker logs hallyuhub-staging --tail 50
```

---

## ✅ Critérios de Sucesso - STAGING

- [ ] Build Alpine completa sem erros
- [ ] Imagem ~130MB (vs ~336MB anterior)
- [ ] Healthcheck funcionando (status: healthy)
- [ ] Health endpoint retorna 200 OK
- [ ] App funciona normalmente
- [ ] Logs aparecem corretamente
- [ ] Resource limits aplicados
- [ ] Sem erros nos logs

---

## 🧪 Testes em Staging

### Teste 1: Healthcheck
```bash
# Verificar status do healthcheck
docker inspect hallyuhub-staging --format='{{json .State.Health}}' | jq
```

**Esperado:**
```json
{
  "Status": "healthy",
  "FailingStreak": 0,
  "Log": [...]
}
```

### Teste 2: Resource Limits
```bash
# Verificar limites aplicados
docker stats hallyuhub-staging --no-stream
```

**Esperado:**
- CPU < 100%
- Memory < 1GB

### Teste 3: Logs
```bash
# Verificar rotação de logs
docker inspect hallyuhub-staging --format='{{json .HostConfig.LogConfig}}' | jq
```

**Esperado:**
```json
{
  "Type": "json-file",
  "Config": {
    "max-file": "3",
    "max-size": "10m"
  }
}
```

### Teste 4: Tamanho
```bash
# Comparar tamanhos
docker images | grep khub
```

**Esperado:**
- `staging-alpine`: ~130MB
- Imagem anterior: ~336MB

---

## 🔄 Rollback (se necessário)

Se algo der errado em staging:

```bash
# SSH no servidor
ssh $SSH_USER@31.97.255.107
cd /var/www/hallyuhub

# Restaurar docker-compose anterior
cp docker-compose.staging.yml.backup docker-compose.staging.yml

# Pull imagem anterior
docker pull ghcr.io/uchidate/khub:staging-bullseye

# Restart
docker-compose restart hallyuhub-staging
```

---

## 🚀 Produção (Após Aprovação)

**AGUARDAR CONFIRMAÇÃO: "Staging OK, pode ir para produção"**

Quando staging estiver validado:

1. Merge develop → main
2. Push origin main
3. GitHub Actions faz deploy automático
4. Monitorar production por 30 minutos
5. Validar métricas

---

## 📊 Métricas a Monitorar

### Staging
- Tamanho da imagem
- Status do healthcheck
- Tempo de startup
- Uso de CPU/Memory
- Logs funcionando

### Production (após aprovação)
- Mesmas métricas
- Tempo de resposta
- Uptime
- Erros nos logs

---

## 📞 Troubleshooting

### "Build falha no Alpine"
**Causa:** Dependência nativa faltando
**Solução:** Adicionar no `apk add` do Dockerfile.alpine

### "Healthcheck sempre unhealthy"
**Causa:** App demora mais que 40s para iniciar
**Solução:** Aumentar `start_period` no healthcheck

### "wget: command not found"
**Causa:** Alpine não tem wget instalado
**Solução:** Já incluído no Dockerfile (apk add wget)

### "Container consome muita memória"
**Causa:** Limite muito baixo
**Solução:** Ajustar limite em docker-compose

---

## 🎯 Resultado Esperado

### Staging
- ✅ Imagem 60% menor
- ✅ Healthcheck funcionando
- ✅ Resource limits ativos
- ✅ Logs com rotação
- ✅ App funcional

### Production (após aprovação)
- ✅ Mesmo resultado de staging
- ✅ Deploy mais rápido (imagem menor)
- ✅ Maior confiabilidade (healthcheck)
- ✅ Uso de recursos otimizado

---

**⏰ Tempo Estimado:** 45-60 minutos (staging + validação)
**👤 Executado por:** Você (com meu suporte)
**🔄 Próxima melhoria:** Consolidação de Estrutura (após aprovação)

---

*Criado em: 02/02/2026*
*Status: Pronto para execução em staging*
