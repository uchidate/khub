/**
 * Blog-related agent tools
 */
import type { Tool } from "@anthropic-ai/sdk/resources";
import prisma from "@/lib/prisma";

type ToolWithRun = Tool & { run: (input: Record<string, unknown>) => Promise<string> }

export const getBlogPostTool: ToolWithRun = {
  name: "get_blog_post",
  description: "Buscar um artigo de blog pelo slug",
  input_schema: {
    type: "object",
    properties: {
      slug: { type: "string", description: "URL slug do artigo (ex: 'bts-anthology')" },
    },
    required: ["slug"],
  },
  run: async ({ slug }) => {
    try {
      const post = await prisma.blogPost.findUnique({
        where: { slug: slug as string },
        select: {
          id: true, title: true, slug: true, excerpt: true,
          publishedAt: true, status: true,
          category: { select: { name: true } },
        },
      });
      return JSON.stringify(post || { error: "Artigo não encontrado" });
    } catch (error) {
      return JSON.stringify({ error: `Erro ao buscar artigo: ${error}` });
    }
  },
};

export const listBlogPostsTool: ToolWithRun = {
  name: "list_blog_posts",
  description: "Listar artigos publicados do blog (com filtro opcional de categoria)",
  input_schema: {
    type: "object",
    properties: {
      category: { type: "string", description: "Slug da categoria" },
      limit: { type: "number", description: "Máx artigos a retornar (max 20)", default: 5 },
      skip: { type: "number", description: "Offset para paginação", default: 0 },
    },
    required: [],
  },
  run: async ({ category, limit = 5, skip = 0 }) => {
    try {
      const posts = await prisma.blogPost.findMany({
        where: {
          status: "PUBLISHED",
          isPrivate: false,
          category: category ? { slug: category as string } : undefined,
        },
        select: {
          id: true, title: true, slug: true, excerpt: true,
          category: { select: { name: true, slug: true } },
          publishedAt: true,
        },
        orderBy: { publishedAt: "desc" },
        take: Math.min(Number(limit), 20),
        skip: Number(skip),
      });
      return JSON.stringify({ posts, total: posts.length });
    } catch (error) {
      return JSON.stringify({ error: `Erro ao listar artigos: ${error}` });
    }
  },
};

export const createDraftBlogTool: ToolWithRun = {
  name: "create_draft_blog",
  description: "Criar um rascunho de artigo (não publicado)",
  input_schema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Título do artigo" },
      excerpt: { type: "string", description: "Resumo/descrição curta" },
      slug: { type: "string", description: "URL slug (ex: 'bts-new-album-2024')" },
      authorId: { type: "string", description: "ID do usuário autor" },
      categoryId: { type: "string", description: "ID da categoria" },
    },
    required: ["title", "excerpt", "slug", "authorId"],
  },
  run: async ({ title, excerpt, slug, authorId, categoryId }) => {
    try {
      const post = await prisma.blogPost.create({
        data: {
          title: title as string,
          excerpt: excerpt as string,
          slug: slug as string,
          contentMd: "",
          status: "DRAFT",
          authorId: authorId as string,
          categoryId: (categoryId as string) || undefined,
        },
        select: { id: true, slug: true, title: true, status: true },
      });
      return JSON.stringify(post);
    } catch (error) {
      return JSON.stringify({ error: `Erro ao criar rascunho: ${error}` });
    }
  },
};

export const updateBlogDraftTool: ToolWithRun = {
  name: "update_blog_draft",
  description: "Atualizar conteúdo de um rascunho de artigo",
  input_schema: {
    type: "object",
    properties: {
      postId: { type: "string", description: "ID do post" },
      title: { type: "string" },
      excerpt: { type: "string" },
      contentMd: { type: "string", description: "Conteúdo markdown do artigo" },
    },
    required: ["postId"],
  },
  run: async ({ postId, title, excerpt, contentMd }) => {
    try {
      const updated = await prisma.blogPost.update({
        where: { id: postId as string },
        data: {
          ...(title ? { title: title as string } : {}),
          ...(excerpt ? { excerpt: excerpt as string } : {}),
          ...(contentMd !== undefined ? { contentMd: contentMd as string } : {}),
        },
        select: { id: true, slug: true, title: true, status: true },
      });
      return JSON.stringify(updated);
    } catch (error) {
      return JSON.stringify({ error: `Erro ao atualizar rascunho: ${error}` });
    }
  },
};
