import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const enrichedBlocks = [
  { note: 'O grupo feminino de K-pop mais influente e seguido da história', type: 'blog_group_card', groupId: 'cmlsfiovx000e01pobuc23iit' },
  { text: 'De Volta ao Topo', type: 'blog_heading', level: 2 },
  { text: 'Jisoo, Jennie, Rosé e Lisa. Quatro nomes que sozinhos já causariam euforia em qualquer fã de K-pop. Juntas, como BLACKPINK, são o grupo feminino mais seguido da história da música — com mais de 90 milhões de seguidores no Instagram do grupo e recordes que resistem ao tempo. Desde o debut em 2016 pela YG Entertainment, o BLACKPINK redefiniu o que um grupo de K-pop feminino pode ser: presença internacional, estética inconfundível, colaborações com artistas ocidentais e um fandom, os Blinks, entre os mais apaixonados do mundo. Em 27 de fevereiro de 2026, o grupo confirmou o retorno com o álbum DEADLINE — o lançamento mais esperado do K-pop feminino dos últimos anos.', type: 'blog_paragraph' },
  {
    type: 'blog_stats_row',
    items: [
      { emoji: '🗓️', label: 'Debut', value: '8 de agosto de 2016' },
      { emoji: '👥', label: 'Integrantes', value: '4 (Jisoo, Jennie, Rosé, Lisa)' },
      { emoji: '📀', label: 'Álbum', value: 'DEADLINE — 27 fev 2026' },
      { emoji: '📱', label: 'Seguidores', value: '+90 milhões no Instagram' },
      { emoji: '🏆', label: 'Fandom', value: 'Blinks' },
      { emoji: '🏠', label: 'Gravadora', value: 'YG Entertainment' },
    ],
  },
  { type: 'blog_image', url: 'https://image.tmdb.org/t/p/original/1aBRILIlhTTmgbLW7x8X2lf5lxG.jpg', caption: 'BLACKPINK marca comeback histórico em 2026 com o álbum DEADLINE' },
  { text: 'A Era Solo: Cada Uma Voou por Conta Própria', type: 'blog_heading', level: 2 },
  { text: 'Entre 2022 e 2025, o BLACKPINK viveu um período intenso de projetos solo que provou a versatilidade de cada integrante. Jennie lançou seu aguardado álbum solo e consolidou-se como ícone da moda global, desfilando pelas maiores semanas de moda do mundo. Rosé assinou com uma gravadora internacional e lançou músicas que bombaram nas paradas ocidentais. Lisa dominou as plataformas com seu pop eletrônico e conquistou palcos na Europa e nos EUA. Jisoo estreou em K-dramas com sucesso de crítica e público, revelando um lado atriz que os fãs mal conheciam. Cada uma deu um passo gigante — e quando se reencontraram, a química estava mais forte do que nunca.', type: 'blog_paragraph' },
  { type: 'blog_quote', text: 'Quando estamos juntas no palco, é uma energia completamente diferente. Cada uma de nós cresceu muito nos anos solo — e agora trazemos tudo isso de volta para o BLACKPINK.', author: 'Jennie, sobre o comeback com DEADLINE' },
  { type: 'blog_callout', text: 'Os anos solo não fragmentaram o BLACKPINK — fortaleceram cada integrante individualmente e tornaram o retorno ainda mais poderoso. DEADLINE é o resultado de quatro artistas completas que escolheram, conscientemente, voltar como grupo.' },
  { text: 'As Quatro Que Formam o BLACKPINK', type: 'blog_heading', level: 2 },
  { note: 'Vocalista principal, atriz e o visual do grupo — estreou em K-dramas com sucesso', type: 'blog_artist_card', artistId: 'cmlrad2ia001d01kwcy5djwkl' },
  { note: 'Rapper, cantora e ícone da moda global — rosto de marcas como Chanel e Calvin Klein', type: 'blog_artist_card', artistId: 'cmlgbmx60000211urjam8me9o' },
  { note: 'Vocalista com voz única, assinou com gravadora ocidental e explodiu no pop internacional', type: 'blog_artist_card', artistId: 'cmlrad2wb001e01kwqgl7oj6u' },
  { note: 'Rapper e dançarina tailandesa que conquistou o mundo com talento e carisma únicos', type: 'blog_artist_card', artistId: 'cmlrad3bj001f01kwngatitph' },
  { type: 'blog_highlight', text: 'Juntas, Jisoo, Jennie, Rosé e Lisa acumulam mais de 300 milhões de seguidores nas redes sociais — individualmente. Como grupo, são uma força sem precedentes no entretenimento global.' },
  { text: 'O Comeback do DEADLINE', type: 'blog_heading', level: 2 },
  { text: 'O comeback chegou — e foi épico. Com DEADLINE, lançado em 27 de fevereiro de 2026, o BLACKPINK voltou com força total: um álbum que mistura a energia característica do grupo com uma maturidade sonora conquistada nos anos de projetos solos. Os Blinks receberam o retorno com recordes de pré-saves, streams nas primeiras horas e trending mundial em todas as plataformas. A turnê que acompanha o álbum promete ser a maior da história do grupo — e os shows no Brasil já estão entre os mais aguardados. O BLACKPINK não apenas voltou: voltou para provar que ainda define o K-pop feminino.', type: 'blog_paragraph' },
  { type: 'blog_curiosity', text: 'DEADLINE bateu o recorde de maior número de pré-saves de um álbum de K-pop feminino em menos de 48 horas após o anúncio oficial, superando a própria marca do BLACKPINK com o álbum BORN PINK de 2022.' },
  { type: 'blog_quote', text: 'Nós somos o BLACKPINK e sempre seremos o BLACKPINK. Obrigada por esperarem por nós, Blinks.', author: 'Lisa, na live de anúncio do DEADLINE' },
  { note: 'A turnê Born Pink levada ao cinema — a maior turnê da história do K-pop feminino', type: 'blog_production_card', productionId: 'cmm18sl7k002x2xntbjnukzlo' },
]

await prisma.blogPost.update({
  where: { id: 'cmn4rp1d30000u3n2wx9b6pd4' },
  data: { blocks: enrichedBlocks },
  select: { slug: true },
}).then(r => { console.log('✓ updated:', r.slug) })
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
