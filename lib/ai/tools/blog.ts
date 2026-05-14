/**
 * Blog-related agent tools
 */
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import prisma from "@/lib/prisma";

export const getBlogPostTool = betaZodTool({
  name: "get_blog_post",
  description: "Buscar um artigo de blog pelo slug",
  inputSchema: z.object({
    slug: z.string().describe("URL slug do artigo (ex: 'bts-anthology')"),
  }),
  run: async ({ slug }) => {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { slug },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
          category: { select: { name: true } },
        },
      });
      return post || { error: "Artigo não encontrado" };
    } catch (error) {
      return { error: `Erro ao buscar artigo: ${error}` };
    }
  },
});

export const listBlogPostsTool = betaZodTool({
  name: "list_blog_posts",
  description: "Listar artigos publicados do blog (com filtro opcional de categoria)",
  inputSchema: z.object({
    category: z.string().optional().describe("Slug da categoria"),
    limit: z.number().default(5).describe("Máx artigos a retornar (max 20)"),
    skip: z.number().default(0).describe("Offset para paginação"),
  }),
  run: async ({ category, limit, skip }) => {
    try {
      const posts = await prisma.blogPost.findMany({
        where: {
          published: true,
          isHidden: false,
          category: category ? { slug: category } : undefined,
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          category: { select: { name: true, slug: true } },
          publishedAt: true,
        },
        orderBy: { publishedAt: "desc" },
        take: Math.min(limit, 20),
        skip,
      });
      return { posts, total: posts.length };
    } catch (error) {
      return { error: `Erro ao listar artigos: ${error}` };
    }
  },
});

export const createDraftBlogTool = betaZodTool({
  name: "create_draft_blog",
  description: "Criar um rascunho de artigo (não publicado)",
  inputSchema: z.object({
    title: z.string().describe("Título do artigo"),
    excerpt: z.string().describe("Resumo/descrição curta"),
    slug: z
      .string()
      .describe("URL slug (ex: 'bts-new-album-2024')"),
    categoryId: z.string().optional().describe("ID da categoria"),
  }),
  run: async ({ title, excerpt, slug, categoryId }) => {
    try {
      const post = await prisma.blogPost.create({
        data: {
          title,
          excerpt,
          slug,
          content: [], // BlogBlock[] vazio — será preenchido depois
          published: false,
          categoryId: categoryId || undefined,
        },
        select: { id: true, slug: true, title: true, published: true },
      });
      return { ...post, status: "draft" };
    } catch (error) {
      return { error: `Erro ao criar rascunho: ${error}` };
    }
  },
});

export const updateBlogDraftTool = betaZodTool({
  name: "update_blog_draft",
  description: "Atualizar conteúdo de um rascunho de artigo",
  inputSchema: z.object({
    postId: z.string().describe("ID do post"),
    title: z.string().optional(),
    excerpt: z.string().optional(),
    content: z.array(z.record(z.unknown())).optional().describe("BlogBlock[] JSON"),
  }),
  run: async ({ postId, title, excerpt, content }) => {
    try {
      const updated = await prisma.blogPost.update({
        where: { id: postId },
        data: {
          ...(title && { title }),
          ...(excerpt && { excerpt }),
          ...(content && { content: content as any }),
        },
        select: { id: true, slug: true, title: true, published: true },
      });
      return updated;
    } catch (error) {
      return { error: `Erro ao atualizar rascunho: ${error}` };
    }
  },
});
