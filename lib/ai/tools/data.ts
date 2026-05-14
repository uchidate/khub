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
    limit: z.number().default(5).max(10),
  }),
  run: async ({ query, limit }) => {
    if (query.length < 2) {
      return { error: "Query muito curta (mín 2 caracteres)" };
    }
    try {
      const artists = await prisma.artist.findMany({
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
          nameHangul: true,
          role: true,
          profileImageUrl: true,
          groups: {
            select: { group: { select: { name: true } } },
            take: 2,
          },
        },
        take: limit,
      });
      return {
        artists: artists.map((a) => ({
          ...a,
          groups: a.groups.map((g) => g.group.name),
        })),
        count: artists.length,
      };
    } catch (error) {
      return { error: `Erro ao buscar artistas: ${error}` };
    }
  },
});

export const searchGroupsTool = betaZodTool({
  name: "search_groups",
  description: "Buscar grupos de K-Pop/K-Drama",
  inputSchema: z.object({
    query: z.string().describe("Nome do grupo"),
    limit: z.number().default(5).max(10),
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
            select: { artist: { select: { name: true } } },
            take: 5,
          },
        },
        take: limit,
      });
      return {
        groups: groups.map((g) => ({
          ...g,
          memberCount: g.members.length,
          members: g.members.map((m) => m.artist.name),
        })),
        count: groups.length,
      };
    } catch (error) {
      return { error: `Erro ao buscar grupos: ${error}` };
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
    limit: z.number().default(5).max(10),
  }),
  run: async ({ query, type, limit }) => {
    try {
      const productions = await prisma.production.findMany({
        where: {
          isHidden: false,
          type: type ? { equals: type } : undefined,
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          title: true,
          type: true,
          releaseDate: true,
          posterUrl: true,
          groups: {
            select: { group: { select: { name: true } } },
            take: 3,
          },
        },
        take: limit,
      });
      return {
        productions: productions.map((p) => ({
          ...p,
          groups: p.groups.map((g) => g.group.name),
        })),
        count: productions.length,
      };
    } catch (error) {
      return { error: `Erro ao buscar produções: ${error}` };
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
              artist: { select: { name: true, role: true } },
              role: true,
              joinDate: true,
            },
            orderBy: { position: "asc" },
          },
        },
      });
      return group || { error: "Grupo não encontrado" };
    } catch (error) {
      return { error: `Erro ao buscar grupo: ${error}` };
    }
  },
});
