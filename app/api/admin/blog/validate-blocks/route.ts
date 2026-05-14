import { NextRequest, NextResponse } from "next/server"

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "qwen2.5:3b"

const VALID_TYPES = [
    "blog_paragraph", "blog_heading", "blog_image", "blog_quote",
    "blog_curiosity", "blog_list", "blog_rating", "production_card",
    "artist_card", "stats_row", "embed",
]

const REQUIRED_FIELDS: Record<string, string[]> = {
    blog_paragraph: ["text"],
    blog_heading:   ["text"],
    blog_image:     ["url", "alt"],
    blog_quote:     ["text"],
    blog_curiosity: ["text"],
    blog_list:      ["items"],
    blog_rating:    ["score"],
    production_card:["productionId"],
    artist_card:    ["artistId"],
    stats_row:      ["stats"],
    embed:          ["url"],
}

interface ValidationIssue { block: number; type: string; message: string }

function validateBlocks(blocks: unknown[]): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    blocks.forEach((block, i) => {
        if (typeof block !== "object" || block === null) {
            issues.push({ block: i, type: "estrutura", message: "Bloco não é um objeto válido" })
            return
        }
        const b = block as Record<string, unknown>
        if (!b.type || typeof b.type !== "string") {
            issues.push({ block: i, type: "tipo", message: "Campo 'type' ausente ou inválido" })
            return
        }
        if (!VALID_TYPES.includes(b.type)) {
            issues.push({ block: i, type: "tipo", message: `Tipo '${b.type}' desconhecido` })
            return
        }
        const required = REQUIRED_FIELDS[b.type] ?? []
        for (const field of required) {
            if (!(field in b) || b[field] === null || b[field] === undefined || b[field] === "") {
                issues.push({ block: i, type: "campo", message: `Campo obrigatório '${field}' ausente no bloco ${b.type}` })
            }
        }
        if (b.type === "blog_curiosity" && Array.isArray(b.text)) {
            issues.push({ block: i, type: "campo", message: "blog_curiosity deve ter 'text' como string, não array" })
        }
        if (b.type === "blog_list" && !Array.isArray(b.items)) {
            issues.push({ block: i, type: "campo", message: "blog_list deve ter 'items' como array" })
        }
        if (b.type === "blog_rating") {
            const score = Number(b.score)
            if (isNaN(score) || score < 0 || score > 10) {
                issues.push({ block: i, type: "valor", message: "blog_rating 'score' deve ser número entre 0 e 10" })
            }
        }
    })
    return issues
}

async function getOllamaSuggestions(blocks: unknown[], issues: ValidationIssue[]): Promise<string> {
    try {
        const prompt = `Você é um validador de artigos de blog de K-Pop. Analise esses blocos e os problemas encontrados. Dê sugestões curtas e práticas em português para corrigir. Seja direto.

Blocos (resumo): ${blocks.length} blocos — tipos: ${[...new Set((blocks as Record<string,unknown>[]).map(b => b.type))].join(", ")}

Problemas encontrados:
${issues.length === 0 ? "Nenhum problema estrutural." : issues.map(i => `- Bloco ${i.block} (${i.type}): ${i.message}`).join("\n")}

Avalie também: o artigo tem introdução? Tem pelo menos um heading? O conteúdo parece completo para um artigo de blog profissional?

Responda em no máximo 5 linhas.`

        const res = await fetch(`${OLLAMA_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                messages: [{ role: "user", content: prompt }],
                max_tokens: 300,
            }),
        })
        if (!res.ok) return ""
        const data = await res.json()
        return data.choices?.[0]?.message?.content ?? ""
    } catch {
        return ""
    }
}

export async function POST(request: NextRequest) {
    try {
        const { blocks } = await request.json()
        if (!Array.isArray(blocks)) {
            return NextResponse.json({ error: "Campo 'blocks' deve ser um array" }, { status: 400 })
        }

        const issues = validateBlocks(blocks)
        const suggestions = await getOllamaSuggestions(blocks, issues)

        return NextResponse.json({
            valid: issues.length === 0,
            blockCount: blocks.length,
            issues,
            suggestions,
            summary: {
                types: (blocks as Record<string, unknown>[]).reduce<Record<string, number>>((acc, b) => {
                    const t = String((b as Record<string,unknown>).type ?? "unknown")
                    acc[t] = (acc[t] ?? 0) + 1
                    return acc
                }, {}),
            },
        })
    } catch (error) {
        return NextResponse.json({ error: `Erro na validação: ${error}` }, { status: 500 })
    }
}
