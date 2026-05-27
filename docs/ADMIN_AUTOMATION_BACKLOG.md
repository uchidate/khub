# Backlog de Administracao e Automacao

## Objetivo

Evoluir o admin como central operacional sem reativar geracao editorial
automatica. Conteudo autoral e traducao continuam no fluxo revisado:
prompt, Gemini, revisao humana e aplicacao manual.

## Prioridade Alta

### 1. Fila unica de curadoria operacional

Status: primeira entrega implementada.

- Unificar os criterios de pendencia usados pela Caixa, Central de Curadoria
  e listas detalhadas.
- Exibir uma lista unica priorizada de artistas, grupos e producoes.
- Ordenar por impacto editorial, relevancia/trending, campos faltantes e
  antiguidade.
- Manter a acao final em cada editor especializado, sem escrita automatica.

Entregue:

- Criterios compartilhados entre Caixa, Central de Curadoria e filas
  detalhadas.
- Lista priorizada inicial na Central de Curadoria.

### 2. Historico de execucao dos jobs

Status: primeira entrega implementada.

- Registrar inicio, fim, duracao, status, itens processados, alterados e
  falhas de cada job.
- Distinguir sucesso, sucesso parcial, falha e execucao ignorada por lock.
- Alimentar a Central de Automacao e o Inventario com resultados reais,
  em vez de inferir execucao apenas por alteracoes nos dados.

Entregue:

- Registro informativo `CRON_RUN` com status e resumo dos jobs ativos.
- Ultimo resultado exibido em cada card da Central de Automacao.

### 3. Alertas de backlog parado

Status: primeira entrega implementada.

- Destacar curadoria aguardando tratamento por mais de 7 dias.
- Destacar noticias prontas sem publicacao por mais de 24 horas.
- Destacar traducoes em rascunho por mais de 3 dias.
- Alertar quando um job nao apresentar sucesso dentro da janela esperada.

Entregue:

- Alerta de registros incompletos de curadoria criados ha mais de 7 dias.
- Indicadores de noticias nao publicadas ha mais de 24 horas e traducoes em
  rascunho ha mais de 3 dias na Caixa de trabalho.

Pendente:

- SLA de sucesso dos jobs com base na frequencia programada.

### 4. Recuperacao confirmada de falhas

Status: primeira entrega implementada.

- Relacionar nova execucao com o incidente que motivou o retry.
- Marcar incidente como recuperado somente apos uma execucao bem-sucedida.
- Evidenciar falhas recorrentes.

Entregue:

- A tela de falhas detecta execucao bem-sucedida posterior ao ultimo erro e
  apresenta o incidente historico como recuperado.

## Administracao

### 5. Painel diario priorizado

- Ordenar trabalho por incidentes, moderacao, publicacao, curadoria e
  manutencao de catalogo.
- Mostrar a acao recomendada e o tempo em fila.

### 6. Responsabilidade e status de revisao

- Adicionar estados nao iniciado, em revisao, aguardando correcao e concluido.
- Registrar responsavel e nota operacional em curadoria, traducoes e
  moderacao.

### 7. Linha do tempo por entidade

- Exibir importacao, sincronizacoes, curadoria Gemini, revisoes,
  publicacao/ocultacao e falhas associadas.

### 8. Medicao de resultado por processo

- Complementar a telemetria de acesso com acoes concluidas e tempo de
  resolucao por tela.
- Usar os dados para consolidar ou arquivar ferramentas redundantes.

## Automacao Segura

### 9. Preenchimento tecnico de campos vazios

- Automatizar apenas dados tecnicos ausentes: IDs externos, imagens, elenco,
  classificacao indicativa, redes sociais e catalogo musical.
- Preservar campos manuais e revisados.

### 10. Fila de excecoes e sugestoes

- Gerar sugestoes para duplicatas, vinculos TMDB, conteudo nao coreano,
  divergencias de nome e imagens suspeitas.
- Aplicar automaticamente apenas correspondencias de alta confianca e
  registrar a decisao.

### 11. Notificacoes acionaveis

- Notificar repeticao de falha, backlog acima do limite e integracao
  indisponivel.
- Evitar alertas para execucoes normais sem acao requerida.

## Complementos

### 12. SLA por conjunto de dados

- Definir frequencia esperada por area e sinalizar em dia, atrasado ou sem
  evidencia de execucao.

### 13. Exportacao de pendencias

- Exportar filas de curadoria e incidentes para CSV/Excel.

### 14. Atualizacao documental

- Remover referencias antigas a geracao automatica quando o fluxo atual exige
  revisao manual.

## Sequencia Recomendada

1. Unificar criterios e lista priorizada de curadoria.
2. Registrar resultados de execucao dos jobs.
3. Implementar alertas de backlog parado.
4. Relacionar retry com recuperacao.
5. Medir acoes concluidas por processo.
