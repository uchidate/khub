# Configuração do Ollama em Docker

O Ollama é usado como provedor de IA local para gerar conteúdo quando outros provedores (Gemini, OpenAI, Claude) não estão disponíveis ou para reduzir custos.

## 📋 Visão Geral

- **Ambiente**: Docker container separado para staging e produção
- **Modelo**: phi3 (~2.2GB, leve e rápido)
- **Uso de RAM**: ~2-3GB quando ativo
- **Integração**: Automática via rede Docker

## 🚀 Setup Rápido

### 1. Criar Volumes Docker

Primeiro, crie os volumes persistentes para armazenar os modelos:

```bash
# Para staging
docker volume create ollama-staging-data

# Para produção
docker volume create ollama-production-data
```

### 2. Iniciar Containers

```bash
# Staging
docker-compose -f docker-compose.staging.yml up -d

# Produção
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Baixar Modelo phi3

Execute o script automatizado:

```bash
# Staging
./scripts/setup-ollama-docker.sh staging

# Produção
./scripts/setup-ollama-docker.sh production
```

O script vai:
- ✅ Verificar se o container está rodando
- ✅ Baixar o modelo phi3 (~2.2GB)
- ✅ Testar a geração de texto
- ✅ Mostrar modelos instalados

### 4. Atualizar Variáveis de Ambiente

As variáveis já estão configuradas nos arquivos `.env.staging` e `.env.production`:

```bash
# Staging
OLLAMA_BASE_URL="http://ollama-staging:11434"

# Produção
OLLAMA_BASE_URL="http://ollama-production:11434"
```

### 5. Reiniciar Aplicação

Após configurar o Ollama, reinicie a aplicação para reconhecer o provedor:

```bash
# Staging
docker-compose -f docker-compose.staging.yml restart hallyuhub-staging

# Produção
docker-compose -f docker-compose.prod.yml restart hallyuhub
```

## ✅ Verificação

### Verificar Container

```bash
# Staging
docker ps | grep ollama-staging

# Produção
docker ps | grep ollama-production
```

### Listar Modelos

```bash
# Staging
docker exec hallyuhub-ollama-staging ollama list

# Produção
docker exec hallyuhub-ollama-production ollama list
```

### Testar Geração

```bash
# Staging
docker exec -it hallyuhub-ollama-staging ollama run phi3 "Olá, como você está?"

# Produção
docker exec -it hallyuhub-ollama-production ollama run phi3 "Olá, como você está?"
```

### Verificar Logs

```bash
# Staging
docker logs hallyuhub-ollama-staging -f

# Produção
docker logs hallyuhub-ollama-production -f
```

### Endpoint Health

Teste o endpoint de health da aplicação:

```bash
# Staging
curl http://localhost:3001/api/health

# Produção (via Nginx)
curl https://www.hallyuhub.com.br/api/health
```

Procure por:
```json
{
  "aiProviders": {
    "ollama": {
      "available": true,
      "url": "http://ollama-production:11434"
    }
  }
}
```

## 🔧 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker logs hallyuhub-ollama-staging --tail 50

# Verificar se porta 11434 está livre
docker ps | grep 11434

# Reiniciar container
docker restart hallyuhub-ollama-staging
```

### Modelo não baixa

```bash
# Verificar espaço em disco
df -h

# Baixar manualmente
docker exec hallyuhub-ollama-staging ollama pull phi3

# Ver progresso
docker logs hallyuhub-ollama-staging -f
```

### Aplicação não conecta

```bash
# Verificar se estão na mesma rede
docker network inspect web

# Testar conectividade dentro do container
docker exec hallyuhub-staging curl http://ollama-staging:11434/api/tags

# Verificar variável de ambiente
docker exec hallyuhub-staging env | grep OLLAMA
```

### Alto uso de memória

```bash
# Ver uso de recursos
docker stats hallyuhub-ollama-production

# Limitar memória (adicionar ao docker-compose.yml):
deploy:
  resources:
    limits:
      memory: 4G
```

### Modelo corrompido

```bash
# Remover modelo
docker exec hallyuhub-ollama-production ollama rm phi3

# Baixar novamente
docker exec hallyuhub-ollama-production ollama pull phi3
```

## 📊 Monitoramento

### Uso de Recursos

```bash
# Ver stats em tempo real
docker stats hallyuhub-ollama-production

# Ver uso de disco do volume
docker system df -v | grep ollama
```

### Logs de Acesso

Os logs da aplicação mostram quando o Ollama é usado:

```bash
docker logs hallyuhub -f | grep -i ollama
```

## 🔄 Atualização

### Atualizar Imagem Ollama

```bash
# Pull da nova versão
docker pull ollama/ollama:latest

# Recriar container (mantém modelos no volume)
docker-compose -f docker-compose.prod.yml up -d --force-recreate ollama-production
```

### Atualizar Modelo phi3

```bash
docker exec hallyuhub-ollama-production ollama pull phi3
```

## 🎯 Modelos Alternativos

Se precisar trocar o modelo (mais RAM disponível):

```bash
# Mistral (4GB RAM) - melhor qualidade
docker exec hallyuhub-ollama-production ollama pull mistral

# Llama3:8b (8GB RAM) - qualidade máxima
docker exec hallyuhub-ollama-production ollama pull llama3:8b

# Atualizar código em lib/ai-orchestration.ts
# Trocar "phi3" por "mistral" ou "llama3:8b"
```

## 🗑️ Remoção

Para remover completamente o Ollama:

```bash
# Parar e remover container
docker-compose -f docker-compose.prod.yml stop ollama-production
docker-compose -f docker-compose.prod.yml rm -f ollama-production

# Remover volume (CUIDADO: apaga modelos!)
docker volume rm ollama-production-data

# Remover configuração do .env
# Comentar OLLAMA_BASE_URL
```

## 💡 Dicas

1. **Primeiro Deploy**: O modelo phi3 só precisa ser baixado uma vez. Depois fica persistido no volume Docker.

2. **Economia de Custos**: Ollama é gratuito e roda localmente, ideal como fallback quando APIs pagas atingem limites.

3. **Performance**: phi3 é rápido mas menos capaz que GPT-4/Gemini. Use para tarefas simples ou emergenciais.

4. **Recursos**: Garanta pelo menos 4GB RAM livre no servidor antes de usar Ollama.

5. **Backup**: Os modelos ficam em `/root/.ollama` dentro do container. O volume Docker já persiste isso.

## 📚 Recursos

- [Ollama Official Docs](https://ollama.com/docs)
- [Ollama Docker Hub](https://hub.docker.com/r/ollama/ollama)
- [Modelos Disponíveis](https://ollama.com/library)
