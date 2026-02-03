#!/bin/bash
# ============================================================
# Setup Nginx + HTTPS - HallyuHub
# ============================================================
# Configura Nginx como reverse proxy com SSL (Let's Encrypt)
# USAR APENAS EM STAGING/PRODUCTION
# ============================================================

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  SETUP NGINX + HTTPS - HallyuHub${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}❌ Este script deve ser executado como root (use sudo)${NC}"
    exit 1
fi

# Pedir informações do usuário
echo -e "${YELLOW}📝 Informações necessárias:${NC}"
echo ""

read -p "Domínio principal (ex: hallyuhub.com): " DOMAIN
read -p "Subdomínio www? (y/N): " SETUP_WWW
read -p "Porta da aplicação (padrão: 3000): " APP_PORT
APP_PORT=${APP_PORT:-3000}

# Confirmar informações
echo ""
echo -e "${YELLOW}Configuração:${NC}"
echo "  Domínio: $DOMAIN"
if [[ $SETUP_WWW =~ ^[Yy]$ ]]; then
    echo "  WWW: www.$DOMAIN (redireciona para $DOMAIN)"
    DOMAINS="-d $DOMAIN -d www.$DOMAIN"
else
    DOMAINS="-d $DOMAIN"
fi
echo "  Porta: $APP_PORT"
echo ""

read -p "Confirmar e continuar? (y/N): " CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo "Cancelado."
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Iniciando instalação...${NC}"
echo ""

# ============================================================
# 1. Instalar Nginx
# ============================================================
echo -e "${GREEN}[1/6]${NC} Instalando Nginx..."

apt update
apt install -y nginx

# Verificar instalação
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Erro: Nginx não foi instalado corretamente${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Nginx instalado${NC}"
echo ""

# ============================================================
# 2. Configurar Nginx
# ============================================================
echo -e "${GREEN}[2/6]${NC} Configurando Nginx..."

# Criar configuração
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
# Configuração HallyuHub - $DOMAIN
# Gerado automaticamente em $(date)

# Redirecionar www para domínio principal (se configurado)
$(if [[ $SETUP_WWW =~ ^[Yy]$ ]]; then
cat <<WWW
server {
    listen 80;
    listen [::]:80;
    server_name www.$DOMAIN;
    return 301 https://$DOMAIN\\\$request_uri;
}
WWW
fi)

# Configuração HTTP (será atualizada pelo Certbot para HTTPS)
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    # Logs
    access_log /var/log/nginx/${DOMAIN}-access.log;
    error_log /var/log/nginx/${DOMAIN}-error.log;

    # Reverse proxy para a aplicação
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;

        # Headers
        proxy_set_header Upgrade \\\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\\$host;
        proxy_set_header X-Real-IP \\\$remote_addr;
        proxy_set_header X-Forwarded-For \\\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\\$scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Cache bypass
        proxy_cache_bypass \\\$http_upgrade;
    }

    # Tamanho máximo de upload
    client_max_body_size 10M;
}
EOF

# Ativar site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Remover configuração padrão se existir
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
if ! nginx -t; then
    echo -e "${RED}❌ Erro na configuração do Nginx${NC}"
    exit 1
fi

# Recarregar Nginx
systemctl reload nginx

echo -e "${GREEN}✅ Nginx configurado${NC}"
echo ""

# ============================================================
# 3. Instalar Certbot
# ============================================================
echo -e "${GREEN}[3/6]${NC} Instalando Certbot..."

apt install -y certbot python3-certbot-nginx

echo -e "${GREEN}✅ Certbot instalado${NC}"
echo ""

# ============================================================
# 4. Configurar Firewall
# ============================================================
echo -e "${GREEN}[4/6]${NC} Configurando firewall..."

# Verificar se UFW está instalado
if command -v ufw &> /dev/null; then
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo -e "${GREEN}✅ Firewall configurado (portas 80 e 443 liberadas)${NC}"
else
    echo -e "${YELLOW}⚠️  UFW não instalado, libere as portas 80 e 443 manualmente${NC}"
fi

echo ""

# ============================================================
# 5. Obter Certificado SSL
# ============================================================
echo -e "${GREEN}[5/6]${NC} Obtendo certificado SSL (Let's Encrypt)..."
echo ""
echo -e "${YELLOW}📧 Certbot solicitará seu e-mail e concordância com ToS${NC}"
echo ""

# Obter certificado
certbot --nginx $DOMAINS --non-interactive --agree-tos --register-unsafely-without-email || {
    echo ""
    echo -e "${YELLOW}⚠️  Falhou sem e-mail, tentando com modo interativo...${NC}"
    certbot --nginx $DOMAINS
}

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Certificado SSL obtido e configurado${NC}"
else
    echo -e "${RED}❌ Erro ao obter certificado SSL${NC}"
    echo -e "${YELLOW}Verifique:${NC}"
    echo "  1. DNS está apontando para este servidor: dig $DOMAIN"
    echo "  2. Porta 80 está acessível externamente"
    echo "  3. Logs: sudo journalctl -u certbot"
    exit 1
fi

echo ""

# ============================================================
# 6. Testar Renovação Automática
# ============================================================
echo -e "${GREEN}[6/6]${NC} Testando renovação automática..."

certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Renovação automática configurada${NC}"
else
    echo -e "${YELLOW}⚠️  Erro no teste de renovação${NC}"
fi

echo ""

# ============================================================
# Finalização
# ============================================================
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  ✅ CONFIGURAÇÃO CONCLUÍDA${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}🎉 Seu site está configurado com HTTPS!${NC}"
echo ""
echo -e "${YELLOW}📋 Informações:${NC}"
echo "  URL: https://$DOMAIN"
if [[ $SETUP_WWW =~ ^[Yy]$ ]]; then
    echo "  WWW: https://www.$DOMAIN (redireciona)"
fi
echo "  Certificado: Let's Encrypt"
echo "  Renovação: Automática (30 dias antes do vencimento)"
echo ""
echo -e "${YELLOW}📁 Arquivos importantes:${NC}"
echo "  Configuração Nginx: /etc/nginx/sites-available/$DOMAIN"
echo "  Logs acesso: /var/log/nginx/${DOMAIN}-access.log"
echo "  Logs erro: /var/log/nginx/${DOMAIN}-error.log"
echo "  Certificados: /etc/letsencrypt/live/$DOMAIN/"
echo ""
echo -e "${YELLOW}🔧 Comandos úteis:${NC}"
echo "  Recarregar Nginx: sudo systemctl reload nginx"
echo "  Ver logs Nginx: sudo tail -f /var/log/nginx/${DOMAIN}-error.log"
echo "  Renovar SSL manual: sudo certbot renew"
echo "  Testar SSL: https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
echo -e "${YELLOW}⚡ Próximos passos:${NC}"
echo "  1. Atualizar .env.production com NEXT_PUBLIC_SITE_URL=https://$DOMAIN"
echo "  2. Redeployar a aplicação"
echo "  3. Testar: https://$DOMAIN"
echo ""
echo -e "${GREEN}========================================${NC}"
