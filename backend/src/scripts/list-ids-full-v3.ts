import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.texte.findMany({
    include: {
        _count: {
            select: { articles: true, sections: true }
        }
    }
  });
  
  console.log("INSPECTION_LIST_START");
  for (const t of result) {
      console.log(`[TITLE]: ${t.titre}`);
      console.log(`[ID]: ${t.id}`);
      console.log(`[ART_COUNT]: ${t._count.articles}`);
      console.log(`[SEC_COUNT]: ${t._count.sections}`);
      console.log('---');
  }
  console.log("INSPECTION_LIST_END");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
