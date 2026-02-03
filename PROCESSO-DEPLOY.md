# Processo de Deploy - HallyuHub

## REGRA DE OURO

```
LOCAL → STAGING → PRODUCAO
        (develop)   (main)
```

**NUNCA** faca push direto para `main`. Sempre passe por `develop` primeiro.

---

## Fluxo Obrigatorio

### 1. LOCAL (sua maquina)

```bash
# Desenvolva na branch develop ou feature/*
git checkout develop
git pull origin develop

# Faca suas alteracoes
# ...

# Teste localmente
npm run dev
npm run lint
npm run build
```

### 2. STAGING (branch develop)

```bash
# Commit e push para develop
git add .
git commit -m "feat: sua feature"
git push origin develop
```

**O que acontece:**
- GitHub Actions roda validacao (lint, typecheck, build)
- Se passar, faz deploy automatico para STAGING
- Acesse: http://seu-servidor:3001 (staging)

**VALIDE EM STAGING:**
- [ ] Funcionalidades funcionam?
- [ ] Nenhum erro no console?
- [ ] Layout correto?
- [ ] Performance OK?

### 3. PRODUCAO (branch main)

**SOMENTE apos validar em staging:**

```bash
# Opcao 1: Via GitHub (RECOMENDADO)
# Crie um Pull Request: develop → main
# Isso garante revisao e historico

# Opcao 2: Via merge local
git checkout main
git pull origin main
git merge develop
git push origin main
```

**O que acontece:**
- GitHub Actions roda validacao novamente
- Se passar, faz deploy para PRODUCAO
- Acesse: http://seu-servidor:3000 (producao)

---

## Diagrama Visual

```
                    ┌─────────────────────────────────────────┐
                    │           GITHUB ACTIONS                │
                    └─────────────────────────────────────────┘
                                      │
    ┌─────────┐    push     ┌─────────▼─────────┐
    │  LOCAL  │ ─────────►  │     VALIDATE      │
    │  (dev)  │             │  lint+type+build  │
    └─────────┘             └─────────┬─────────┘
         │                            │
         │                    ┌───────▼───────┐
         │                    │   PASSOU?     │
         │                    └───────┬───────┘
         │                      │           │
         │                     SIM         NAO
         │                      │           │
         │               ┌──────▼──────┐    │
         │               │ QUAL BRANCH?│    ▼
         │               └──────┬──────┘  FALHA
         │                 │         │
         │              develop    main
         │                 │         │
         │          ┌──────▼───┐ ┌───▼──────┐
         │          │ STAGING  │ │ PRODUCAO │
         │          │  :3001   │ │  :3000   │
         │          └──────────┘ └──────────┘
         │                 │
         │    VALIDAR      │
         │    EM STAGING   │
         │        ▼        │
         │   ┌─────────┐   │
         └──►│   OK?   │───┘
             └─────────┘
                 │
               merge
            develop → main
```

---

## Checklist Pre-Deploy

### Antes de push para develop:
- [ ] `npm run lint` passa sem erros
- [ ] `npm run build` compila sem erros
- [ ] Testei localmente com `npm run dev`
- [ ] Nao ha console.log de debug
- [ ] Nao ha secrets hardcoded

### Antes de merge para main:
- [ ] Codigo foi validado em staging
- [ ] Testei todas as funcionalidades afetadas
- [ ] Verifiquei logs do container staging
- [ ] Nenhum erro novo no browser console

---

## Comandos Uteis

```bash
# Ver em qual branch estou
git branch

# Mudar para develop
git checkout develop

# Atualizar develop
git pull origin develop

# Ver status das mudancas
git status

# Ver diferenca com main
git diff main

# Criar PR via CLI
gh pr create --base main --head develop --title "Deploy: descricao"
```

---

## Rollback de Emergencia

Se algo der errado em producao:

```bash
# 1. Ver commits recentes
git log --oneline -10

# 2. Reverter para commit anterior
git revert HEAD
git push origin main

# 3. Ou via servidor
ssh root@servidor
cd /var/www/hallyuhub
bash robust-deploy.sh --rollback --prod
```

---

## Por que esse processo?

| Sem processo | Com processo |
|--------------|--------------|
| Bug vai direto pra producao | Bug e pego em staging |
| Usuario ve erro | Usuario nao ve nada |
| Stress pra corrigir | Correcao tranquila |
| Downtime possivel | Zero downtime |

---

**Lembre-se: 5 minutos testando em staging economiza horas debugando em producao.**
