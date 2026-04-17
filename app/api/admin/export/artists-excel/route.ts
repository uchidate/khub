import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import ExcelJS from 'exceljs'

export const dynamic = 'force-dynamic'

export async function GET() {
    const artists = await prisma.artist.findMany({
        where: { isHidden: false, flaggedAsNonKorean: false },
        select: {
            id:               true,
            nameRomanized:    true,
            nameHangul:       true,
            birthDate:        true,
            bio:              true,
            analiseEditorial: true,
            curiosidades:     true,
        },
        orderBy: { nameRomanized: 'asc' },
    })

    // Parse analiseEditorial sections: **Title**\nContent
    function parseSection(text: string | null, sectionName: string): string {
        if (!text) return ''
        const pattern = /\*\*([^*\n]{1,50})\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/g
        let m: RegExpExecArray | null
        while ((m = pattern.exec(text)) !== null) {
            if (m[1].trim().toLowerCase() === sectionName.toLowerCase()) {
                return m[2].trim()
            }
        }
        return ''
    }

    const rows = artists.map(a => ({
        ID:             a.id,
        Nome:           a.nameRomanized,
        'Nome Hangul':  a.nameHangul ?? '',
        'Data Nasc.':   a.birthDate ? a.birthDate.toISOString().slice(0, 10) : '',
        Bio:            a.bio ?? '',
        Projetos:       parseSection(a.analiseEditorial, 'Projetos'),
        Reconhecimentos: parseSection(a.analiseEditorial, 'Reconhecimentos'),
        'Análise Editorial (completo)': a.analiseEditorial ?? '',
        Curiosidades:   (a.curiosidades ?? []).join('\n'),
    }))

    const wb = new ExcelJS.Workbook()
    const ws = wb.addWorksheet('Artistas')

    ws.columns = [
        { header: 'ID',                           key: 'ID',                           width: 30 },
        { header: 'Nome',                         key: 'Nome',                         width: 30 },
        { header: 'Nome Hangul',                  key: 'Nome Hangul',                  width: 25 },
        { header: 'Data Nasc.',                   key: 'Data Nasc.',                   width: 12 },
        { header: 'Bio',                          key: 'Bio',                          width: 60 },
        { header: 'Projetos',                     key: 'Projetos',                     width: 70 },
        { header: 'Reconhecimentos',              key: 'Reconhecimentos',              width: 70 },
        { header: 'Análise Editorial (completo)', key: 'Análise Editorial (completo)', width: 80 },
        { header: 'Curiosidades',                 key: 'Curiosidades',                 width: 80 },
    ]

    ws.addRows(rows)

    const buf = await wb.xlsx.writeBuffer()

    const today = new Date().toISOString().slice(0, 10)
    return new NextResponse(buf as ArrayBuffer, {
        headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="artistas-${today}.xlsx"`,
        },
    })
}
