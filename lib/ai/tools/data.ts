/**
 * Data search agent tools (artists, groups, productions)
 */
import type { Tool } from "@anthropic-ai/sdk/resources";
import prisma from "@/lib/prisma";

type ToolWithRun = Tool & { run: (input: Record<string, unknown>) => Promise<string> }

export const searchArtistsTool: ToolWithRun = {
  name: "search_artists",
  description: "Buscar artistas por nome. Use apenas quando o usuário fornecer um nome ou palavra-chave específica. NÃO use para contar quantos artistas existem — use get_stats para isso.",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Nome ou palavra-chave (min 2 caracteres)" },
      limit: { type: "number", description: "Máx resultados (max 10)", default: 5 },
    },
    required: ["query"],
  },
  run: async ({ query, limit = 5 }) => {
    if ((query as string).length < 2) {
      return JSON.stringify({ error: "Query muito curta (mín 2 caracteres)" });
    }
    try {
      const artists = await prisma.artist.findMany({
        where: {
          isHidden: false,
          OR: [
            { nameRomanized: { contains: query as string, mode: "insensitive" } },
            { nameHangul: { contains: query as string, mode: "insensitive" } },
          ],
        },
        select: {
          id: true, nameRomanized: true, nameHangul: true, roles: true, primaryImageUrl: true,
          memberships: { select: { group: { select: { name: true } } }, take: 2 },
        },
        take: Math.min(Number(limit), 10),
      });
      return JSON.stringify({
        artists: artists.map((a) => ({
          id: a.id, nameRomanized: a.nameRomanized, nameHangul: a.nameHangul,
          roles: a.roles, primaryImageUrl: a.primaryImageUrl,
          groups: a.memberships.map((m) => m.group.name),
        })),
        count: artists.length,
      });
    } catch (error) {
      return JSON.stringify({ error: `Erro ao buscar artistas: ${error}` });
    }
  },
};

export const searchGroupsTool: ToolWithRun = {
  name: "search_groups",
  description: "Buscar grupos de K-Pop/K-Drama",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Nome do grupo" },
      limit: { type: "number", description: "Máx resultados (max 10)", default: 5 },
    },
    required: ["query"],
  },
  run: async ({ query, limit = 5 }) => {
    try {
      const groups = await prisma.musicalGroup.findMany({
        where: {
          isHidden: false,
          OR: [
            { name: { contains: query as string, mode: "insensitive" } },
            { nameHangul: { contains: query as string, mode: "insensitive" } },
          ],
        },
        select: {
          id: true, name: true, slug: true, debutDate: true,
          agency: { select: { name: true } },
          members: { select: { artist: { select: { nameRomanized: true } } }, take: 5 },
        },
        take: Math.min(Number(limit), 10),
      });
      return JSON.stringify({
        groups: groups.map((g) => ({
          id: g.id, name: g.name, slug: g.slug, debutDate: g.debutDate,
          agency: g.agency?.name ?? null,
          memberCount: g.members.length,
          members: g.members.map((m) => m.artist.nameRomanized),
        })),
        count: groups.length,
      });
    } catch (error) {
      return JSON.stringify({ error: `Erro ao buscar grupos: ${error}` });
    }
  },
};

export const searchProductionsTool: ToolWithRun = {
  name: "search_productions",
  description: "Buscar produções (dramas, filmes, álbuns)",
  input_schema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Título ou palavra-chave" },
      type: {
        type: "string",
        enum: ["ALBUM", "DRAMA", "MOVIE", "MIXTAPE"],
        description: "Filtrar por tipo",
      },
      limit: { type: "number", description: "Máx resultados (max 10)", default: 5 },
    },
    required: ["query"],
  },
  run: async ({ query, type, limit = 5 }) => {
    try {
      const productions = await prisma.production.findMany({
        where: {
          isHidden: false,
          ...(type ? { type: { equals: type as string } } : {}),
          OR: [
            { titlePt: { contains: query as string, mode: "insensitive" } },
            { titleKr: { contains: query as string, mode: "insensitive" } },
          ],
        },
        select: {
          id: true, titlePt: true, type: true, releaseDate: true, imageUrl: true,
          artists: { select: { artist: { select: { nameRomanized: true } } }, take: 3 },
        },
        take: Math.min(Number(limit), 10),
      });
      return JSON.stringify({
        productions: productions.map((p) => ({
          id: p.id, titlePt: p.titlePt, type: p.type,
          releaseDate: p.releaseDate, imageUrl: p.imageUrl,
          artists: p.artists.map((a) => a.artist.nameRomanized),
        })),
        count: productions.length,
      });
    } catch (error) {
      return JSON.stringify({ error: `Erro ao buscar produções: ${error}` });
    }
  },
};

export const getStatsTool: ToolWithRun = {
  name: "get_stats",
  description: "Use esta tool quando o usuário perguntar QUANTOS artistas, grupos, produções ou artigos existem no banco. Retorna o total exato de cada entidade sem precisar de nenhum argumento.",
  input_schema: { type: "object", properties: {}, required: [] },
  run: async () => {
    try {
      const [artists, groups, productions, posts] = await Promise.all([
        prisma.artist.count({ where: { isHidden: false, flaggedAsNonKorean: false } }),
        prisma.musicalGroup.count({ where: { isHidden: false } }),
        prisma.production.count({ where: { isHidden: false, flaggedAsNonKorean: false } }),
        prisma.blogPost.count({ where: { status: "PUBLISHED", isPrivate: false } }),
      ])
      return JSON.stringify({ artists, groups, productions, publishedPosts: posts })
    } catch (error) {
      return JSON.stringify({ error: `Erro ao buscar stats: ${error}` })
    }
  },
}

export const getGroupDetailsTool: ToolWithRun = {
  name: "get_group_details",
  description: "Obter detalhes completos de um grupo",
  input_schema: {
    type: "object",
    properties: {
      groupId: { type: "string", description: "ID do grupo" },
    },
    required: ["groupId"],
  },
  run: async ({ groupId }) => {
    try {
      const group = await prisma.musicalGroup.findUnique({
        where: { id: groupId as string },
        select: {
          id: true, name: true, nameHangul: true, slug: true,
          bio: true, debutDate: true, disbandDate: true,
          agency: { select: { name: true } },
          members: {
            select: {
              artist: { select: { nameRomanized: true, roles: true } },
              role: true, joinDate: true,
            },
            orderBy: { position: "asc" },
          },
        },
      });
      return JSON.stringify(group || { error: "Grupo não encontrado" });
    } catch (error) {
      return JSON.stringify({ error: `Erro ao buscar grupo: ${error}` });
    }
  },
};
