# Melhoria #3 - Consolidação da Estrutura do Projeto

## 📊 Situação Atual

### Problema Identificado

O projeto tem **duplicação desnecessária** entre root e v1/:

```
khub/
├── app/              ← 44KB (DUPLICADO - desatualizado)
├── components/       ← DUPLICADO
├── lib/              ← DUPLICADO
├── prisma/           ← DUPLICADO
├── package.json      ← DESATUALIZADO (usa ts-node)
├── next.config.mjs   ← DUPLICADO
├── tsconfig.json     ← DUPLICADO
├── docs/             ← Documentação antiga
├── scripts/          ← Scripts antigos/duplicados
└── v1/               ← 905MB (VERSÃO ATIVA)
    ├── app/          ← 96KB (REAL)
    ├── components/   ← REAL
    ├── lib/          ← REAL
    ├── prisma/       ← REAL
    ├── package.json  ← ATUALIZADO (usa tsx)
    ├── .github/      ← Workflows ativos
    └── node_modules/ ← Dependências
```

**Total:** 909MB (v1/ = 905MB, duplicação = 4MB + confusão)

### Evidências

1. **Docker usa apenas v1/**:
   ```dockerfile
   WORKDIR /app
   COPY . .  # Copia de v1/, não da raiz
   ```

2. **package.json diferente**:
   - Root: usa `ts-node` (antigo)
   - v1/: usa `tsx` (atual)

3. **Workflows em v1/.github/**:
   - deploy-image.yml está em v1/
   - Root .github/ não é usado

---

## 🎯 Objetivo da Melhoria

**Consolidar estrutura para:**
- ✅ Eliminar confusão sobre qual é a versão ativa
- ✅ Reduzir duplicação de código
- ✅ Simplificar navegação no projeto
- ✅ Manter documentação organizada no root

---

## 📋 Plano de Consolidação

### Estrutura Proposta

```
khub/                          ← Root: Documentação + ferramentas
├── .github/                   ← Workflows (movidos de v1/)
│   └── workflows/
│       └── deploy-image.yml
├── docs/                      ← Documentação do projeto
│   ├── PROCESSO-DEPLOY.md
│   ├── CHECKLIST-DEPLOY.md
│   ├── MELHORIAS-RECOMENDADAS.md
│   └── ...
├── app/                       ← Código da aplicação (movido de v1/)
├── components/                ← Componentes React
├── lib/                       ← Bibliotecas/utilitários
├── prisma/                    ← Schema e migrações
├── scripts/                   ← Scripts utilitários
├── public/                    ← Assets estáticos
├── .next/                     ← Build output
├── node_modules/              ← Dependências
├── package.json               ← Configuração npm
├── next.config.mjs            ← Config Next.js
├── tsconfig.json              ← Config TypeScript
├── Dockerfile                 ← Docker config
├── docker-compose.*.yml       ← Compose configs
├── robust-deploy.sh           ← Script de deploy
├── Makefile                   ← Comandos úteis
└── README.md                  ← Documentação principal
```

**Removido:**
- ❌ v1/ (conteúdo movido para root)
- ❌ v2/ (apenas placeholder)
- ❌ Duplicatas em root

---

## 🔄 Processo de Migração

### Fase 1: Preparação (Local)

1. **Criar branch de migração**
   ```bash
   git checkout -b feature/consolidate-structure
   ```

2. **Backup de segurança**
   ```bash
   git tag backup-before-consolidation
   ```

3. **Mover arquivos de v1/ para root**
   ```bash
   # Mover conteúdo de v1/ para root (preservando histórico)
   git mv v1/app ./
   git mv v1/components ./
   git mv v1/lib ./
   git mv v1/prisma ./
   git mv v1/scripts ./
   git mv v1/public ./
   git mv v1/.next ./
   git mv v1/node_modules ./
   git mv v1/package.json ./
   git mv v1/package-lock.json ./
   git mv v1/next.config.mjs ./
   git mv v1/tsconfig.json ./
   git mv v1/Dockerfile ./
   git mv v1/docker-compose*.yml ./
   git mv v1/robust-deploy.sh ./
   git mv v1/.github ./
   ```

4. **Reorganizar documentação**
   ```bash
   mkdir -p docs
   git mv PROCESSO-DEPLOY.md docs/
   git mv CHECKLIST-DEPLOY.md docs/
   git mv MELHORIAS-RECOMENDADAS.md docs/
   git mv INSTRUCOES-MELHORIA-*.md docs/
   git mv COMECE-AQUI.md docs/
   git mv VERIFICACAO-VERSOES.md docs/
   ```

5. **Remover diretórios vazios/obsoletos**
   ```bash
   git rm -rf v1/
   git rm -rf v2/
   ```

6. **Atualizar referências de paths**
   - `.github/workflows/deploy-image.yml`:
     ```yaml
     # ANTES
     context: ./v1
     file: ./v1/Dockerfile
     source: "v1/docker-compose*.yml,v1/robust-deploy.sh"

     # DEPOIS
     context: .
     file: ./Dockerfile
     source: "docker-compose*.yml,robust-deploy.sh"
     ```

   - `Makefile` (se houver referências a v1/)
   - `README.md` (atualizar paths de documentação)

7. **Criar README.md principal**
   ```markdown
   # HallyuHub

   Portal da cultura coreana.

   ## 📚 Documentação

   - [Processo de Deploy](docs/PROCESSO-DEPLOY.md)
   - [Checklist de Deploy](docs/CHECKLIST-DEPLOY.md)
   - [Melhorias Recomendadas](docs/MELHORIAS-RECOMENDADAS.md)

   ## 🚀 Quick Start

   Ver [docs/COMECE-AQUI.md](docs/COMECE-AQUI.md)
   ```

8. **Testar build local**
   ```bash
   npm install
   npm run build
   docker build -t hallyuhub:test .
   ```

### Fase 2: Validação em Staging

1. **Commit e push para develop**
   ```bash
   git add .
   git commit -m "refactor: consolidate project structure (v1/ -> root)"
   git push origin feature/consolidate-structure
   ```

2. **Merge para develop**
   ```bash
   git checkout develop
   git merge feature/consolidate-structure
   git push origin develop
   ```

3. **Validar deploy automático**
   - Aguardar GitHub Actions completar
   - Verificar staging: http://31.97.255.107:3001/api/health
   - Testar funcionalidades

### Fase 3: Deploy em Produção

1. **Se staging OK, merge para main**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. **Validar produção**
   - Aguardar deploy
   - Verificar: http://31.97.255.107:3000/api/health
   - Testar aplicação

---

## ✅ Critérios de Sucesso

- [ ] Não há mais diretório v1/
- [ ] Código da aplicação está em root
- [ ] Documentação organizada em docs/
- [ ] Workflows funcionando (.github/)
- [ ] Build local passa
- [ ] Deploy staging funciona
- [ ] Deploy produção funciona
- [ ] Healthchecks OK em ambos ambientes
- [ ] Tamanho do repositório reduzido

---

## 🐛 Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Workflows quebram | Média | Alto | Testar em branch separada primeiro |
| Build falha | Baixa | Alto | Validar build local antes de push |
| Deploy quebra | Baixa | Crítico | Tag de backup criada, rollback fácil |
| Perda de histórico | Muito baixa | Médio | Usar git mv para preservar histórico |

---

## 🔙 Rollback

Se algo der errado:

```bash
# Opção 1: Reverter para tag de backup
git checkout backup-before-consolidation

# Opção 2: Reverter commit de migração
git revert <commit-hash-da-migracao>
git push origin develop/main
```

---

## 📊 Benefícios Esperados

### Antes
```
khub/ (909MB)
├── app/, components/, lib/, prisma/ (duplicados)
├── v1/ (905MB)
│   ├── app/, components/, lib/, prisma/ (reais)
│   └── .github/ (workflows)
└── Documentação espalhada
```

### Depois
```
khub/ (~905MB, -4MB de duplicação)
├── app/, components/, lib/, prisma/ (únicos)
├── .github/ (workflows)
├── docs/ (documentação centralizada)
└── Estrutura clara e limpa
```

**Ganhos:**
- 🎯 Zero confusão sobre qual versão é ativa
- 📁 Estrutura padrão de projeto Next.js
- 📚 Documentação organizada em docs/
- 🔧 Manutenção mais fácil
- 👥 Onboarding mais simples

---

## ⏱️ Tempo Estimado

- Preparação e migração local: 30-45 min
- Testes locais: 15 min
- Deploy e validação staging: 10 min
- Deploy produção: 10 min

**Total: ~1h - 1h20min**

---

## 📝 Próximos Passos

1. ✅ Ler e aprovar este plano
2. ⏳ Executar migração em branch separada
3. ⏳ Validar em staging
4. ⏳ Deploy em produção
5. ⏳ Documentar conclusão

---

**Status:** 📋 Aguardando aprovação

**Criado em:** 2026-02-03
