# 🔒 Enforcement de Paridade Staging/Production

## Objetivo

Garantir que **staging e production sejam sempre espelhos**, diferindo apenas em particularidades de ambiente.

**Princípio:** Erros em um ambiente = erros em ambos. Correção em um = correção em ambos.

---

## Como Funciona

### 1. Workflow Automatizado (`.github/workflows/parity-check.yml`)

**Dispara automaticamente quando:**
- ✅ PR modifica `.github/workflows/deploy.yml`
- ✅ PR modifica `docker-compose.*.yml`
- ✅ PR modifica `.env.*.example`

**O que verifica:**
1. Extrai jobs `deploy-staging` e `deploy-production` do workflow
2. Normaliza diferenças **permitidas** (whitelist)
3. Compara line-by-line as versões normalizadas
4. **Bloqueia PR** se houver diferenças não autorizadas

**Diferenças permitidas (whitelist):**
- `staging` ↔ `production`
- `.env.staging` ↔ `.env.production`
- `docker-compose.staging.yml` ↔ `docker-compose.prod.yml`
- `hallyuhub-staging` ↔ `hallyuhub`
- `postgres-staging` ↔ `postgres-production`
- `ollama-staging` ↔ `ollama-production`
- `31.97.255.107:3001` ↔ `www.hallyuhub.com.br`
- `http://` ↔ `https://`
- `restart: "no"` ↔ `restart: always`

**Qualquer outra diferença = CI BLOQUEIA!**

---

## Como Ativar no GitHub

### Passo 1: Fazer merge deste PR

O workflow `.github/workflows/parity-check.yml` será criado e ativado automaticamente.

### Passo 2: Configurar Branch Protection Rules

1. Ir em: **Settings** → **Branches** → **Branch protection rules**
2. Editar regra da branch `main`
3. Marcar: ✅ **Require status checks to pass before merging**
4. Buscar e adicionar: **Verificar Paridade Staging/Production**
5. Salvar changes

**Resultado:** Nenhum PR pode ser mergeado para `main` sem passar no parity check!

---

## Adicionando Novas Diferenças Permitidas

Se precisar adicionar uma nova particularidade legítima:

1. Editar `.github/workflows/parity-check.yml`
2. Adicionar padrão na lista `ALLOWED_DIFFS`:

```bash
ALLOWED_DIFFS=(
  "staging|production"
  # ... outras diferenças ...
  "nova-diferenca-staging|nova-diferenca-production"  # ← ADICIONAR AQUI
)
```

3. Commitar e fazer PR
4. Workflow validará a nova regra

---

## Testando Localmente

Simular o parity check antes de fazer PR:

```bash
# Extrair jobs
sed -n '/^  deploy-staging:/,/^  [a-z-]*:/p' .github/workflows/deploy.yml | head -n -1 > /tmp/staging.yml
sed -n '/^  deploy-production:/,/^  [a-z-]*:/p' .github/workflows/deploy.yml | head -n -1 > /tmp/production.yml

# Normalizar diferenças permitidas
sed -i '' 's/staging/NORMALIZED/g; s/production/NORMALIZED/g' /tmp/staging.yml /tmp/production.yml

# Comparar
diff -u /tmp/staging.yml /tmp/production.yml
```

**Se diff retornar vazio:** ✅ Paridade OK!
**Se diff mostrar diferenças:** ❌ Corrigir antes de PR!

---

## Benefícios

### 🛡️ Prevenção Automática
- Impossível quebrar paridade sem CI bloquear
- Não depende de revisão manual
- Força boas práticas

### 📊 Visibilidade
- Status check visível em todo PR
- Diferenças mostradas claramente
- Documentação auto-explicativa

### 🔧 Manutenibilidade
- Whitelist centralizada e versionada
- Fácil adicionar novas particularidades
- Histórico de mudanças no Git

---

## Exemplos de Uso

### ✅ Exemplo: PR Válido

**Mudança:** Adicionar retry logic em ambos staging e production

**Resultado:**
```
✅ SUCESSO: Staging e Production são espelhos perfeitos!
```

PR pode ser mergeado.

---

### ❌ Exemplo: PR Inválido

**Mudança:** Adicionar healthcheck apenas em staging

**Resultado:**
```
❌ FALHA: Encontradas diferenças NÃO autorizadas!

DIFERENÇAS DETECTADAS:
+  healthcheck:
+    test: ["CMD", "curl", "-f", "http://localhost:3000"]
```

PR **BLOQUEADO** até corrigir production para match staging.

---

## Troubleshooting

### Falso Positivo: "Diferença detectada" mas é particularidade válida

**Solução:** Adicionar padrão na whitelist `ALLOWED_DIFFS`

### Workflow não está rodando

**Verificar:**
1. Workflow está na branch `main`?
2. PR modifica arquivos monitorados (`deploy.yml`, `docker-compose.*.yml`, `.env.*.example`)?
3. Workflow está habilitado em **Actions** → **Workflows**?

### Como testar o workflow sem fazer PR

```bash
# Disparar manualmente via gh CLI
gh workflow run parity-check.yml
```

---

## Manutenção

### Revisar whitelist regularmente

**Frequência:** A cada 3 meses ou quando adicionar novo ambiente

**Checklist:**
- [ ] Todas as diferenças na whitelist ainda são válidas?
- [ ] Alguma particularidade nova deve ser adicionada?
- [ ] Whitelist está documentada corretamente?

---

## Referências

- Workflow: [`.github/workflows/parity-check.yml`](../.github/workflows/parity-check.yml)
- Deploy workflow: [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
- Memória: [`MEMORY.md`](../memory/MEMORY.md) - Regra crítica #1
