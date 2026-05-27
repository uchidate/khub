import { NextRequest, NextResponse } from "next/server"

import { auth } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"
import path from "path"

export const dynamic = "force-dynamic"

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "blog")
const MAX_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

export async function POST(request: NextRequest) {
    const session = await auth()
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    try {
        const form = await request.formData()
        const file = form.get("file") as File | null
        if (!file) return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: "Formato não permitido. Use JPG, PNG, WebP ou GIF." }, { status: 400 })
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: "Arquivo muito grande. Máximo 10MB." }, { status: 400 })
        }

        if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true })

        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg"
        const filename = `cover-${Date.now()}.${ext}`
        const buffer = Buffer.from(await file.arrayBuffer())
        await writeFile(path.join(UPLOAD_DIR, filename), buffer)

        return NextResponse.json({ url: `/api/uploads/blog/${filename}` })
    } catch (error) {
        return NextResponse.json({ error: `Erro no upload: ${error}` }, { status: 500 })
    }
}
