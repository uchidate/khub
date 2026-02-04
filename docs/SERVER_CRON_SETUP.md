# 🕐 Configuração de Cron no Servidor com Ollama

## 📋 Visão Geral

Este guia configura um cron job diretamente no servidor para atualizar conteúdo a cada 15 minutos usando **Ollama** (gratuito e local).

## ✅ Vantagens desta Solução

- ✅ **Totalmente gratuito** (Ollama é local)
- ✅ **Confiável** - Cron nativo do Linux
- ✅ **Previsível** - Executa exatamente a cada 15 minutos
- ✅ **Rápido** - Não depende de serviços externos
- ✅ **Privado** - Dados não saem do servidor

---

## 🚀 Setup Passo a Passo

### 1. Instalar e Configurar Ollama no Servidor

```bash
# SSH no servidor
ssh usuario@seu-servidor

# Instalar Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Iniciar Ollama
ollama serve &

# Baixar modelo (escolha um)
ollama pull llama2        # Recomendado - balanceado
# OU
ollama pull mistral      # Mais rápido
# OU
ollama pull llama3       # Mais preciso

# Verificar
ollama list
curl http://localhost:11434/api/tags
```

### 2. Testar Geração Manual

```bash
# No servidor, vá para o diretório do projeto
cd /var/www/hallyuhub  # ajuste o caminho

# Teste o script com Ollama
npm run atualize:ai -- --provider=ollama --artists=2 --news=2

# Deve ver output:
# 🤖 HallyuHub AI Data Generator
# ✅ Saved: Nome do Artista
# ✅ Saved: Título da Notícia
```

Se funcionar, prossiga. Se não:
```bash
# Debug
echo $DATABASE_URL  # Confirme que está setado
echo $OLLAMA_BASE_URL  # Deve ser http://localhost:11434
node --version  # Deve ser >= 18
```

### 3. Configurar Cron Job

```bash
# Abrir crontab
crontab -e

# Adicionar esta linha (ajuste o caminho):
*/15 * * * * cd /var/www/hallyuhub && npm run atualize:ai -- --provider=ollama --artists=2 --news=2 >> /var/log/hallyuhub-cron.log 2>&1

# Salvar e sair (Ctrl+X, Y, Enter no nano)
```

**Explicação da linha**:
- `*/15 * * * *` = A cada 15 minutos
- `cd /var/www/hallyuhub` = Vai para o diretório do projeto
- `npm run atualize:ai` = Executa o script
- `--provider=ollama` = Usa Ollama (gratuito)
- `--artists=2 --news=2` = Gera 2 artistas + 2 notícias
- `>> /var/log/hallyuhub-cron.log 2>&1` = Salva logs

### 4. Verificar Cron Configurado

```bash
# Ver crontab atual
crontab -l

# Deve mostrar sua linha de cron
```

### 5. Criar Arquivo de Log

```bash
# Criar arquivo de log
sudo touch /var/log/hallyuhub-cron.log
sudo chmod 666 /var/log/hallyuhub-cron.log

# Verificar
ls -la /var/log/hallyuhub-cron.log
```

---

## 📊 Monitoramento

### Ver Logs em Tempo Real

```bash
# Seguir logs do cron
tail -f /var/log/hallyuhub-cron.log

# Ver últimas 50 linhas
tail -50 /var/log/hallyuhub-cron.log

# Filtrar por erros
grep -i error /var/log/hallyuhub-cron.log
grep "❌" /var/log/hallyuhub-cron.log
```

### Ver Quando Foi a Última Execução

```bash
# Ver timestamp do último log
tail -1 /var/log/hallyuhub-cron.log
```

### Verificar Novos Registros no Banco

```bash
# SSH no servidor
psql $DATABASE_URL << 'EOF'
SELECT
  'Artistas criados hoje' as tipo,
  COUNT(*) as total
FROM "Artist"
WHERE "createdAt"::date = CURRENT_DATE
UNION ALL
SELECT
  'News criadas hoje',
  COUNT(*)
FROM "News"
WHERE "createdAt"::date = CURRENT_DATE;
EOF
```

### Ver Últimos Artistas Criados

```bash
psql $DATABASE_URL << 'EOF'
SELECT
  "nameRomanized",
  "createdAt"
FROM "Artist"
ORDER BY "createdAt" DESC
LIMIT 5;
EOF
```

---

## ⚙️ Configuração Avançada

### Ajustar Frequência

```bash
# Editar crontab
crontab -e

# Opções:
*/15 * * * *  # A cada 15 minutos (atual)
*/30 * * * *  # A cada 30 minutos
0 * * * *     # A cada hora
0 */2 * * *   # A cada 2 horas
0 0 * * *     # Uma vez por dia (meia-noite)
```

### Ajustar Quantidades

```bash
# Editar crontab
crontab -e

# Altere os números:
--artists=2   # Quantos artistas por execução
--news=2      # Quantas notícias por execução
--productions=1  # Produções (opcional)

# Exemplo: mais conteúdo por execução
*/15 * * * * cd /var/www/hallyuhub && npm run atualize:ai -- --provider=ollama --artists=3 --news=3 --productions=1 >> /var/log/hallyuhub-cron.log 2>&1
```

### Desabilitar Temporariamente

```bash
# Comentar a linha no crontab
crontab -e

# Adicione # no início:
# */15 * * * * cd /var/www/hallyuhub && npm run atualize:ai ...

# Salvar e sair
```

### Reabilitar

```bash
# Remover o #
crontab -e
```

---

## 🐛 Troubleshooting

### Problema: Cron não executa

**Solução 1: Verificar serviço cron**
```bash
# Ver status
sudo systemctl status cron
# OU (dependendo do sistema)
sudo systemctl status crond

# Iniciar se parado
sudo systemctl start cron
sudo systemctl enable cron
```

**Solução 2: Verificar permissões**
```bash
# Cron precisa ter permissão de executar
ls -la /var/log/hallyuhub-cron.log
# Deve ter permissão de escrita

# Corrigir se necessário
sudo chmod 666 /var/log/hallyuhub-cron.log
```

**Solução 3: Usar caminho absoluto do npm**
```bash
# Descobrir caminho do npm
which npm
# Ex: /usr/bin/npm

# Usar caminho completo no crontab
*/15 * * * * cd /var/www/hallyuhub && /usr/bin/npm run atualize:ai -- --provider=ollama --artists=2 --news=2 >> /var/log/hallyuhub-cron.log 2>&1
```

### Problema: Ollama não responde

```bash
# Verificar se está rodando
ps aux | grep ollama

# Se não estiver, iniciar
ollama serve &

# Tornar permanente (adicione ao rc.local ou systemd)
```

**Criar serviço systemd para Ollama**:
```bash
# Criar arquivo de serviço
sudo nano /etc/systemd/system/ollama.service

# Conteúdo:
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=seu-usuario
ExecStart=/usr/local/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target

# Salvar e ativar
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama
```

### Problema: Script falha mas cron executa

```bash
# Ver erro específico nos logs
tail -100 /var/log/hallyuhub-cron.log | grep -A 5 "Error"

# Testar manualmente
cd /var/www/hallyuhub
npm run atualize:ai -- --provider=ollama --artists=2 --news=2

# Ver output completo
```

**Erros comuns**:
- `DATABASE_URL not set` → Adicione ao .env
- `Cannot find module` → Execute `npm install`
- `Ollama connection refused` → Inicie Ollama
- `Permission denied` → Verifique permissões de arquivo

---

## 📈 Métricas Esperadas

Com configuração a cada 15 minutos:

| Período | Artistas | Notícias | Custo |
|---------|----------|----------|-------|
| 15 min  | 2        | 2        | $0    |
| 1 hora  | 8        | 8        | $0    |
| 1 dia   | ~190     | ~190     | $0    |
| 1 mês   | ~5,700   | ~5,700   | $0    |

**Custo Total**: **GRÁTIS** 🎉 (Ollama é local e open-source)

---

## 🔧 Rotação de Logs (Recomendado)

Para evitar que o arquivo de log cresça infinitamente:

```bash
# Criar configuração de logrotate
sudo nano /etc/logrotate.d/hallyuhub-cron

# Conteúdo:
/var/log/hallyuhub-cron.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}

# Salvar e testar
sudo logrotate -d /etc/logrotate.d/hallyuhub-cron
```

---

## ✅ Checklist Final

Antes de considerar configurado:

- [ ] Ollama instalado e rodando
- [ ] Modelo baixado (`ollama list`)
- [ ] Teste manual funcionou
- [ ] Crontab configurado (`crontab -l`)
- [ ] Arquivo de log criado
- [ ] Aguardou 15 minutos
- [ ] Viu novo registro no log
- [ ] Confirmou novos artistas no banco
- [ ] Logrotate configurado (opcional)

---

## 📞 Comandos Rápidos de Verificação

```bash
# Status geral
echo "=== OLLAMA ==="
ollama list
curl -s http://localhost:11434/api/tags | head -10

echo "=== CRON ==="
crontab -l | grep hallyuhub

echo "=== ÚLTIMO LOG ==="
tail -5 /var/log/hallyuhub-cron.log

echo "=== ARTISTAS HOJE ==="
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"Artist\" WHERE \"createdAt\"::date = CURRENT_DATE;"

echo "=== NEWS HOJE ==="
psql $DATABASE_URL -c "SELECT COUNT(*) FROM \"News\" WHERE \"createdAt\"::date = CURRENT_DATE;"
```

---

## 🎯 Tudo Funcionando!

Se você vê:
- ✅ Logs sendo gerados a cada 15 minutos
- ✅ Novos artistas aparecendo no banco
- ✅ Novos itens visíveis no site

**Parabéns! Sistema de cron está 100% funcional e gratuito! 🎉**
