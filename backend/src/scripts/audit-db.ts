import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.texte.findMany({
    select: {
      id: true,
      titre: true,
      nature: true,
      createdAt: true,
      _count: {
        select: {
          articles: true,
          sections: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log('--- DB AUDIT START ---');
  result.forEach((t) => {
    console.log(`[ID]: ${t.id}`);
    console.log(`[TITLE]: ${t.titre || 'NO_TITLE'}`);
    console.log(`[ARTICLES]: ${t._count.articles}`);
    console.log(`[SECTIONS]: ${t._count.sections}`);
    console.log(`[CREATED]: ${t.createdAt}`);
    console.log('------------------------');
  });
  console.log('--- DB AUDIT END ---');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
