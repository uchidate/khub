# Makefile - HallyuHub
# Comandos úteis para gerenciamento do projeto

.PHONY: help check validate deploy-staging deploy-prod monitor rollback health version bump-version ssh-setup

# Cores
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m

help: ## Mostra esta mensagem de ajuda
	@echo ""
	@echo "$(BLUE)╔════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║              HALLYUHUB - COMANDOS MAKE                    ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Exemplos de uso:$(NC)"
	@echo "  make check          - Verificação rápida de tudo"
	@echo "  make validate       - Validação completa pré-deploy"
	@echo "  make health         - Health check de todos os ambientes"
	@echo "  make monitor        - Monitoramento contínuo"
	@echo ""

check: ## Verificação rápida de todos os sistemas
	@./scripts/quick-check.sh

check-all: ## Verificação completa de versões
	@./scripts/version-check/check-all-versions.sh

check-local: ## Verificação apenas local
	@./scripts/version-check/check-local-version.sh

check-staging: ## Verificação apenas staging
	@./scripts/version-check/check-staging-version.sh

check-prod: ## Verificação apenas production
	@./scripts/version-check/check-production-version.sh

check-server: ## Verificação no servidor via SSH
	@./scripts/version-check/check-server-versions.sh

validate: ## Validação completa pré-deploy
	@./scripts/pre-deploy-validation.sh

health: ## Health check detalhado
	@./scripts/health-check.sh

monitor: ## Monitoramento contínuo (Ctrl+C para parar)
	@./scripts/monitor.sh

rollback: ## Rollback em caso de problemas
	@./scripts/rollback.sh

bump-version: ## Atualiza versão do projeto
	@./scripts/bump-version.sh

# Comandos de desenvolvimento
dev: ## Inicia servidor de desenvolvimento
	@cd v1 && npm run dev

build: ## Build do projeto
	@cd v1 && npm run build

install: ## Instala dependências
	@cd v1 && npm install

test: ## Executa testes
	@cd v1 && npm test

lint: ## Executa linter
	@cd v1 && npm run lint

# Comandos git
git-sync: ## Sincroniza branches com remote
	@git fetch origin
	@git pull origin $$(git branch --show-current)
	@echo "$(GREEN)✓ Sincronizado com remote$(NC)"

git-status: ## Status git formatado
	@echo "$(BLUE)Branch:$(NC) $$(git branch --show-current)"
	@echo "$(BLUE)Commit:$(NC) $$(git log -1 --oneline)"
	@git status --short

# Comandos de deploy (via GitHub Actions)
deploy-staging: ## Faz deploy para staging (push develop)
	@echo "$(YELLOW)Fazendo deploy para STAGING...$(NC)"
	@./scripts/pre-deploy-validation.sh
	@git checkout develop
	@git push origin develop
	@echo "$(GREEN)✓ Deploy iniciado via GitHub Actions$(NC)"
	@echo "Acompanhe em: https://github.com/uchidate/khub/actions"

deploy-prod: ## Faz deploy para production (push main)
	@echo "$(YELLOW)Fazendo deploy para PRODUCTION...$(NC)"
	@./scripts/pre-deploy-validation.sh
	@git checkout main
	@git push origin main
	@echo "$(GREEN)✓ Deploy iniciado via GitHub Actions$(NC)"
	@echo "Acompanhe em: https://github.com/uchidate/khub/actions"

# Comandos Docker local
docker-build: ## Build da imagem Docker localmente
	@cd v1 && docker build -t hallyuhub:local .

docker-run: ## Roda container Docker localmente
	@cd v1 && docker-compose up -d

docker-stop: ## Para containers Docker
	@cd v1 && docker-compose down

docker-logs: ## Mostra logs do container
	@cd v1 && docker-compose logs -f hallyuhub

# Comandos Prisma
db-migrate: ## Executa migrations do Prisma
	@cd v1 && npx prisma migrate dev

db-seed: ## Popula banco com dados iniciais
	@cd v1 && npm run prisma:seed

db-studio: ## Abre Prisma Studio
	@cd v1 && npx prisma studio

# Comandos de setup
setup: ## Setup completo do projeto
	@echo "$(BLUE)Instalando dependências...$(NC)"
	@cd v1 && npm install
	@echo "$(BLUE)Configurando .env...$(NC)"
	@[ -f v1/.env ] || cp v1/.env.example v1/.env
	@echo "$(BLUE)Gerando Prisma Client...$(NC)"
	@cd v1 && npx prisma generate
	@echo "$(GREEN)✓ Setup concluído!$(NC)"
	@echo ""
	@echo "Próximos passos:"
	@echo "  1. Configure as variáveis em v1/.env"
	@echo "  2. Execute: make db-migrate"
	@echo "  3. Execute: make dev"

ssh-setup: ## Instruções para configurar SSH
	@echo "$(BLUE)Configuração de SSH:$(NC)"
	@echo ""
	@echo "1. Gere uma chave SSH (se não tiver):"
	@echo "   ssh-keygen -t ed25519 -C 'seu-email@example.com'"
	@echo ""
	@echo "2. Copie a chave para o servidor:"
	@echo "   ssh-copy-id seu-usuario@31.97.255.107"
	@echo ""
	@echo "3. Configure a variável SSH_USER:"
	@echo "   export SSH_USER=seu-usuario"
	@echo "   echo 'export SSH_USER=seu-usuario' >> ~/.bashrc"
	@echo ""
	@echo "4. Teste a conexão:"
	@echo "   ssh \$$SSH_USER@31.97.255.107"
	@echo ""

clean: ## Remove arquivos temporários
	@echo "$(YELLOW)Removendo arquivos temporários...$(NC)"
	@cd v1 && rm -rf .next
	@cd v1 && rm -rf node_modules/.cache
	@rm -f monitor.log
	@rm -f /tmp/build.log
	@echo "$(GREEN)✓ Limpeza concluída$(NC)"

# Workflow completo
workflow: validate git-sync deploy-staging health ## Workflow completo: valida -> sincroniza -> deploy -> verifica

# Default target
.DEFAULT_GOAL := help
