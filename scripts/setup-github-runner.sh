#!/bin/bash
# ============================================================
# Setup GitHub Actions Self-Hosted Runner - HallyuHub
# ============================================================
# Configura runner do GitHub Actions no servidor
# USAR APENAS NO SERVIDOR (não local)
# ============================================================

set -e

echo "=========================================="
echo "  SETUP GITHUB ACTIONS RUNNER"
echo "=========================================="

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Este script precisa rodar como root (use sudo)"
    exit 1
fi

# Criar usuário dedicado para o runner
if ! id -u github-runner &>/dev/null; then
    echo "📝 Criando usuário github-runner..."
    useradd -m -s /bin/bash github-runner
    usermod -aG docker github-runner
    echo "✅ Usuário criado"
else
    echo "✅ Usuário github-runner já existe"
fi

# Diretório do runner
RUNNER_DIR="/home/github-runner/actions-runner"
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

# Download do runner (versão mais recente para Linux x64)
RUNNER_VERSION="2.321.0"
RUNNER_FILE="actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"

if [ ! -f "bin/Runner.Listener" ]; then
    echo "📥 Baixando GitHub Actions Runner ${RUNNER_VERSION}..."
    curl -o "$RUNNER_FILE" -L "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_FILE}"

    echo "📦 Extraindo..."
    tar xzf "$RUNNER_FILE"
    rm "$RUNNER_FILE"

    echo "✅ Runner baixado e extraído"
else
    echo "✅ Runner já está instalado"
fi

# Ajustar permissões
chown -R github-runner:github-runner "$RUNNER_DIR"

echo ""
echo "=========================================="
echo "  PRÓXIMOS PASSOS (MANUAL)"
echo "=========================================="
echo ""
echo "1. Vá para: https://github.com/uchidate/khub/settings/actions/runners/new"
echo ""
echo "2. Selecione: Linux x64"
echo ""
echo "3. Copie o TOKEN que aparece no comando de configuração"
echo ""
echo "4. Execute os seguintes comandos NO SERVIDOR:"
echo ""
echo "   sudo su - github-runner"
echo "   cd ~/actions-runner"
echo "   ./config.sh --url https://github.com/uchidate/khub --token SEU_TOKEN_AQUI --name hallyuhub-runner --work _work --labels staging,production"
echo "   exit"
echo ""
echo "5. Depois, como root, instale o serviço:"
echo ""
echo "   cd /home/github-runner/actions-runner"
echo "   ./svc.sh install github-runner"
echo "   ./svc.sh start"
echo "   ./svc.sh status"
echo ""
echo "=========================================="
echo ""
echo "📖 Documentação completa:"
echo "   https://docs.github.com/en/actions/hosting-your-own-runners/adding-self-hosted-runners"
echo ""
