# Fluxo Robusto de Deploy - HallyuHub

Este documento descreve o fluxo completo e robusto de desenvolvimento, testes e deploy para evitar problemas em produção.

## 📊 Visão Geral dos Ambientes

| Ambiente | Branch | Tag Docker | Porta | URL | Deploy |
|----------|--------|------------|-------|-----|--------|
| **Development** | `develop` | `:staging` | 3001 | http://31.97.255.107:3001 | Automático (push) |
| **Staging** | `develop` | `:staging` | 3001 | http://31.97.255.107:3001 | Automático (push) |
| **Production** | `main` | `:latest` | 3000 | https://www.hallyuhub.com.br | Automático (merge) |

## 🔄 Fluxo Recomendado

```
develop → staging (teste) → main (production)
   ↓           ↓                ↓
  :staging   :staging         :latest
  (auto)     (auto)           (auto)
```

### Etapas do Fluxo

1. **Desenvolver** em branch `develop`
2. **Commitar e Push** para `develop`
3. **GitHub Actions** builda imagem `:staging`
4. **Deploy automático** para Staging (porta 3001)
5. **Testar** em staging
6. **Merge** para `main` (somente após validação)
7. **GitHub Actions** builda imagem `:latest`
8. **Deploy automático** para Production (porta 3000)

---

## ✅ Checklist Pré-Deploy

### Antes de Fazer Push para Develop

- [ ] Código testado localmente (`npm run build`)
- [ ] Sem erros de TypeScript (`npm run type-check`)
- [ ] Sem erros de ESLint (`npm run lint`)
- [ ] Testes passando (se houver)

### Antes de Merge para Main

- [ ] ✅ **CRÍTICO**: Testar TUDO em staging primeiro
- [ ] Build passou em develop
- [ ] Deploy staging concluído com sucesso
- [ ] Site staging acessível: http://31.97.255.107:3001
- [ ] Health endpoint OK: `curl http://31.97.255.107:3001/api/health`
- [ ] Funcionalidades testadas manualmente em staging
- [ ] Sem erros nos logs: `ssh root@31.97.255.107 'docker logs hallyuhub-staging --tail 50'`

---

## 🧪 Testando em Cada Ambiente

### Testar Staging (Após Push para Develop)

```bash
# 1. Aguardar deploy completar (GitHub Actions)
gh run list --branch develop --limit 1

# 2. Verificar se containers estão rodando
ssh root@31.97.255.107 'docker ps | grep staging'

# 3. Testar health endpoint
curl http://31.97.255.107:3001/api/health | jq .

# 4. Verificar logs
ssh root@31.97.255.107 'docker logs hallyuhub-staging --tail 50'

# 5. Testar site no navegador
open http://31.97.255.107:3001
```

### Testar Production (Após Merge para Main)

```bash
# 1. Aguardar deploy completar
gh run list --branch main --limit 1

# 2. Verificar containers
ssh root@31.97.255.107 'docker ps | grep -E "hallyuhub|postgres-production|ollama-production"'

# 3. Testar health endpoint
curl https://www.hallyuhub.com.br/api/health | jq .

# 4. Verificar SSL
curl -I https://www.hallyuhub.com.br

# 5. Verificar logs
ssh root@31.97.255.107 'docker logs hallyuhub --tail 50'

# 6. Testar site no navegador
open https://www.hallyuhub.com.br

# 7. Executar script de verificação completo
ssh root@31.97.255.107 'cd /var/www/hallyuhub && ./scripts/verify-production.sh'
```

---

## 🚨 Troubleshooting Comum

### Problema: Imagem Docker não atualiza com código novo

**Sintoma**: Deploy concluiu mas código antigo ainda está no container

**Causa**: Cache do Docker no GitHub Actions

**Solução**:
```bash
# 1. Verificar qual commit está na imagem
ssh root@31.97.255.107 'docker inspect hallyuhub | jq ".[0].Config.Labels"'

# 2. Se commit estiver errado, forçar rebuild
# Adicione comentário no Dockerfile e commit:
# Force rebuild: updated YYYY-MM-DD

# 3. Ou fazer down/up dos containers
ssh root@31.97.255.107 'cd /var/www/hallyuhub && docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d'
```

### Problema: Container não sobe após deploy

**Sintoma**: `docker ps` não mostra container ou status `Restarting`

**Solução**:
```bash
# 1. Ver logs do container
ssh root@31.97.255.107 'docker logs hallyuhub --tail 100'

# 2. Verificar se .env.production existe
ssh root@31.97.255.107 'test -f /var/www/hallyuhub/.env.production && echo "OK" || echo "FALTA"'

# 3. Verificar se variáveis estão corretas
ssh root@31.97.255.107 'docker exec hallyuhub env | grep DATABASE_URL'

# 4. Recriar container
ssh root@31.97.255.107 'cd /var/www/hallyuhub && docker-compose -f docker-compose.prod.yml up -d --force-recreate hallyuhub'
```

### Problema: Erro "ContainerConfig" ao recriar

**Sintoma**: `KeyError: 'ContainerConfig'` ao executar `docker-compose up`

**Causa**: Bug do docker-compose com metadata corrompida

**Solução**:
```bash
ssh root@31.97.255.107 'cd /var/www/hallyuhub && docker-compose -f docker-compose.prod.yml down && docker-compose -f docker-compose.prod.yml up -d'
```

### Problema: Auto-geração não está rodando

**Sintoma**: Artistas não são gerados automaticamente

**Solução**:
```bash
# 1. Verificar se cron está configurado
ssh root@31.97.255.107 'crontab -l | grep auto-generate'

# 2. Testar geração manual
ssh root@31.97.255.107 'cd /var/www/hallyuhub && ./scripts/auto-generate-content.sh'

# 3. Ver logs de geração
ssh root@31.97.255.107 'tail -100 /var/www/hallyuhub/logs/auto-generate-$(date +%Y-%m).log'

# 4. Reconfigurar cron
ssh root@31.97.255.107 'cd /var/www/hallyuhub && ./scripts/setup-auto-generation.sh'
```

### Problema: Ollama não responde ou timeout

**Sintoma**: Geração de artistas falha com timeout

**Solução**:
```bash
# 1. Verificar se Ollama está saudável
ssh root@31.97.255.107 'docker inspect hallyuhub-ollama-production | grep Status'

# 2. Ver logs do Ollama
ssh root@31.97.255.107 'docker logs hallyuhub-ollama-production --tail 50'

# 3. Testar Ollama
ssh root@31.97.255.107 'cd /var/www/hallyuhub && ./scripts/test-ollama.sh production'

# 4. Reiniciar Ollama
ssh root@31.97.255.107 'docker restart hallyuhub-ollama-production'

# 5. Se necessário, reconfigurar (baixa modelo ~2.2GB)
ssh root@31.97.255.107 'cd /var/www/hallyuhub && ./scripts/setup-ollama-docker.sh production'
```

---

## 🛡️ Boas Práticas

### 1. SEMPRE Testar em Staging Primeiro

❌ **NUNCA** faça:
```bash
git push origin main  # Push direto para main
```

✅ **SEMPRE** faça:
```bash
git push origin develop        # 1. Push para develop
# Aguardar deploy staging
# Testar em http://31.97.255.107:3001
git checkout main             # 2. Após validação
git merge develop             # 3. Merge para main
git push origin main          # 4. Deploy production
```

### 2. Validar Builds Localmente

Antes de fazer push:
```bash
# Build local
docker build -t test:local .

# Verificar se build passou
echo $?  # Deve ser 0

# Testar TypeScript
npm run type-check

# Testar ESLint
npm run lint
```

### 3. Monitorar Deploys

```bash
# Ver status do último deploy
gh run list --limit 1

# Ver logs em tempo real
gh run watch <run-id>

# Ver notificações no Slack
# Canal #deploys recebe notificações automáticas
```

### 4. Rollback Rápido (Se Necessário)

Se produção quebrou após merge:

```bash
# 1. Reverter merge
git revert HEAD -m 1
git push origin main

# 2. Ou usar imagem anterior
ssh root@31.97.255.107 'docker pull ghcr.io/uchidate/khub:sha-<commit-anterior>'
ssh root@31.97.255.107 'docker tag ghcr.io/uchidate/khub:sha-<commit-anterior> ghcr.io/uchidate/khub:latest'
ssh root@31.97.255.107 'cd /var/www/hallyuhub && docker-compose -f docker-compose.prod.yml up -d'
```

### 5. Documentar Mudanças Críticas

Ao fazer mudanças em:
- Dockerfile
- docker-compose.*.yml
- Scripts de deploy
- Configurações de servidor

**SEMPRE** atualize este documento e/ou SERVER_SETUP.md

---

## 📝 Comandos Úteis

### Verificação Rápida

```bash
# Status completo de production
ssh root@31.97.255.107 'cd /var/www/hallyuhub && ./scripts/verify-production.sh'

# Status completo de staging
ssh root@31.97.255.107 'cd /var/www/hallyuhub && ./scripts/verify-staging.sh'

# Logs de todos os serviços
ssh root@31.97.255.107 'docker-compose -f /var/www/hallyuhub/docker-compose.prod.yml logs --tail 50'

# Uso de recursos
ssh root@31.97.255.107 'docker stats --no-stream'
```

### Debug Rápido

```bash
# Entrar no container
ssh root@31.97.255.107 'docker exec -it hallyuhub sh'

# Ver variáveis de ambiente
ssh root@31.97.255.107 'docker exec hallyuhub env | sort'

# Ver arquivos do container
ssh root@31.97.255.107 'docker exec hallyuhub ls -la /app'

# Verificar conectividade PostgreSQL
ssh root@31.97.255.107 'docker exec hallyuhub-postgres-production pg_isready -U hallyuhub'

# Verificar Ollama
ssh root@31.97.255.107 'docker exec hallyuhub-ollama-production ollama list'
```

---

## 🔐 Segurança

### Arquivos Sensíveis (NUNCA Commitar)

- `.env`
- `.env.production`
- `.env.staging`
- Qualquer arquivo com secrets/keys

### Verificar Antes de Commit

```bash
# O pre-commit hook verifica automaticamente
# Se houver secret detectado, o commit será bloqueado
# Use --no-verify APENAS se tiver certeza absoluta
```

---

## 📊 Métricas de Deploy

### Deploy Saudável

- ✅ Build: < 3 minutos
- ✅ Deploy staging: < 2 minutos
- ✅ Deploy production: < 2 minutos
- ✅ Health check: 200 OK
- ✅ SSL: Válido
- ✅ Containers: Todos healthy
- ✅ Logs: Sem erros críticos

### Alertas

Configure alertas no Slack para:
- Deploy falhou
- Health check failed
- Containers não saudáveis
- Disco cheio (> 80%)
- Memória alta (> 80%)

---

## 🆘 Contatos de Emergência

- **Slack**: #deploys (notificações automáticas)
- **Slack**: #alerts (alertas de sistema)
- **GitHub**: Issues para bugs
- **Servidor**: root@31.97.255.107

---

## 📚 Documentos Relacionados

- [SERVER_SETUP.md](SERVER_SETUP.md) - Setup inicial do servidor
- [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) - Guia completo de produção
- [HTTPS_SETUP.md](HTTPS_SETUP.md) - Configuração SSL/HTTPS
- [OLLAMA_SETUP.md](OLLAMA_SETUP.md) - Configuração Ollama
- [AUTO_GENERATION.md](AUTO_GENERATION.md) - Auto-geração de conteúdo

---

## 🎯 Lições Aprendidas

### Problema: Cache do Docker não invalida

**O que aprendemos**: GitHub Actions usa cache agressivo do Docker

**Solução**: Modificar Dockerfile com comentário datado para forçar rebuild:
```dockerfile
# Force rebuild: updated YYYY-MM-DD
COPY . .
```

### Problema: Tags Docker confusas

**O que aprendemos**: Branch develop buildava `:staging` mas production usava `:latest`

**Solução**: Documentar claramente qual branch usa qual tag:
- `main` → `:latest`
- `develop` → `:staging`

### Problema: Parâmetros CLI incorretos

**O que aprendemos**: `--news 1` não funciona, precisa ser `--news=1`

**Solução**: Sempre usar formato `--param=value` em scripts

### Problema: Ollama timeout

**O que aprendemos**: Ollama é lento, gerar 3 artistas + 2 produções causa timeout

**Solução**: Gerar apenas 1 artista por execução (a cada 15min)

---

## ✨ Conclusão

Este fluxo foi projetado para ser:
- **Robusto**: Múltiplas validações em cada etapa
- **Seguro**: Sempre testar em staging antes de production
- **Rastreável**: Logs e notificações em cada deploy
- **Recuperável**: Fácil rollback se algo der errado

**Lembre-se**: O tempo extra para testar em staging é MUITO menor que o tempo para corrigir production quebrado.
