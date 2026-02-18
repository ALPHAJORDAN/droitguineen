import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.texte.findMany({
    include: {
      _count: {
        select: { articles: true }
      }
    }
  });

  console.log('DB_DOCS_INVENTORY_START');
  result.forEach((t) => {
    console.log(`[ID]: ${t.id}`);
    console.log(`[TITLE]: ${t.titre || 'NULL'}`);
    console.log(`[ART_COUNT]: ${t._count.articles}`);
    console.log('---');
  });
  console.log('DB_DOCS_INVENTORY_END');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
