# ☑️ Checklist de Deploy - HallyuHub

Use este checklist para garantir deploys seguros e sem problemas.

---

## 📋 PRÉ-DEPLOY

### Git & Código
- [ ] Código testado localmente (`make dev`)
- [ ] Build funciona sem erros (`make build`)
- [ ] Todas as mudanças commitadas (`git status`)
- [ ] Branch correta (develop → staging, main → production)
- [ ] Sincronizado com remote (`git pull`)
- [ ] Nenhum arquivo sensível commitado (.env, *.key, etc)

### Validação Automática
- [ ] Executar: `make validate`
- [ ] Todos os checks passaram (0 erros)
- [ ] Avisos revisados (se houver)

### Versão
- [ ] Versão atualizada se necessário (`make bump-version`)
- [ ] Tag criada (se versão nova)
- [ ] package.json reflete versão correta

---

## 🚀 DEPLOY STAGING

### Preparação
- [ ] Branch develop atualizada (`git pull origin develop`)
- [ ] Merge da sua branch (`git merge sua-branch`)
- [ ] Conflitos resolvidos (se houver)
- [ ] Validação pré-deploy OK (`make validate`)

### Deploy
- [ ] Push para develop (`git push origin develop`)
- [ ] GitHub Actions iniciado (verificar em: https://github.com/uchidate/khub/actions)
- [ ] Workflow concluído com sucesso (aguardar ~2 minutos)

### Verificação
- [ ] Health check OK (`make health`)
- [ ] Staging online: http://31.97.255.107:3001
- [ ] Endpoint /api/health retorna 200
- [ ] Teste manual básico funcionando
- [ ] Logs sem erros críticos (se SSH configurado)

---

## 🌟 DEPLOY PRODUCTION

### ⚠️ ATENÇÃO: Ambiente de Produção!

### Preparação
- [ ] Staging testado e aprovado
- [ ] Branch main atualizada (`git pull origin main`)
- [ ] Merge de develop (`git merge develop`)
- [ ] Validação pré-deploy OK (`make validate`)
- [ ] **Confirmação dupla: pronto para produção?**

### Deploy
- [ ] Push para main (`git push origin main`)
- [ ] Tag pushed (se houver): `git push origin vX.Y.Z`
- [ ] GitHub Actions iniciado
- [ ] Workflow concluído com sucesso (aguardar ~2 minutos)

### Verificação Imediata
- [ ] Health check OK (`make health`)
- [ ] Production online: http://31.97.255.107:3000
- [ ] Endpoint /api/health retorna 200
- [ ] Teste manual completo funcionando
- [ ] Tempo de resposta aceitável (<3s)

### Monitoramento (15-30 min)
- [ ] Monitoramento ativo (`make monitor`) ou verificações periódicas
- [ ] Sem erros nos logs
- [ ] Usuários conseguem acessar normalmente
- [ ] Funcionalidades principais OK

---

## 🔥 EMERGÊNCIA (Se algo der errado)

### Identificação
- [ ] Health check falhou?
- [ ] Erros 500/503?
- [ ] Timeout?
- [ ] Funcionalidade crítica quebrada?

### Ação Imediata
- [ ] Executar: `make rollback`
- [ ] Escolher opção de rollback apropriada:
  - **Opção 1:** Imagem Docker anterior (mais rápido)
  - **Opção 2:** Tag/commit específico (mais controle)
  - **Opção 3:** Reiniciar container (se temporário)
- [ ] Aguardar rollback completar (~1 min)

### Verificação Pós-Rollback
- [ ] Health check OK
- [ ] Ambiente voltou ao normal
- [ ] Usuários conseguem acessar
- [ ] Comunicar equipe sobre o incidente

### Análise
- [ ] Revisar logs: `ssh $SSH_USER@31.97.255.107 "docker logs hallyuhub --tail 100"`
- [ ] Identificar causa raiz
- [ ] Documentar problema
- [ ] Corrigir localmente
- [ ] Testar novamente antes de re-deploy

---

## ✅ PÓS-DEPLOY

### Documentação
- [ ] Atualizar CHANGELOG (se houver)
- [ ] Documentar mudanças importantes
- [ ] Comunicar equipe sobre deploy

### Monitoramento
- [ ] Configurar alerta se disponível
- [ ] Verificar métricas (se houver)
- [ ] Acompanhar primeiras horas

### Limpeza
- [ ] Branches antigas deletadas (se aplicável)
- [ ] Git tags organizadas
- [ ] Logs limpos

---

## 📊 VERIFICAÇÃO RÁPIDA (Comandos)

```bash
# Antes de começar
make check

# Validar tudo
make validate

# Deploy staging
git checkout develop
git merge sua-branch
git push origin develop

# Verificar staging
make health
# Teste manual: http://31.97.255.107:3001

# Deploy production
git checkout main
git merge develop
git push origin main

# Verificar production
make health
make monitor

# Se problema
make rollback
```

---

## 🎯 CHECKLIST SUPER RÁPIDO

**Staging:**
```
☐ make validate
☐ git push origin develop
☐ make health
☐ Teste manual
```

**Production:**
```
☐ Staging OK?
☐ make validate
☐ git push origin main
☐ make health
☐ make monitor
```

**Emergência:**
```
☐ make rollback
☐ Escolher opção
☐ make health
```

---

## 📝 NOTAS

### Tempos Esperados
- Validação pré-deploy: ~30s
- GitHub Actions (build + deploy): ~2min
- Health check: ~10s
- Rollback: ~1min

### URLs
- Staging: http://31.97.255.107:3001
- Production: http://31.97.255.107:3000
- GitHub Actions: https://github.com/uchidate/khub/actions

### Branches
- develop → Staging
- main → Production

### Comandos Essenciais
- `make check` - Verificação rápida
- `make validate` - Validação completa
- `make health` - Health check
- `make monitor` - Monitoramento
- `make rollback` - Rollback

---

## 🔖 TEMPLATE DE COMMIT

### Feature
```
feat: adiciona [descrição da feature]

- Detalhes da implementação
- Testes realizados

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Bug Fix
```
fix: corrige [descrição do bug]

- Problema identificado
- Solução implementada

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Hotfix
```
hotfix: [descrição urgente]

URGENTE: [motivo da urgência]
- Solução aplicada
- Impacto minimizado

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 📞 CONTATOS DE EMERGÊNCIA

_[Adicione aqui contatos da equipe para situações críticas]_

- **DevOps:** _______
- **Backend:** _______
- **Frontend:** _______
- **Lead:** _______

---

## 📚 REFERÊNCIAS

- [Início Rápido](INICIO-RAPIDO.md)
- [Verificação de Versões](VERIFICACAO-VERSOES.md)
- [Scripts README](scripts/README.md)
- [Resumo Executivo](RESUMO-EXECUTIVO.md)

---

**Última atualização:** 02/02/2026
**Versão:** 1.0.0

---

💡 **Dica:** Imprima este checklist e mantenha à mão durante deploys!
