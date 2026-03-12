/**
 * Script modelo: reescreve um artigo importado em pt-BR editorial
 * Uso: npx tsx scripts/rewrite-article-model.ts
 */

import prisma from '../lib/prisma'

const ARTICLE_ID = 'cmmnk5j08009501p9yulehllb'

const NOVO_TITULO =
    'Byeon Woo Seok é criticado pela atuação em "Perfect Crown" — internautas comparam com controvérsia de Jisoo'

const NOVO_CONTENT_MD = `O ator Byeon Woo Seok voltou a ser alvo de críticas na internet coreana após a divulgação do teaser do novo K-Drama *Perfect Crown*, no qual contracena com IU. Um post no fórum theqoo acumulou cerca de 50 mil visualizações e mais de 900 comentários questionando a qualidade de sua atuação na prévia.

## O que os internautas estão dizendo

O principal ponto levantado foi o que descreveram como uma entrega "forçada" e "exagerada" nas cenas do teaser. Um dos comentários mais votados foi direto: *"Não é fácil já demonstrar uma atuação terrível logo no teaser."*

## O duplo padrão da crítica coreana

O debate ganhou um ângulo mais amplo quando parte dos usuários trouxe a comparação com casos anteriores de idol-atores que sofreram críticas semelhantes — entre eles Jisoo, do BLACKPINK, e Cha Eunwoo, do ASTRO. O argumento central: se idols são duramente criticados por "não serem atores de verdade", por que um ator estabelecido como Byeon Woo Seok continuaria recebendo papéis principais apesar das mesmas queixas?

## Contexto: por que esse drama tem tanta atenção

Byeon Woo Seok ficou amplamente conhecido no Brasil após o sucesso de *Lovely Runner* (2024), onde viveu o cantor Sul Hye-o ao lado de Kim Hye-yoon. *Perfect Crown* será um dos dramas mais aguardados do ano, o que amplifica a visibilidade — e a pressão — sobre sua performance.

O drama ainda não tem data de estreia confirmada. As reações ao teaser, porém, já mostram que as expectativas em torno da dupla IU e Byeon Woo Seok serão acompanhadas de perto — tanto pelos fãs quanto pelos críticos.

*Fonte: Koreaboo*`

const NOVOS_BLOCKS = [
    {
        type: 'paragraph',
        original:
            "Actor Byeon Woo Seok is facing criticism after the teaser for Perfect Crown, co-starring IU, accumulated ~50k views and 900+ comments on theqoo questioning his acting delivery.",
        translated:
            'O ator Byeon Woo Seok voltou a ser alvo de críticas na internet coreana após a divulgação do teaser do novo K-Drama *Perfect Crown*, no qual contracena com IU. Um post no fórum theqoo acumulou cerca de 50 mil visualizações e mais de 900 comentários questionando a qualidade de sua atuação na prévia.',
    },
    {
        type: 'heading',
        original: 'What netizens are saying',
        translated: 'O que os internautas estão dizendo',
    },
    {
        type: 'paragraph',
        original:
            'The main criticism was a "cheesy" and exaggerated delivery. One top comment read: "It\'s not easy to already have terrible acting starting from the teaser."',
        translated:
            'O principal ponto levantado foi o que descreveram como uma entrega "forçada" e "exagerada" nas cenas do teaser. Um dos comentários mais votados foi direto: *"Não é fácil já demonstrar uma atuação terrível logo no teaser."*',
    },
    {
        type: 'quote',
        original: "It's not easy to already have terrible acting starting from the teaser.",
        translated: 'Não é fácil já demonstrar uma atuação terrível logo no teaser.',
    },
    {
        type: 'heading',
        original: 'The double standard in Korean criticism',
        translated: 'O duplo padrão da crítica coreana',
    },
    {
        type: 'paragraph',
        original:
            "Netizens drew comparisons to idol-actors like BLACKPINK's Jisoo and ASTRO's Cha Eunwoo, arguing that despite these idols receiving criticism for not being full-time actors, established actor Byeon Woo Seok continues securing roles despite perceived acting deficiencies.",
        translated:
            'O debate ganhou um ângulo mais amplo quando parte dos usuários trouxe a comparação com casos anteriores de idol-atores que sofreram críticas semelhantes — entre eles Jisoo, do BLACKPINK, e Cha Eunwoo, do ASTRO. O argumento central: se idols são duramente criticados por "não serem atores de verdade", por que um ator estabelecido como Byeon Woo Seok continuaria recebendo papéis principais apesar das mesmas queixas?',
    },
    {
        type: 'heading',
        original: 'Context: why this drama has so much attention',
        translated: 'Contexto: por que esse drama tem tanta atenção',
    },
    {
        type: 'paragraph',
        original:
            'Byeon Woo Seok became widely known after the success of Lovely Runner (2024). Perfect Crown is one of the most anticipated dramas of the year, which amplifies visibility and pressure on his performance.',
        translated:
            'Byeon Woo Seok ficou amplamente conhecido no Brasil após o sucesso de *Lovely Runner* (2024), onde viveu o cantor Sul Hye-o ao lado de Kim Hye-yoon. *Perfect Crown* será um dos dramas mais aguardados do ano, o que amplifica a visibilidade — e a pressão — sobre sua performance.',
    },
    {
        type: 'paragraph',
        original:
            'The drama has no confirmed premiere date. The reactions to the teaser already show that the IU and Byeon Woo Seok pairing will be closely watched by both fans and critics.',
        translated:
            'O drama ainda não tem data de estreia confirmada. As reações ao teaser, porém, já mostram que as expectativas em torno da dupla IU e Byeon Woo Seok serão acompanhadas de perto — tanto pelos fãs quanto pelos críticos.',
    },
]

async function main() {
    console.log(`Atualizando artigo ${ARTICLE_ID}...`)

    const updated = await prisma.news.update({
        where: { id: ARTICLE_ID },
        data: {
            title: NOVO_TITULO,
            contentMd: NOVO_CONTENT_MD,
            blocks: NOVOS_BLOCKS,
        },
        select: { id: true, title: true },
    })

    console.log('✅ Atualizado:', updated.title)
    await prisma.$disconnect()
}

main().catch(e => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
})
