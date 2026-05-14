/**
 * Data search agent tools (artists, groups, productions)
 */
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const searchArtistsTool = betaZodTool({
  name: "search_artists",
  description: "Buscar artistas por nome ou informação relacionada",
  inputSchema: z.object({
    query: z.string().describe("Nome ou palavra-chave (min 2 caracteres)"),
    limit: z.number().max(10).default(5),
  }),
  run: async ({ query, limit }) => {
    if (query.length < 2) {
      return JSON.stringify({ error: "Query muito curta (mín 2 caracteres)" });
    }
    try {
      const artists = await prisma.artist.findMany({
        where: {
          isHidden: false,
          OR: [
            { nameRomanized: { contains: query, mode: "insensitive" } },
            { nameHangul: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          nameRomanized: true,
          nameHangul: true,
          roles: true,
          primaryImageUrl: true,
          memberships: {
            select: { group: { select: { name: true } } },
            take: 2,
          },
        },
        take: limit,
      });
      return JSON.stringify({
        artists: artists.map((a) => ({
          id: a.id,
          nameRomanized: a.nameRomanized,
          nameHangul: a.nameHangul,
          roles: a.roles,
          primaryImageUrl: a.primaryImageUrl,
          groups: a.memberships.map((m) => m.group.name),
        })),
        count: artists.length,
      });
    } catch (error) {
      return JSON.stringify({ error: `Erro ao buscar artistas: ${error}` });
    }
  },
});

export const searchGroupsTool = betaZodTool({
  name: "search_groups",
  description: "Buscar grupos de K-Pop/K-Drama",
  inputSchema: z.object({
    query: z.string().describe("Nome do grupo"),
    limit: z.number().max(10).default(5),
  }),
  run: async ({ query, limit }) => {
    try {
      const groups = await prisma.musicalGroup.findMany({
        where: {
          isHidden: false,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { nameHangul: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          debutDate: true,
          agency: { select: { name: true } },
          members: {
            select: { artist: { select: { nameRomanized: true } } },
            take: 5,
          },
        },
        take: limit,
      });
      return JSON.stringify({
        groups: groups.map((g) => ({
          id: g.id,
          name: g.name,
          slug: g.slug,
          debutDate: g.debutDate,
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
});

export const searchProductionsTool = betaZodTool({
  name: "search_productions",
  description: "Buscar produções (álbuns, dramas, filmes)",
  inputSchema: z.object({
    query: z.string().describe("Título ou palavra-chave"),
    type: z
      .enum(["ALBUM", "DRAMA", "MOVIE", "MIXTAPE"])
      .optional()
      .describe("Filtrar por tipo"),
    limit: z.number().max(10).default(5),
  }),
  run: async ({ query, type, limit }) => {
    try {
      const productions = await prisma.production.findMany({
        where: {
          isHidden: false,
          type: type ? { equals: type } : undefined,
          OR: [
            { titlePt: { contains: query, mode: "insensitive" } },
            { titleKr: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          titlePt: true,
          type: true,
          releaseDate: true,
          imageUrl: true,
          artists: {
            select: { artist: { select: { nameRomanized: true } } },
            take: 3,
          },
        },
        take: limit,
      });
      return JSON.stringify({
        productions: productions.map((p) => ({
          id: p.id,
          titlePt: p.titlePt,
          type: p.type,
          releaseDate: p.releaseDate,
          imageUrl: p.imageUrl,
          artists: p.artists.map((a) => a.artist.nameRomanized),
        })),
        count: productions.length,
      });
    } catch (error) {
      return JSON.stringify({ error: `Erro ao buscar produções: ${error}` });
    }
  },
});

export const getGroupDetailsTool = betaZodTool({
  name: "get_group_details",
  description: "Obter detalhes completos de um grupo",
  inputSchema: z.object({
    groupId: z.string().describe("ID do grupo"),
  }),
  run: async ({ groupId }) => {
    try {
      const group = await prisma.musicalGroup.findUnique({
        where: { id: groupId },
        select: {
          id: true,
          name: true,
          nameHangul: true,
          slug: true,
          bio: true,
          debutDate: true,
          disbandDate: true,
          agency: { select: { name: true } },
          members: {
            select: {
              artist: { select: { nameRomanized: true, roles: true } },
              role: true,
              joinDate: true,
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
});
