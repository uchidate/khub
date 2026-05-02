# Prisma — Regras Obrigatórias

## Migrations

- **NUNCA** usar `prisma db push` em staging/production — destrói dados
- **SEMPRE** `prisma migrate dev --name descricao` localmente → commit do arquivo gerado → CI faz `migrate deploy`
- `prisma.config.ts` é obrigatório (Prisma 7) — URL datasource fica nele, não no schema
- Adapter `@prisma/adapter-pg` é obrigatório — sem ele PrismaClient não conecta

## Ao criar migration

1. Nome descritivo em snake_case: `add_scheduled_at_to_blog_post`
2. Verificar se há dados existentes antes de adicionar `NOT NULL` sem default
3. Constraints de unicidade em tabelas grandes: rodar `deduplicate-artists.ts` antes se necessário

## Schema

- `isHidden: false` obrigatório em toda query pública
- `take` limitado em toda query paginada (nunca `findMany` sem limite em rotas públicas)
- PrismaClient singleton em `lib/prisma.ts` — nunca instanciar `new PrismaClient()` fora dele
