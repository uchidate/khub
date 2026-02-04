# Configuração HTTPS e Domínio - HallyuHub

Guia para configurar HTTPS e expor a aplicação em produção através de um domínio.

## Visão Geral

Para expor a aplicação rodando na porta 3000 com HTTPS:

1. **DNS** - Apontar domínio para o servidor
2. **Reverse Proxy** - Nginx ou Caddy para gerenciar HTTPS
3. **SSL Certificate** - Let's Encrypt (gratuito)
4. **Firewall** - Liberar portas 80 e 443

## Opção 1: Caddy (Recomendado - Mais Simples)

Caddy configura HTTPS automaticamente com Let's Encrypt.

### 1. Instalar Caddy

```bash
# Debian/Ubuntu
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### 2. Configurar Caddy

Criar arquivo `/etc/caddy/Caddyfile`:

```caddyfile
# Substituir por seu domínio
hallyuhub.com {
    # Reverse proxy para a aplicação
    reverse_proxy localhost:3000

    # Headers de segurança
    header {
        # HTTPS strict
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"

        # XSS protection
        X-XSS-Protection "1; mode=block"

        # Prevent clickjacking
        X-Frame-Options "SAMEORIGIN"

        # Content type sniffing
        X-Content-Type-Options "nosniff"

        # Referrer policy
        Referrer-Policy "strict-origin-when-cross-origin"
    }

    # Logs
    log {
        output file /var/log/caddy/hallyuhub.log
        format json
    }

    # Encode responses
    encode gzip zstd
}

# Redirecionar www para domínio principal (opcional)
www.hallyuhub.com {
    redir https://hallyuhub.com{uri} permanent
}
```

### 3. Iniciar Caddy

```bash
# Recarregar configuração
sudo systemctl reload caddy

# Verificar status
sudo systemctl status caddy

# Ver logs
sudo journalctl -u caddy -f
```

**Pronto!** Caddy obtém o certificado SSL automaticamente.

## Opção 2: Nginx + Certbot

### 1. Instalar Nginx e Certbot

```bash
# Instalar Nginx
sudo apt update
sudo apt install nginx

# Instalar Certbot
sudo apt install certbot python3-certbot-nginx
```

### 2. Configurar Nginx (HTTP primeiro)

Criar arquivo `/etc/nginx/sites-available/hallyuhub`:

```nginx
# Redirecionar www para domínio principal
server {
    listen 80;
    listen [::]:80;
    server_name www.hallyuhub.com;
    return 301 https://hallyuhub.com$request_uri;
}

# Configuração principal
server {
    listen 80;
    listen [::]:80;
    server_name hallyuhub.com;

    # Logs
    access_log /var/log/nginx/hallyuhub-access.log;
    error_log /var/log/nginx/hallyuhub-error.log;

    # Proxy para a aplicação
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;

        # Headers necessários
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Cache bypass
        proxy_cache_bypass $http_upgrade;
    }

    # Aumentar tamanho máximo de upload (se necessário)
    client_max_body_size 10M;
}
```

### 3. Ativar Configuração

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/hallyuhub /etc/nginx/sites-enabled/

# Remover configuração padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### 4. Obter Certificado SSL

```bash
# Obter certificado (Certbot configura HTTPS automaticamente)
sudo certbot --nginx -d hallyuhub.com -d www.hallyuhub.com

# Testar renovação automática
sudo certbot renew --dry-run
```

Certbot irá:
- Obter certificado Let's Encrypt
- Configurar HTTPS automaticamente no Nginx
- Configurar renovação automática

### 5. Verificar HTTPS

Após Certbot, sua configuração terá sido atualizada com:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name hallyuhub.com;

    # Certificados (adicionados pelo Certbot)
    ssl_certificate /etc/letsencrypt/live/hallyuhub.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hallyuhub.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... resto da configuração
}

# Redirecionar HTTP para HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name hallyuhub.com www.hallyuhub.com;
    return 301 https://hallyuhub.com$request_uri;
}
```

## Configurar DNS

Em seu provedor de DNS (Cloudflare, AWS Route 53, etc.):

```
# Tipo    Nome              Valor                TTL
A         hallyuhub.com     31.97.255.107        3600
A         www               31.97.255.107        3600
```

Ou se usar Cloudflare:
```
# Tipo    Nome              Valor                Proxy
A         @                 31.97.255.107        ✅ Proxied
CNAME     www               hallyuhub.com        ✅ Proxied
```

**Importante:** Se usar proxy do Cloudflare, configure SSL mode como "Full" ou "Full (strict)".

## Configurar Firewall

```bash
# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar status
sudo ufw status
```

## Atualizar Variáveis de Ambiente

Editar `.env.production`:

```bash
NEXT_PUBLIC_SITE_URL="https://hallyuhub.com.br"
```

Redeployar após mudança:

```bash
cd /var/www/hallyuhub
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

## Verificar HTTPS

### 1. Teste Básico

```bash
# Verificar se o site está acessível
curl -I https://hallyuhub.com.br

# Verificar redirecionamento HTTP → HTTPS
curl -I http://hallyuhub.com.br
```

### 2. Teste de Segurança

Ferramentas online:
- **SSL Labs:** https://www.ssllabs.com/ssltest/
- **Security Headers:** https://securityheaders.com/

Alvo: Score A ou A+

## Troubleshooting

### Certificado não obtido

```bash
# Verificar logs do Certbot
sudo journalctl -u certbot

# Verificar se a porta 80 está acessível
curl -I https://hallyuhub.com.br

# DNS propagado?
dig hallyuhub.com.br
nslookup hallyuhub.com.br
```

### Caddy não inicia

```bash
# Verificar logs
sudo journalctl -u caddy -n 50

# Testar configuração
caddy validate --config /etc/caddy/Caddyfile

# Verificar se a porta 443 está em uso
sudo lsof -i :443
```

### Nginx erro 502 Bad Gateway

```bash
# Verificar se a aplicação está rodando
docker ps | grep hallyuhub

# Verificar se a porta 3000 está ouvindo
sudo lsof -i :3000

# Ver logs do Nginx
sudo tail -f /var/log/nginx/hallyuhub-error.log
```

### Mixed Content Warnings

Se você vir avisos de conteúdo misto (HTTP em página HTTPS):

1. **Verificar NEXT_PUBLIC_SITE_URL** está com `https://`
2. **Usar URLs relativas** ou sem protocolo (`//cdn.example.com`)
3. **Force HTTPS** em todas as requisições

## Renovação Automática SSL

### Caddy
Renovação automática, não precisa configurar.

### Nginx + Certbot

Certbot configura renovação automática via cron ou systemd timer:

```bash
# Ver timer de renovação
sudo systemctl status certbot.timer

# Testar renovação
sudo certbot renew --dry-run
```

Certificados são renovados automaticamente 30 dias antes de expirar.

## Comparação Caddy vs Nginx

| Recurso | Caddy | Nginx |
|---------|-------|-------|
| **HTTPS Automático** | ✅ Sim | ❌ Manual (Certbot) |
| **Configuração** | Muito simples | Mais complexa |
| **Performance** | Excelente | Excelente |
| **Comunidade** | Menor | Muito grande |
| **Documentação** | Boa | Excelente |
| **Maturidade** | Recente | Muito madura |

## Recomendação

- **Iniciantes:** Caddy (setup em minutos, HTTPS automático)
- **Experiência:** Nginx (mais controle, documentação extensa)
- **Cloudflare:** Qualquer um (Cloudflare gerencia SSL)

## Próximos Passos

Após configurar HTTPS:

1. **Testar site:** https://hallyuhub.com
2. **Configurar cron** para geração automática
3. **Monitorar logs** de acesso e erro
4. **Configurar CDN** (opcional - Cloudflare)
5. **Backup** regular do servidor

## Referências

- [Caddy Documentation](https://caddyserver.com/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Certbot](https://certbot.eff.org/)
- [Let's Encrypt](https://letsencrypt.org/)
- [SSL Labs](https://www.ssllabs.com/)
