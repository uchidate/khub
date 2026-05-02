# Scripts — Regras Obrigatórias

## Cron jobs

- **NUNCA** usar `docker exec` em cron sem `flock` — processos acumulam e causam OOM
- **PREFERIR** HTTP/curl do host: `curl http://localhost:3000/api/cron/endpoint`
- Watchdog em `/etc/cron.d/hallyuhub-watchdog` (sobrevive ao fix-crontab.sh)
- `atualize-ai` está **desativado** — deploy.yml remove `/etc/cron.d/hallyuhub-ai`

## Scripts TypeScript

- Usar `tsx` (não `ts-node`) — ts-node é devDependency e não existe na imagem prod
- Permissão `+x` obrigatória em todo script bash novo

## Heredocs em SSH

- **NUNCA** `<< 'ENDSSH'` com aspas — bloqueia expansão de variáveis
- Usar `<< ENDSSH` sem aspas

## Modificações via SSH

- SSH é **somente leitura**: logs, health check, `docker ps`
- Nunca editar arquivos, reiniciar containers ou fazer pull via SSH
