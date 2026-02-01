#!/bin/bash
# Script de Deploy Automático - HallyuHub
# Execute no servidor: bash deploy.sh

set -e  # Para em caso de erro

echo "🚀 Iniciando deploy do HallyuHub..."

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 1. Criar diretório e extrair código
echo -e "${BLUE}📦 Extraindo código...${NC}"
mkdir -p /var/www/hallyuhub
cd /var/www/hallyuhub
tar -xzf /tmp/hallyuhub-deploy.tar.gz
rm /tmp/hallyuhub-deploy.tar.gz

# 2. Criar arquivo .env.production
echo -e "${BLUE}⚙️  Configurando variáveis de ambiente...${NC}"
cat > .env.production << 'EOF'
DATABASE_URL="file:/app/data/prod.db"
NEXT_PUBLIC_SITE_URL="http://31.97.255.107:3000"
GEMINI_API_KEY=AIzaSyBrIIHZVv36uAaXSoYL2xl0bJRJG1KMP-E
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
NODE_ENV=production
EOF

# 3. Criar docker-compose.yml
echo -e "${BLUE}🐳 Criando configuração Docker...${NC}"
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  hallyuhub:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: hallyuhub
    restart: unless-stopped
    ports:
      - "3000:3000"
    env_file:
      - .env.production
    volumes:
      - ./prisma:/app/prisma
      - hallyuhub-data:/app/data
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  hallyuhub-data:
EOF

# 4. Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${BLUE}📥 Docker não encontrado. Instalando...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl start docker
    systemctl enable docker
fi

# 5. Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${BLUE}📥 Docker Compose não encontrado. Instalando...${NC}"
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 6. Build da imagem Docker
echo -e "${BLUE}🔨 Fazendo build da aplicação (isso pode levar alguns minutos)...${NC}"
docker-compose build

# 7. Inicializar banco de dados
echo -e "${BLUE}💾 Inicializando banco de dados...${NC}"
docker-compose run --rm hallyuhub sh -c "npx prisma migrate deploy"

# 8. Popular banco com dados iniciais (seed)
echo -e "${BLUE}🌱 Populando banco de dados...${NC}"
docker-compose run --rm hallyuhub sh -c "npx prisma db seed" || echo "Seed já executado ou não disponível"

# 9. Iniciar container
echo -e "${BLUE}🚀 Iniciando aplicação...${NC}"
docker-compose up -d

# 10. Aguardar container ficar saudável
echo -e "${BLUE}⏳ Aguardando aplicação iniciar...${NC}"
sleep 10

# 11. Verificar status
echo -e "${BLUE}📊 Verificando status...${NC}"
docker-compose ps

# 12. Testar se está respondendo
echo -e "${BLUE}🧪 Testando aplicação...${NC}"
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Aplicação está rodando!${NC}"
else
    echo -e "${BLUE}⚠️  Aplicação ainda está inicializando...${NC}"
fi

# 13. Configurar firewall (se UFW estiver ativo)
if command -v ufw &> /dev/null && ufw status | grep -q "Status: active"; then
    echo -e "${BLUE}🔥 Configurando firewall...${NC}"
    ufw allow 3000/tcp
    ufw reload
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✨ Deploy concluído com sucesso!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "🌐 Acesse seu site em: ${BLUE}http://31.97.255.107:3000${NC}"
echo ""
echo -e "📋 Comandos úteis:"
echo -e "  Ver logs:      ${BLUE}docker-compose logs -f hallyuhub${NC}"
echo -e "  Reiniciar:     ${BLUE}docker-compose restart hallyuhub${NC}"
echo -e "  Parar:         ${BLUE}docker-compose stop hallyuhub${NC}"
echo -e "  Status:        ${BLUE}docker-compose ps${NC}"
echo ""
echo -e "🤖 Gerar dados com IA:"
echo -e "  ${BLUE}docker-compose exec hallyuhub npm run atualize:ai -- --news=5 --artists=3${NC}"
echo ""
