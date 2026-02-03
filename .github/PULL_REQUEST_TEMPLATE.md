## Descricao

<!-- Descreva brevemente o que este PR faz -->

## Tipo de Mudanca

- [ ] Bug fix
- [ ] Nova feature
- [ ] Melhoria de performance
- [ ] Refatoracao
- [ ] Documentacao
- [ ] Outro: ___________

---

## Checklist Pre-Producao

### Obrigatorio (marque todos antes de mergear):

- [ ] **Codigo foi deployado em STAGING** (branch develop)
- [ ] **Testei as funcionalidades em staging** (http://servidor:3001)
- [ ] **Verifiquei os logs do container** sem erros
- [ ] **Console do browser** sem erros novos
- [ ] Lint e TypeScript passando (`npm run lint && npx tsc --noEmit`)

### Se aplicavel:

- [ ] Migracoes de banco foram testadas
- [ ] Variaveis de ambiente atualizadas
- [ ] Documentacao atualizada

---

## Evidencia de Teste em Staging

<!-- Cole aqui screenshot ou descreva o teste feito -->

**Testado em:** staging (http://servidor:3001)
**Data/Hora:**

---

## Processo Seguido

```
LOCAL → STAGING → PRODUCAO
   ✓       ✓         ⏳
```

> Lembre-se: Este merge vai para PRODUCAO. Certifique-se de ter validado em STAGING primeiro.
