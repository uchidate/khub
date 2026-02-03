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

## 2. Abordagem Moderna: GitHub Actions (Automático) ✨
Com o novo pipeline que criamos, você não precisa mais compactar arquivos manualmente.

### Preparação Única no Servidor:
1.  Crie a pasta do projeto: `mkdir -p /var/www/hallyuhub`.
2.  Copie o arquivo `robust-deploy.sh` para dentro dessa pasta (pode usar `scp` ou criar o arquivo manualmente via `nano`).
3.  Dê permissão de execução: `chmod +x /var/www/hallyuhub/robust-deploy.sh`.

### Fluxo de Trabalho:
1.  Configure as **GitHub Secrets** no seu repositório (IP, Usuário e Chave SSH).
2.  Faça um `git push` para a branch `main`.
3.  O GitHub Actions fará o build, o push para o Registry e o deploy automático no seu VPS.

---

## 3. Abordagem de Backup: SCP Manual (Se necessário)
Se por algum motivo a automação falhar, você ainda pode usar o método manual:

1.  **No Mac:** `tar --exclude='node_modules' --exclude='.next' --exclude='.git' -czf hallyuhub.tar.gz .`
2.  **Enviar:** `scp hallyuhub.tar.gz root@[IP_DA_HOSTINGER]:/var/www/hallyuhub/`
3.  **No Servidor:** `cd /var/www/hallyuhub && tar -xzf hallyuhub.tar.gz && bash robust-deploy.sh`

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
