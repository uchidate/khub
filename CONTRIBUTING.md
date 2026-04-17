# 🤝 Guia de Contribuição - HallyuHub

## 🌳 Fluxo de Branches Protegido

Este projeto usa um fluxo de branches protegido para garantir qualidade e segurança:

```
feature → staging (protegida) → PR → main (protegida) → produção
             ↓                           ↓
       homologação:3001            produção:3000
```

### 📋 Branches Principais

#### `main` - Produção 🟢
- **Ambiente:** https://www.hallyuhub.com.br (porta 3000)
- **Proteções:**
  - ✅ Requer Pull Request
  - ✅ Requer 1 aprovação
  - ✅ Requer status check "Validate Code"
  - ✅ Requer resolução de conversas
  - ❌ Não permite push direto
  - ❌ Não permite force push
  - ❌ Não permite deletar

#### `staging` - Homologação 🟡
- **Ambiente:** http://31.97.255.107:3001
- **Proteções:**
  - ✅ Regras aplicadas a todos (incluindo admins)
  - ❌ Não permite force push
  - ❌ Não permite deletar

### 🔄 Processo de Deploy

#### 1️⃣ Desenvolvimento Local
```bash
# Criar feature branch
git checkout -b feature/minha-feature staging

# Desenvolver e testar
npm run dev

# Commit
git add .
git commit -m "feat: minha nova feature"
```

#### 2️⃣ Deploy para Staging
```bash
# Push para staging
git checkout staging
git merge feature/minha-feature
git push origin staging

# GitHub Actions automaticamente:
# - Valida código (TypeScript, ESLint, Build)
# - Builda imagem Docker
# - Faz deploy em staging (porta 3001)
# - Executa health checks
# - Notifica Slack
```

#### 3️⃣ Validação em Staging
- Acesse: http://31.97.255.107:3001
- Teste todas as funcionalidades
- Verifique logs se necessário:
  ```bash
  ssh root@31.97.255.107 "docker-compose -f docker-compose.staging.yml logs -f --tail=50 hallyuhub-staging"
  ```

#### 4️⃣ Pull Request para Main
```bash
# Criar PR via CLI
gh pr create --base main --head staging --title "Release: descrição"

# Ou via GitHub UI
# https://github.com/uchidate/khub/compare/main...staging
```

#### 5️⃣ Revisão e Merge
- **Validações automáticas:**
  - ✅ TypeScript type check
  - ✅ ESLint
  - ✅ Build Next.js

- **Requisitos para merge:**
  - ✅ Todas as validações passando
  - ✅ Pelo menos 1 aprovação
  - ✅ Todas as conversas resolvidas

#### 6️⃣ Deploy para Produção
```bash
# Após merge do PR
# GitHub Actions automaticamente:
# - Builda imagem Docker
# - Faz deploy em produção (porta 3000)
# - Executa migrations se necessário
# - Health checks
# - Verifica SSL
# - Notifica Slack
```

### ⚠️ Regras Importantes

#### ❌ NUNCA fazer:
1. Push direto para `main` (bloqueado)
2. Push direto para `staging` sem PR de feature
3. Force push em `main` ou `staging` (bloqueado)
4. Modificar arquivos via SSH no servidor
5. Manipular containers via SSH (pull, restart, down, up)
6. Commitar secrets reais (usar placeholders)
7. Usar `--no-verify` sem motivo válido

#### ✅ SEMPRE fazer:
1. Criar feature branches a partir de `staging`
2. Testar localmente antes de push
3. Validar em staging antes de PR para main
4. Aguardar aprovação de PR
5. Usar GitHub Actions para deploy
6. Seguir convenção de commits (feat, fix, refactor, etc.)
7. Resolver conflitos antes do merge

### 🔐 Convenção de Commits

```bash
# Formato
<tipo>(<escopo>): <descrição>

# Tipos
feat:      Nova funcionalidade
fix:       Correção de bug
refactor:  Refatoração de código
docs:      Documentação
style:     Formatação (não afeta código)
test:      Testes
chore:     Tarefas de manutenção
perf:      Melhorias de performance

# Exemplos
feat(admin): add user management panel
fix(auth): resolve login redirect loop
refactor(api): simplify error handling
docs(readme): update installation guide
```

### 🚨 Troubleshooting

#### Deploy falhou em staging
```bash
# Ver logs do workflow
gh run view --web

# Ver logs do container
ssh root@31.97.255.107 "docker-compose -f docker-compose.staging.yml logs --tail=100 hallyuhub-staging"
```

#### PR bloqueado
- Verificar se todos os checks passaram
- Verificar se há conflitos
- Pedir aprovação de outro dev
- Resolver todas as conversas

#### Rollback necessário
```bash
# Via GitHub UI: Revert do commit problemático
# Ou criar hotfix a partir do commit anterior
git checkout main
git checkout -b hotfix/critical-fix <commit-hash-bom>
# Fix e seguir fluxo normal
```

### 📚 Documentação Relacionada

- [WORKFLOW.md](WORKFLOW.md) - Workflow detalhado
- [DEPLOY_RAPIDO.md](docs/DEPLOY_RAPIDO.md) - Guia rápido de deploy
- [.github/workflows/deploy.yml](.github/workflows/deploy.yml) - Pipeline CI/CD

### 💡 Dicas

1. **Use draft PRs** para trabalho em progresso
2. **Teste localmente** com Docker Compose
3. **Valide em staging** antes de PR
4. **Comunique** mudanças breaking no PR
5. **Documente** decisões importantes no código

---

**🤖 Lembre-se:** GitHub Actions faz todo o deploy. Confie no processo! ✨
