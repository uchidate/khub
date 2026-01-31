# Guia de Deploy: Hostinger VPS 🚀

Este documento descreve os passos necessários para levar o HallyuHub v1 do seu ambiente local para um **VPS da Hostinger**. Como já otimizamos o projeto com Docker, o processo será muito similar ao que fizemos agora.

## 1. Requisitos no VPS Hostinger
Certifique-se de escolher um VPS com **Ubuntu 22.04** ou **Debian 11/12**. No painel da Hostinger, você precisará:

1.  Acessar o console SSH.
2.  Garantir que o Docker e o Docker Compose estejam instalados.

### Instalando Docker no VPS (Comando Rápido):
```bash
# Atualizar pacotes
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Dar permissão ao usuário (opcional)
sudo usermod -aG docker $USER
```

## 2. Preparação dos Arquivos (Local)
No seu Mac, crie o pacote compactado (excluindo arquivos desnecessários):

```bash
cd /Users/fabiouchidate/Antigravity/khub/v1
tar --exclude='node_modules' --exclude='.next' --exclude='.git' -czf hallyuhub-hostinger.tar.gz .
```

## 3. Transferência para Hostinger
Substitua `[IP_DA_HOSTINGER]` pelo IP do seu servidor:

```bash
scp hallyuhub-hostinger.tar.gz root@[IP_DA_HOSTINGER]:/var/www/
```

## 4. Deploy no Servidor
Acesse o servidor via SSH e execute:

```bash
cd /var/www
mkdir -p hallyuhub && mv hallyuhub-hostinger.tar.gz hallyuhub/
cd hallyuhub
tar -xzf hallyuhub-hostinger.tar.gz

# Iniciar o deploy automático
bash robust-deploy.sh
```

## 5. Configurando o Domínio e SSL (Nginx)
Para que o site responda pelo seu domínio (ex: `hallyuhub.com.br`) e tenha o cadeado verde (HTTPS), recomendamos usar o Nginx como Proxy Reverso.

### Exemplo de Configuração Nginx:
```nginx
server {
    listen 80;
    server_name seu-dominio.com.br;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Para o SSL (Certbot):
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d seu-dominio.com.br
```

---

> [!IMPORTANT]
> **Variaveis de Ambiente:** Não esqueça de configurar o arquivo `.env` no servidor com as suas chaves da API (Gemini, OpenAI, etc) antes de rodar o `robust-deploy.sh`.

> [!TIP]
> O VPS da Hostinger geralmente vem com um firewall ativado. Certifique-se de liberar as portas **80** (HTTP), **443** (HTTPS) e **3000** (opcional para teste direto).
