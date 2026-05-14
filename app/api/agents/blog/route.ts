/**
 * POST /api/agents/blog
 * Endpoint para executar o blog agent
 */
import { NextRequest, NextResponse } from "next/server";
import { runBlogAgent } from "@/lib/ai/agents/blog";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query inválida ou ausente" },
        { status: 400 }
      );
    }

    if (query.trim().length < 3) {
      return NextResponse.json(
        { error: "Query muito curta (mín 3 caracteres)" },
        { status: 400 }
      );
    }

    // Executar agente
    const response = await runBlogAgent(query);

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Agent API Error]", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao executar agente",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agents/blog
 * Health check + info do agente
 */
export async function GET() {
  return NextResponse.json({
    agent: "blog",
    status: "active",
    version: "1.0.0",
    provider: process.env.AGENT_PROVIDER ?? "anthropic",
    capabilities: [
      "search_artists",
      "search_groups",
      "search_productions",
      "get_blog_post",
      "list_blog_posts",
      "create_draft_blog",
      "update_blog_draft",
    ],
    usage: "POST /api/agents/blog with { query: string }",
  });
}
