# Melhoria #8: Monitoring com Prometheus + Grafana

## Resumo

Stack de monitoramento completa com Prometheus, Grafana, Node Exporter e cAdvisor.

**Status:** Implementado
**Data:** 03/02/2026
**Impacto:** Medio - Visibilidade operacional

---

## Componentes

| Componente | Porta | Funcao |
|------------|-------|--------|
| Prometheus | 9090 | Coleta e armazenamento de metricas |
| Grafana | 3002 | Visualizacao e dashboards |
| Node Exporter | 9100 | Metricas do sistema (CPU, memoria, disco) |
| cAdvisor | 8080 | Metricas de containers Docker |

---

## Como Usar

### Iniciar Stack de Monitoring

```bash
# No servidor
cd /var/www/hallyuhub

# Iniciar monitoring
docker-compose -f docker-compose.monitoring.yml up -d

# Ver logs
docker-compose -f docker-compose.monitoring.yml logs -f
```

### Acessar

- **Prometheus:** http://servidor:9090
- **Grafana:** http://servidor:3002 (admin/admin)
- **Node Exporter:** http://servidor:9100/metrics
- **cAdvisor:** http://servidor:8080

---

## Metricas Disponiveis

### Sistema (Node Exporter)

```promql
# CPU
100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# Memoria
(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100

# Disco
(1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) * 100
```

### Containers (cAdvisor)

```promql
# Memoria por container
container_memory_usage_bytes{name=~"hallyuhub.*"}

# CPU por container
rate(container_cpu_usage_seconds_total{name=~"hallyuhub.*"}[5m]) * 100
```

### Aplicacao (Endpoint /api/metrics)

```promql
# Status da aplicacao
hallyuhub_up

# Uptime
hallyuhub_uptime_seconds

# Latencia do banco
hallyuhub_db_latency_ms

# Contagem de entidades
hallyuhub_entities_total{type="artist"}
hallyuhub_entities_total{type="production"}
hallyuhub_entities_total{type="news"}
```

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        GRAFANA (:3002)                      │
│                     Dashboard + Alertas                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      PROMETHEUS (:9090)                     │
│                   Coleta e Armazenamento                    │
└─────────────────────────────────────────────────────────────┘
          │              │              │              │
          ▼              ▼              ▼              ▼
   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │  Node    │   │ cAdvisor │   │ HallyuHub│   │ HallyuHub│
   │ Exporter │   │ (:8080)  │   │ Prod     │   │ Staging  │
   │ (:9100)  │   │          │   │ (:3000)  │   │ (:3001)  │
   └──────────┘   └──────────┘   └──────────┘   └──────────┘
        │              │              │              │
   ┌─────────────────────────────────────────────────────────┐
   │                    SERVIDOR VPS                         │
   └─────────────────────────────────────────────────────────┘
```

---

## Dashboard Pre-configurado

O Grafana ja vem com um dashboard "HallyuHub - Overview" que mostra:

- **CPU Usage** - Gauge com uso de CPU
- **Memory Usage** - Gauge com uso de memoria
- **Disk Usage** - Gauge com uso de disco
- **App Status** - Status UP/DOWN das aplicacoes
- **Container Memory** - Grafico de memoria dos containers
- **Container CPU** - Grafico de CPU dos containers

---

## Configuracao no Servidor

### 1. Copiar Arquivos

```bash
# Via SCP (do local)
scp -r docker/monitoring root@servidor:/var/www/hallyuhub/docker/
scp docker-compose.monitoring.yml root@servidor:/var/www/hallyuhub/
```

### 2. Criar Network (se nao existir)

```bash
docker network create web
```

### 3. Configurar Credenciais do Grafana

```bash
# Copiar template e editar
cp .env.monitoring.example .env.monitoring
nano .env.monitoring  # Alterar a senha padrao
```

### 4. Iniciar

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

---

## Alertas (Opcional)

Para adicionar alertas, configure o Alertmanager:

```yaml
# docker/monitoring/prometheus/alert_rules.yml
groups:
  - name: hallyuhub
    rules:
      - alert: AppDown
        expr: hallyuhub_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "HallyuHub esta fora do ar"

      - alert: HighMemoryUsage
        expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Uso de memoria acima de 90%"

      - alert: HighCPUUsage
        expr: 100 - (avg(irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Uso de CPU acima de 90%"
```

---

## Arquivos Criados

```
docker-compose.monitoring.yml
docker/monitoring/
├── prometheus/
│   └── prometheus.yml
└── grafana/
    └── provisioning/
        ├── dashboards/
        │   ├── dashboards.yml
        │   └── hallyuhub-overview.json
        └── datasources/
            └── datasources.yml
app/api/metrics/route.ts
```

---

## Recursos de Storage

| Volume | Retencao |
|--------|----------|
| prometheus-data | 30 dias |
| grafana-data | Persistente |

Para alterar retencao do Prometheus, edite `--storage.tsdb.retention.time` no docker-compose.

---

## Troubleshooting

### Prometheus nao coleta metricas da app

```bash
# Verificar se endpoint responde
curl http://localhost:3000/api/metrics

# Verificar targets no Prometheus
# Acesse http://servidor:9090/targets
```

### Grafana nao mostra dados

```bash
# Verificar datasource
# Grafana > Configuration > Data Sources > Prometheus > Test

# Verificar se Prometheus tem dados
# Prometheus > Graph > Digite: up
```

### Container nao inicia

```bash
# Ver logs
docker logs hallyuhub-prometheus
docker logs hallyuhub-grafana
```

---

*Implementado em: 03/02/2026*
*Stack: Prometheus + Grafana + Node Exporter + cAdvisor*
