# 🔐 Melhoria #1: Segurança de API Keys

## 🎯 Objetivo

Remover API keys expostas do Git e implementar proteções contra futuras exposições.

---

## ⚠️ Problema Atual

**CRÍTICO:** API key do Gemini está exposta no arquivo `v1/.env` que foi commitado:
```
GEMINI_API_KEY=AIzaSyCeAhim6T2XZQfXy2F1c6Y7y8OVOoh5-_g
```

**Riscos:**
- ❌ Qualquer pessoa com acesso ao repo pode usar a chave
- ❌ Possível uso indevido e cobranças inesperadas
- ❌ Violação de segurança

---

## ✅ Solução

### Passo 1: Executar Script de Correção

```bash
./scripts/security/fix-api-keys.sh
```

**O que o script faz:**
- ✅ Backup do .env atual
- ✅ Atualiza .gitignore para proteger .env
- ✅ Remove v1/.env do Git (se commitado)
- ✅ Cria template seguro (.env.template)
- ✅ Instala pre-commit hook para detectar secrets
- ✅ Verifica histórico do Git

---

### Passo 2: Regenerar API Keys

#### Google Gemini (OBRIGATÓRIO)

1. **Revogar chave exposta:**
   - Acesse: https://aistudio.google.com/app/apikey
   - Encontre a chave: `AIzaSyCeAhim6T2XZQfXy2F1c6Y7y8OVOoh5-_g`
   - Clique em "Delete" ou "Revoke"

2. **Gerar nova chave:**
   - No mesmo painel, clique em "Create API Key"
   - Copie a nova chave (será algo como `AIza...`)
   - **IMPORTANTE:** Não commite esta chave!

#### Outras API Keys (Opcional - se estiverem configuradas)

- **OpenAI:** https://platform.openai.com/api-keys
- **Anthropic:** https://console.anthropic.com/settings/keys
- **TMDB:** https://www.themoviedb.org/settings/api
- **Unsplash:** https://unsplash.com/oauth/applications

---

### Passo 3: Configurar Localmente

```bash
# Criar .env local a partir do template
cp v1/.env.template v1/.env

# Editar e adicionar as novas chaves
nano v1/.env
# ou
code v1/.env
```

**Exemplo de v1/.env:**
```bash
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
OLLAMA_BASE_URL="http://localhost:11434"

# Novas chaves (NÃO COMMITAR!)
GEMINI_API_KEY="AIza_SUA_NOVA_CHAVE_AQUI"
OPENAI_API_KEY=""
ANTHROPIC_API_KEY=""

NEXT_TELEMETRY_DISABLED=1
```

---

### Passo 4: Configurar GitHub Secrets (Staging)

1. **Acessar GitHub Secrets:**
   ```
   https://github.com/uchidate/khub/settings/secrets/actions
   ```

2. **Criar/Atualizar secrets para ambiente `staging`:**

   Clique em "New repository secret" ou edite existente:

   - Nome: `GEMINI_API_KEY`
   - Value: `[sua nova chave]`
   - Environment: `staging`

3. **Outros secrets necessários:**
   - `OPENAI_API_KEY` (se usar)
   - `ANTHROPIC_API_KEY` (se usar)
   - `TMDB_API_KEY` (se usar)

---

### Passo 5: Testar em Homologação (Staging)

#### 5.1. Atualizar workflow para usar secrets

Verificar se `.github/workflows/deploy-image.yml` está usando secrets:

```yaml
# O workflow já deve ter algo assim:
- name: Deploy to staging
  env:
    GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

#### 5.2. Commit e push para staging

```bash
# Verificar o que será commitado
git status

# Adicionar apenas arquivos seguros
git add .gitignore
git add v1/.env.template
git add scripts/security/fix-api-keys.sh

# Commit
git commit -m "security: protect API keys and add .env to .gitignore

- Add v1/.env to .gitignore
- Create .env.template for reference
- Add pre-commit hook to detect secrets
- Update .gitignore with security patterns

BREAKING CHANGE: .env file must be created locally from template"

# Push para develop (staging)
git checkout develop
git merge sua-branch
git push origin develop
```

#### 5.3. Verificar deploy em staging

```bash
# Aguardar GitHub Actions completar
# Verificar logs: https://github.com/uchidate/khub/actions

# Testar staging
make health

# Ou manualmente:
curl http://31.97.255.107:3001/api/health
```

#### 5.4. Verificar se API keys funcionam em staging

```bash
# SSH no servidor (se tiver acesso)
ssh $SSH_USER@31.97.255.107

# Verificar logs do container
docker logs hallyuhub-staging --tail 50

# Procurar por erros de autenticação de API
# Exemplo: "Invalid API key" ou "Authentication failed"
```

---

### Passo 6: Após Aprovação - Deploy para Produção

**⚠️ AGUARDAR APROVAÇÃO ANTES DE CONTINUAR**

Quando staging estiver funcionando:

1. **Configurar secrets para production:**
   - GitHub Secrets → Environment: `production`
   - Mesmas chaves de staging (ou diferentes se preferir)

2. **Merge para main:**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

3. **Verificar production:**
   ```bash
   curl http://31.97.255.107:3000/api/health
   ```

---

## ✅ Critérios de Sucesso

**Em Staging:**
- [ ] Script `fix-api-keys.sh` executado sem erros
- [ ] Nova chave Gemini gerada e revogada a antiga
- [ ] GitHub Secrets configurados para staging
- [ ] Deploy em staging concluído com sucesso
- [ ] Health check retorna 200 OK
- [ ] Funcionalidades de IA funcionando (testar geração de conteúdo)
- [ ] Logs sem erros de autenticação

**Em Production (após aprovação):**
- [ ] GitHub Secrets configurados para production
- [ ] Deploy em production concluído
- [ ] Health check retorna 200 OK
- [ ] Funcionalidades de IA funcionando
- [ ] Monitoramento ativo sem erros

---

## 🧪 Testes

### Teste Local
```bash
# 1. Criar .env local
cp v1/.env.template v1/.env

# 2. Adicionar chave Gemini
# Editar v1/.env

# 3. Testar localmente
cd v1
npm run dev

# 4. Testar geração de conteúdo
npm run atualize:ai -- --provider=gemini --test
```

### Teste em Staging
```bash
# 1. Verificar health
curl http://31.97.255.107:3001/api/health

# 2. SSH e testar script de IA
ssh $SSH_USER@31.97.255.107
cd /var/www/hallyuhub
docker exec hallyuhub-staging npm run ai:stats
```

---

## 🔄 Rollback (se necessário)

Se algo der errado em staging:

```bash
# 1. Restaurar .env do backup (local)
cp v1/.env.backup v1/.env

# 2. Reverter commit
git revert HEAD

# 3. Push
git push origin develop
```

---

## 📋 Checklist de Execução

### Preparação
- [ ] Ler este documento completamente
- [ ] Entender os riscos da chave exposta
- [ ] Ter acesso ao Google AI Studio
- [ ] Ter acesso ao GitHub Secrets

### Execução Local
- [ ] Executar `./scripts/security/fix-api-keys.sh`
- [ ] Revisar output do script
- [ ] Regenerar chave Gemini
- [ ] Criar `v1/.env` local com nova chave
- [ ] Testar localmente com `npm run dev`

### Staging
- [ ] Configurar GitHub Secrets (staging)
- [ ] Commit e push para develop
- [ ] Aguardar GitHub Actions
- [ ] Verificar health check
- [ ] Testar funcionalidades de IA
- [ ] Revisar logs
- [ ] **CHECKPOINT: Tudo OK em staging?**

### Production (Aguardar Aprovação)
- [ ] Aprovação recebida?
- [ ] Configurar GitHub Secrets (production)
- [ ] Merge para main
- [ ] Aguardar GitHub Actions
- [ ] Verificar health check
- [ ] Monitorar por 30 minutos

---

## ❓ Troubleshooting

### "API key inválida" em staging

**Solução:**
1. Verificar se secret está configurado no GitHub
2. Verificar nome do secret (case-sensitive)
3. Re-deploy forçado: `git commit --allow-empty && git push`

### Pre-commit hook bloqueia commit legítimo

**Solução:**
```bash
# Apenas se REALMENTE não houver secrets
git commit --no-verify -m "sua mensagem"
```

### Chave antiga ainda funciona

**Solução:**
1. Aguardar alguns minutos (propagação)
2. Forçar revogação no Google AI Studio
3. Verificar se revogou a chave correta

---

## 📞 Suporte

**Problemas?**
- Verifique logs: `docker logs hallyuhub-staging`
- GitHub Actions: https://github.com/uchidate/khub/actions
- Me avise e posso ajudar a debugar

---

## 🎯 Resultado Esperado

**Antes:**
- ❌ API key exposta no Git
- ❌ Risco de segurança
- ❌ Sem proteção contra commits futuros

**Depois:**
- ✅ API keys protegidas (fora do Git)
- ✅ Pre-commit hook detecta secrets
- ✅ .gitignore atualizado
- ✅ GitHub Secrets configurados
- ✅ Template documentado (.env.template)
- ✅ Processo seguro estabelecido

---

**⏰ Tempo Estimado:** 30-45 minutos
**👤 Executado por:** Você (com meu suporte)
**🔄 Próxima melhoria:** Docker Healthcheck (após aprovação desta)

---

*Criado em: 02/02/2026*
*Status: Aguardando execução*
