# Arquitetura do Catálogo Musical

## Objetivo

Separar a identidade editorial do HallyuHub da camada musical canônica e dos vínculos com plataformas externas.

Hoje:

- `Artist` e `MusicalGroup` concentram conteúdo editorial.
- `Album` mistura álbum, EP e single.
- links de streaming vivem em colunas fixas de `Album` e em `socialLinks` JSON.
- MusicBrainz é usado como fonte principal de discografia.

O novo desenho mantém o legado funcionando enquanto cria uma base própria para Spotify, Apple Music, YouTube Music, Deezer, Melon e futuras integrações.

## Princípios

1. O banco do HallyuHub é a verdade principal do catálogo.
2. Fontes externas enriquecem e sugerem, mas não definem sozinhas a modelagem.
3. Vínculos com plataformas guardam `externalId`, URL, origem e status de verificação.
4. Artistas, grupos, lançamentos e faixas são entidades diferentes.
5. A migração deve ser incremental e compatível com o site atual.

## Modelo alvo

### Identidade editorial existente

- `Artist`
- `MusicalGroup`

Esses modelos continuam sendo usados para páginas, SEO, bio, notícias, favoritos e conteúdo editorial.

### Camada musical canônica nova

- `MusicCatalogArtist`
  - representa a entidade musical canônica;
  - aponta opcionalmente para `Artist` ou `MusicalGroup`;
  - distingue `PERSON` e `GROUP`.
- `MusicRelease`
  - substitui conceitualmente `Album`;
  - cobre `ALBUM`, `EP`, `SINGLE`, `OST`, `REPACKAGE` etc.
- `MusicTrack`
  - representa faixa individual;
  - guarda `isrc`, número de faixa, duração e relação com release.
- `MusicReleaseCredit`
  - liga artistas musicais a lançamentos;
  - suporta collabs e ordem de exibição.
- `MusicTrackCredit`
  - liga artistas musicais a faixas;
  - suporta artistas principais, feats, produtores e compositores.

### Plataformas externas

- `StreamingPlatform`
  - cadastro de `spotify`, `apple_music`, `youtube_music`, `deezer`, `melon` etc.
- `ExternalMusicEntity`
  - vínculo entre uma entidade do catálogo e uma entidade externa;
  - guarda:
    - `externalId`
    - `url`
    - `source`
    - `confidence`
    - `matchStatus`
    - `matchedAt`

## Por que esse desenho

### O que melhora

- elimina colunas específicas por plataforma em novos modelos;
- evita JSON como fonte principal de vínculos musicais;
- permite vários artistas em um mesmo lançamento;
- abre caminho para faixas e ISRC;
- permite revisão humana e automação coexistirem;
- desacopla o catálogo do MusicBrainz.

### Papel futuro do MusicBrainz

MusicBrainz continua útil, mas como fonte auxiliar:

- sugestão de artistas e lançamentos;
- importação inicial de discografia;
- IDs externos;
- fallback quando APIs comerciais não ajudam.

Ele deixa de ser a espinha dorsal obrigatória do domínio musical.

## Migração incremental

### Fase 1 - Fundação

- adicionar novos modelos sem remover os antigos;
- popular `StreamingPlatform`;
- criar `MusicCatalogArtist` para artistas e grupos existentes;
- criar `MusicRelease` espelhando `Album`;
- vincular releases legados via `legacyAlbumId`.

### Fase 2 - Vínculos externos

- migrar links de `Album.spotifyUrl`, `appleMusicUrl` e `youtubeUrl` para `ExternalMusicEntity`;
- migrar `socialLinks.spotify` de artistas/grupos para vínculos externos quando houver confiança;
- integrar busca oficial do Spotify para artistas.

### Fase 3 - Admin novo

- tela de catálogo musical;
- busca por candidatos em plataformas;
- confirmação manual;
- badges de status:
  - não vinculado;
  - sugerido automaticamente;
  - confirmado manualmente;
  - rejeitado.

### Fase 4 - Faixas

- adicionar importação e curadoria de `MusicTrack`;
- usar ISRC como identificador forte quando disponível;
- expor faixas por release e, mais tarde, links por faixa.

### Fase 5 - Aposentar legado

- páginas públicas passam a ler prioritariamente do novo catálogo;
- colunas legadas de `Album` deixam de receber novas escritas;
- remoção do legado só depois de migração completa e observabilidade suficiente.

## Compatibilidade durante a transição

- `Artist`, `MusicalGroup` e `Album` permanecem ativos.
- `Album.legacyRelease` permite ponte entre o modelo atual e o novo.
- páginas atuais continuam funcionando até serem migradas.
- novos serviços devem preferir o catálogo novo, com fallback explícito para o legado durante a transição.

## Primeiro sprint recomendado

1. Criar migrations dos novos modelos.
2. Seed de plataformas:
   - `spotify`
   - `apple_music`
   - `youtube_music`
   - `deezer`
   - `musicbrainz`
3. Script de backfill:
   - `Artist` -> `MusicCatalogArtist`
   - `MusicalGroup` -> `MusicCatalogArtist`
   - `Album` -> `MusicRelease`
4. Serviço de leitura compatível para releases.
5. Admin simples para listar vínculos musicais por artista.

### Artefatos já iniciados no repositório

- `prisma/migrations/20260517000000_add_music_catalog_foundation`
- `scripts/backfill-music-catalog.ts`

O script de backfill é idempotente e pode ser executado mais de uma vez depois que a migration estiver aplicada.

## Segundo sprint recomendado

1. Integração oficial com Spotify.
2. Busca de artistas por nome.
3. Tela de comparação de candidatos.
4. Gravação de `ExternalMusicEntity` com `MANUAL_VERIFIED`.
5. Job de sugestão automática para pendentes.

## Regras de decisão

- `externalId` vale mais que URL.
- `MANUAL_VERIFIED` nunca deve ser sobrescrito automaticamente.
- match automático precisa guardar `confidence`.
- toda integração externa precisa declarar `source`.
- cada entidade externa deve apontar para exatamente um alvo interno coerente com `entityType`; validações de aplicação devem garantir isso.
