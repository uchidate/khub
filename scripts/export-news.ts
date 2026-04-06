import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const news = await prisma.news.findUnique({
    where: { id: 'cmnf8slqb00f501o4rir3ait7' },
    include: {
      artists: {
        include: {
          artist: { select: { id: true, nameRomanized: true, primaryImageUrl: true } },
        },
      },
    },
  });
  console.log(JSON.stringify(news, null, 2));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); prisma.$disconnect(); });
