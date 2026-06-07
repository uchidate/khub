# Aprendizados Operacionais

Registro vivo de erros, causas e decisões aprendidas durante manutenção do HallyuHub. Sempre que um erro novo aparecer, atualize este arquivo antes de finalizar a tarefa.

## Regra de ouro

- Registrar o aprendizado no mesmo PR/commit da correção.
- Separar claramente dado em produção, cache público e código implantado.
- Preferir correções reutilizáveis a ajustes pontuais quando o erro puder reaparecer em outros grupos, artistas ou páginas.

## Conteúdo e produção

### Execução remota via SSH precisa de helper padronizado

**Erro observado:** correções diretas em produção falharam repetidamente por três motivos diferentes: sandbox local bloqueando SSH, `tsx -` recebendo TypeScript via stdin e shell remoto interpolando `$disconnect`.

**Causa:** comandos longos com `ssh + docker exec + tsx + heredoc` são frágeis. Eles misturam regras do shell local, shell remoto, sandbox da ferramenta e runtime ESM do container.

**Como evitar:**

- Usar `scripts/prod-tsx-eval.sh` para toda execução pontual de Prisma no app de produção.
- Enviar código por arquivo ou stdin, sem encaixar scripts grandes em `tsx -e`.
- Para alteração curta e direta, usar `tsx -e` com IIFE assíncrona; `tsx -e` no container compila como CJS e não aceita top-level await.
- Escrever o snippet como JavaScript compatível, sem `type`, `interface` ou anotações TS quando usar stdin.
- Importar Prisma com wrapper resiliente dentro do container:
  `import prismaImport from './lib/prisma'; const prisma = prismaImport?.default ?? prismaImport?.prisma ?? prismaImport`.
- Encerrar snippets Prisma com `await prisma["$disconnect"]?.()` para não deixar o processo preso pelo pool.
- Evitar chamar métodos com `$` em comandos inline; usar `prisma["$disconnect"]?.()` apenas dentro de arquivo/stdin, nunca em string interpolada por shell.
- Não assumir container fixo: o helper detecta o container `ghcr.io/uchidate/khub:latest` ativo.

**Comandos recomendados:**

```bash
# arquivo temporário/local
bash scripts/prod-tsx-eval.sh /tmp/fix-artists.js

# stdin
bash scripts/prod-tsx-eval.sh <<'JS'
import prisma from './lib/prisma'
const total = await prisma.artist.count()
console.log({ total })
JS
```

Se o snippet vier por stdin em `tsx -`, prefira:

```js
import prismaImport from './lib/prisma'
const prisma = prismaImport?.default ?? prismaImport?.prisma ?? prismaImport
```

Para mudança curta, o formato mais estável é:

```bash
ssh -p 22 -i ~/.ssh/id_ed25519 -o BatchMode=yes root@31.97.255.107 \
  'docker exec CONTAINER sh -lc "tsx -e '\''import p from \"./lib/prisma\"; const prisma=p?.default??p?.prisma??p; (async()=>{ /* Prisma aqui */ process.exit(0)})().catch(e=>{console.error(e);process.exit(1)})'\''"'
```

### Páginas podem servir HTML antigo mesmo com banco correto

**Erro observado:** perfis atualizados no banco continuavam antigos no domínio público por causa de ISR/cache.

**Causa:** `x-nextjs-cache: HIT` ou `STALE` pode servir HTML pré-renderizado. O banco estar correto não garante que o HTML público já reflita a mudança.

**Como evitar:**

- Conferir o banco e o HTML público separadamente.
- Após atualização de conteúdo, validar termos novos no HTML servido pelo app.
- Só dizer que está publicado quando a página pública renderizar o conteúdo novo.

**Checagem recomendada:**

```bash
wget -S -O /tmp/page.html http://localhost:3000/artists/slug 2>/tmp/page.headers
grep -i "x-nextjs-cache\|HTTP/" /tmp/page.headers
grep -o "TERMO_NOVO" /tmp/page.html | sort | uniq -c
```

### Revalidation precisa de segredo real disponível no runtime

**Erro observado:** chamadas de revalidação não surtiram efeito porque o container da app não expunha `REVALIDATE_SECRET` no shell.

**Causa:** assumir que variável existe em runtime sem verificar.

**Como evitar:**

- Confirmar se a variável está configurada no ambiente real da aplicação.
- Se não houver segredo, não prometer revalidação imediata.
- Preferir corrigir a configuração/deploy a tentar apagar cache manualmente.

## Grupos e integrantes

### Membership é fonte autoritativa, mas precisa de curadoria

**Erro observado:** `fromis-9` tinha vínculo incorreto com `lee-si-yeon` do Dreamcatcher e não registrava corretamente integrantes atuais/ex-integrantes.

**Causa:** sincronizações automáticas e nomes parecidos podem criar relações erradas. `stageNames` não deve ser tratado como prova suficiente de membership.

**Como evitar:**

- Para páginas de grupo, usar `ArtistGroupMembership` como fonte principal.
- Conferir `isActive`, `leaveDate`, `position` e artista vinculado antes de enriquecer perfis.
- Quando houver ex-integrantes, manter histórico explícito em vez de apagar a trajetória.

**Correção aplicada em 2026-06-05:**

- fromis_9 ativos: Song Hayoung, Park Jiwon, Lee Chaeyoung, Lee Nagyung, Baek Jiheon.
- fromis_9 históricos: Lee Saerom, Lee Seoyeon, Roh Jisun, Jang Gyuri.
- Removido vínculo errado de `lee-si-yeon` com fromis_9.

### Schema antes de UPDATE

**Erro observado:** tentativa de atualizar `ArtistGroupMembership.updatedAt`, mas a tabela não tem essa coluna.

**Causa:** presumir padrão de schema sem conferir o modelo.

**Como evitar:**

- Antes de SQL direto em produção, conferir `\d "Tabela"` ou `prisma/schema.prisma`.
- Em produção, usar transação. Se uma coluna não existir, garantir rollback antes de repetir.

### Conferir artista duplicado antes de corrigir slug

**Erro observado:** ao corrigir IZ*ONE, havia uma artista `Hitomi` sem slug e outra canônica `hitomi-honda`. Tentar atribuir o slug canônico direto na duplicada bateria na restrição única.

**Causa:** importações anteriores podem criar artistas parciais sem slug, enquanto o perfil correto já existe com histórico, papéis e conteúdo editorial.

**Como evitar:**

- Antes de alterar slug em produção, buscar nomes parecidos e slugs existentes.
- Quando existir perfil canônico, mover `ArtistGroupMembership` para esse artista em vez de criar conflito de slug.
- Ocultar o registro órfão apenas depois de confirmar que não sobrou membership vinculado a ele.

**Correção aplicada em 2026-06-05:**

- Membership histórica da Hitomi em IZ*ONE movida para `hitomi-honda`.
- Registro órfão `Hitomi` sem slug ocultado após ficar sem vínculos.
- IZ*ONE marcado como grupo encerrado em 2021-04-29 com as 12 integrantes históricas inativas e ordenadas.

## Build e validação

### `.env.local` pode apontar para túnel remoto

**Erro observado:** `npm run build` falhou com `ECONNREFUSED` em Prisma mesmo com Postgres local rodando.

**Causa:** `.env.local` sobrescrevia `.env` e apontava `DATABASE_URL` para `localhost:5433`, esperado para túnel remoto.

**Como evitar:**

- Para build local, passar `DATABASE_URL` explicitamente quando necessário.
- Não assumir que `npm run build` usa o banco local do compose.

**Comando recomendado:**

```bash
DATABASE_URL='postgresql://hallyuhub:dev_password_change_in_prod@localhost:5432/hallyuhub_dev' npm run build
```

### `next/font` precisa de rede no build

**Erro observado:** build falhou buscando `Inter`, `Outfit` e `Sora` no Google Fonts.

**Causa:** ambiente sem acesso à rede durante `next build`.

**Como evitar:**

- Se o build falhar apenas em `next/font`, repetir com rede liberada.
- Para CI/produção, garantir acesso aos endpoints de fonts ou considerar self-host de fontes.

### Geração estática pode estourar conexões do Postgres

**Erro observado:** `P2037 TooManyConnections` durante `Generating static pages using 7 workers`.

**Causa:** Next gerando muitas páginas em paralelo, cada worker abrindo consultas Prisma contra um Postgres local com limite baixo.

**Como evitar:**

- Tratar build completo como teste de carga de conexões.
- Investigar limitação de concorrência do build, pooling ou ajustar `max_connections`/pool do Postgres local.
- Quando a mudança é localizada, typecheck + lint validam a alteração, mas o build completo só deve ser considerado aprovado quando passar sem `P2037`.

**Decisão aplicada em 2026-06-05:**

- Configurado `experimental.staticGenerationMaxConcurrency: 2` em `next.config.mjs` para reduzir a pressão de conexões durante `next build`.

## Vídeos e links externos

### Validar YouTube por oEmbed

**Erro observado:** vídeos indisponíveis apareciam em perfis.

**Causa:** IDs encontrados por busca podem ser fan uploads, bloqueados ou indisponíveis.

**Como evitar:**

- Validar cada ID com YouTube oEmbed antes de gravar.
- Preferir MVs oficiais de canal reconhecido.
- Não colocar vídeo solo quando só houver upload frágil/fan channel.

**Checagem:**

```bash
curl -s -o /dev/null -w '%{http_code}\n' \
  'https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=VIDEO_ID&format=json'
```

## Qualidade editorial

### Perfil rico não é ficha técnica

**Erro observado:** alguns perfis ficaram “preenchidos”, mas fracos comparados ao padrão da IU.

**Causa:** texto factual demais, poucos blocos editoriais, pouco contexto de carreira e pouca interpretação.

**Como evitar:**

- Usar abertura autoral forte.
- Incluir blocos `[MOMENTO]`, `[TAGS]`, `[FATOS]`, `[TIMELINE]`, `[DESTAQUE]`, `[RECORDE]`.
- Escrever seções narrativas com leitura artística, não apenas lista de prêmios.
- Curiosidades devem explicar relevância, não só repetir biografia.

### URLs geradas por IA podem vir em markdown ou wrapper do Google

**Erro observado:** o Gemini retornou `videos[].url` como `[https://www.youtube.com/watch?v=ID](https://www.google.com/search?q=...)`, e o validador rejeitou antes de aplicar o enriquecimento.

**Causa:** o modelo às vezes transforma URLs em markdown ou em links de busca quando copia resultados da web.

**Como evitar:**

- No prompt, exigir URL plain text direta para `videos[].url`.
- Antes do schema final, normalizar markdown `[texto](url)` e `google.com/search?q=URL_REAL`.
- Para vídeos, aceitar apenas YouTube direto e converter `youtu.be/ID` para `https://www.youtube.com/watch?v=ID`.
