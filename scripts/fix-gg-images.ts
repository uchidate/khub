import 'dotenv/config';
import prisma from '../lib/prisma';

const ARTICLE_ID = 'cmngnibgt0000gen2kmfr0ymg';
const COVER_URL = 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Girls_Generation_in_BKK.jpg';

const IMG_FIXES: Record<string, { url: string; alt: string; caption: string }> = {
  img01: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Girls%27_Generation_in_2010_%282%29.jpg',
    alt: "Girls' Generation (SNSD) — as nove integrantes em performance",
    caption: "Girls' Generation em performance em 2010 — das nove integrantes originais ao status de ícones do K-pop. Crédito: Wikimedia Commons"
  },
  img02: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/4/40/Girls%27_Generation_in_2010_Golden_Disk_Awards.jpg',
    alt: "Girls' Generation no Golden Disk Awards 2010",
    caption: "A era Gee consolidou o K-pop como fenômeno de arena — as integrantes no Golden Disk Awards 2010. Crédito: Wikimedia Commons"
  },
  img03: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/SNSD_at_LG_Cinema_3D_World_Festival_%284%29.jpg',
    alt: "Girls' Generation performando The Boys no LG Cinema 3D World Festival 2012",
    caption: "I Got a Boy foi o primeiro K-pop a vencer na categoria Video do Ano no YouTube Music Awards — era de expansão global. Crédito: Wikimedia Commons"
  },
  img04: {
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Girls%27_Generation_at_DMC_Festival_2015_MBC_Radio_DJ_Concert_02.jpg',
    alt: "Girls' Generation no DMC Festival 2015 MBC Radio DJ Concert",
    caption: "As integrantes das Girls' Generation tornaram-se embaixadoras do K-pop global — era Lion Heart 2015. Crédito: Wikimedia Commons"
  }
};

async function fix() {
  const post = await prisma.blogPost.findUnique({ where: { id: ARTICLE_ID }, select: { blocks: true } });
  if (post === null) { console.error('Artigo não encontrado'); return; }

  const blocks = (post.blocks as any[]).map(b => {
    if (b.type === 'blog_image' && IMG_FIXES[b.id]) {
      const fixData = IMG_FIXES[b.id];
      return { ...b, url: fixData.url, alt: fixData.alt, caption: fixData.caption };
    }
    return b;
  });

  await prisma.blogPost.update({
    where: { id: ARTICLE_ID },
    data: { blocks, coverImageUrl: COVER_URL }
  });

  console.log('Atualizado com sucesso!');
  console.log('- coverImageUrl:', COVER_URL);
  console.log('- img02, img03, img04 corrigidos com fotos reais das SNSD');
}

fix().finally(() => prisma.$disconnect());
