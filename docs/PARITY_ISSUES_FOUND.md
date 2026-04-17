# ⚠️ Diferenças Não Autorizadas Encontradas

**Data:** 2026-02-10
**Status:** ❌ Staging e Production NÃO são espelhos

---

## 🔍 Resumo

Após normalização de particularidades legítimas (portas, URLs, nomes de containers), foram encontradas **389 linhas de diferenças** entre staging e production.

**Particularidades legítimas (OK):**
- ✅ Emojis: 🟡 (staging) vs 🟢 (production) - Visual apenas
- ✅ Branch refs: `staging` vs `main`
- ✅ URLs: `31.97.255.107:3001` vs `www.hallyuhub.com.br`
- ✅ Protocolo: `http://` vs `https://`

**Diferenças NÃO autorizadas (PROBLEMA):**

---

## 📋 Categorias de Problemas

### 1. 🔧 Lógica Extra em Production (não está em staging)

#### a) Instalação de SSH
**Production tem:**
```yaml
# Install SSH if not available
which ssh || (apt-get update && apt-get install -y openssh-client)
```

**Staging:** Não tem

**Impacto:** Se staging precisar de SSH instalado, falhará.

---

#### b) Fallback para .env backup
**Production tem:**
```bash
if [ ! -f .env.production ]; then
  echo "⚠️ .env.production not found! Creating from backup or empty..."
  if [ -f .env.production.bak ]; then
    cp .env.production.bak .env.production
  else
    touch .env.production
  fi
fi
```

**Staging tem:**
```bash
if [ ! -f .env.staging ]; then
  touch .env.staging
fi
```

**Impacto:** Staging não tenta restaurar de backup.

---

#### c) Detecção de docker-compose v1 vs v2
**Production tem:**
```bash
# Determinar comando docker-compose (v1 vs v2)
if docker compose version >/dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
  echo "✅ Usando 'docker compose' (V2)"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
  echo "✅ Usando 'docker-compose' (V1)"
else
  echo "❌ Erro: Nem 'docker compose' nem 'docker-compose' encontrados!"
  exit 1
fi
```

**Staging:** Parece não ter (ou está diferente).

**Impacto:** Staging pode usar comando hardcoded e falhar em servidores com apenas v1 ou v2.

---

### 2. 📝 Mensagens Diferentes

#### a) Setup de variáveis de ambiente
**Production:** `"🔧 Updating sensitive keys..."`
**Staging:** `"🔧 Updating environment variables..."`

**Recomendação:** Padronizar para "Updating environment variables"

---

#### b) Confirmação de setup
**Production:** `"✅ Env prep complete."`
**Staging:** `"✅ Setup complete."`

**Recomendação:** Padronizar para "Setup complete"

---

#### c) Mensagem de sucesso
**Production:** `"🎉 Aplicação em produção atualizada!"`
**Staging:**
```
Próximos passos:
1. Validar funcionalidades em staging
2. Criar PR: staging → main
```

**Impacto:** Staging tem informações úteis de próximos passos; production não.

**Recomendação:** Ambos deveriam ter próximos passos contextualizados.

---

#### d) Mensagem de falha
**Production:** `"🚨 ATENÇÃO: Deploy em produção falhou!"`
**Staging:** `"⚠️ ATENÇÃO: Deploy em staging falhou!"`

**Diferença:** Apenas emoji e nome do ambiente (OK após normalização).

---

### 3. 🔒 Informações de SSL

**Production tem:**
```
echo "**SSL:** ✅ Válido" >> $GITHUB_STEP_SUMMARY
```

E nas notificações Slack:
```
{"type": "mrkdwn", "text": "✅ SSL: Válido"}
```

**Staging:** Não tem

**Impacto:** Staging não valida SSL (mas usa HTTP, então faz sentido).

**Recomendação:** Manter essa diferença APENAS se staging usa HTTP. Se staging migrar para HTTPS, deve ter mesma validação.

---

### 4. 🌐 URLs em Notificações

**Production:**
```
🔗 <https://www.hallyuhub.com.br|🌐 Ver Site>
```

**Staging:**
```
🔗 <http://staging.hallyuhub.com.br|🌐 Ver Site>
```

**Status:** ✅ OK (particularidade de ambiente)

---

### 5. 🎯 Próximos Passos (GitHub Step Summary)

**Production:**
```
echo "🎉 **Aplicação em produção atualizada com sucesso!**" >> $GITHUB_STEP_SUMMARY
```

**Staging:**
```
echo "**Próximos passos:**" >> $GITHUB_STEP_SUMMARY
echo "1. Validar funcionalidades em staging" >> $GITHUB_STEP_SUMMARY
echo "2. Criar PR: \`staging\` → \`main\`" >> $GITHUB_STEP_SUMMARY
```

**Impacto:** Staging fornece orientação sobre workflow; production não.

**Recomendação:** Production deveria ter algo como:
```
echo "🎉 **Aplicação em produção atualizada com sucesso!**" >> $GITHUB_STEP_SUMMARY
echo "**Monitoramento:**" >> $GITHUB_STEP_SUMMARY
echo "1. Verificar métricas em produção" >> $GITHUB_STEP_SUMMARY
echo "2. Monitorar logs por 15 minutos" >> $GITHUB_STEP_SUMMARY
```

---

## 🎯 Plano de Correção

### Prioridade 1: Lógica Crítica (OBRIGATÓRIO)

1. **Adicionar detecção de docker-compose v1/v2 em staging**
   - Copiar bloco completo de production
   - Usar `$COMPOSE_CMD` em todos os comandos

2. **Padronizar lógica de .env fallback**
   - Staging deveria tentar restaurar de backup (como production)
   - OU production deveria simplificar (como staging)
   - **Recomendação:** Usar lógica de production em ambos

3. **Adicionar instalação de SSH em staging**
   - Copiar linha de production
   - OU verificar se staging já tem SSH no runner

---

### Prioridade 2: Mensagens e UX (RECOMENDADO)

4. **Padronizar mensagens de log**
   - Usar mesmas mensagens em ambos
   - Variação permitida: nome do ambiente apenas

5. **Adicionar "Próximos passos" contextualizados**
   - Staging: Validar → Criar PR
   - Production: Monitorar → Verificar métricas

---

### Prioridade 3: SSL (CONDICIONAL)

6. **SSL validation:**
   - Se staging migrar para HTTPS: adicionar validação SSL
   - Se staging permanecer HTTP: manter diferença

---

## 🚀 Como Corrigir

### Opção A: Fazer staging idêntico a production

```bash
# Copiar blocos de production para staging
# Ajustar apenas nomes de arquivos e URLs
```

**Vantagens:**
- Production tem lógica mais robusta (fallbacks, detecção de versão)
- Staging ficará mais confiável

**Desvantagens:**
- Mais complexo

---

### Opção B: Simplificar production para match staging

```bash
# Remover lógica extra de production
# Assumir ambiente controlado
```

**Vantagens:**
- Mais simples
- Menos código para manter

**Desvantagens:**
- Production perde resiliência

---

### Opção C: Normalizar diferenças legítimas

Aceitar que algumas diferenças são legítimas:
- SSL validation: OK (production usa HTTPS, staging HTTP)
- Mensagens de próximos passos: OK (contextos diferentes)

Corrigir apenas:
- ✅ Detecção docker-compose
- ✅ .env fallback logic
- ✅ Mensagens de log

---

## 🎯 Recomendação Final

**Adotar Opção A + C:**

1. **Copiar lógica robusta de production para staging:**
   - Detecção docker-compose v1/v2
   - .env fallback com tentativa de restore
   - SSH installation check

2. **Aceitar diferenças contextuais:**
   - SSL validation (apenas production)
   - Próximos passos (diferentes mas adequados)
   - Emojis visuais (🟡 vs 🟢)

3. **Padronizar mensagens genéricas:**
   - "Updating environment variables"
   - "Setup complete"

**Resultado:** Staging e production serão espelhos funcionais, com apenas particularidades de ambiente justificadas.

---

## 📊 Impacto Atual

**Risco:** 🟡 MÉDIO

- Staging pode falhar em ambientes com apenas docker-compose v1 ou v2
- Staging não tenta recuperar .env de backup
- Usuários não têm orientação clara sobre próximos passos após deploy

**Urgência:** MODERADA

- Não está causando falhas atualmente
- Mas pode causar falhas em mudanças futuras de infraestrutura

---

## 📝 Arquivos para Análise Detalhada

- `/tmp/staging-job.yml` - Job de staging (original)
- `/tmp/production-job.yml` - Job de production (original)
- `/tmp/diff-result.txt` - Diff completo (389 linhas)

```bash
# Ver diff completo
cat /tmp/diff-result.txt | less

# Ver apenas staging
cat /tmp/staging-job.yml | less

# Ver apenas production
cat /tmp/production-job.yml | less
```
