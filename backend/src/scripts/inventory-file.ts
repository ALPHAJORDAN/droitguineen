import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.texte.findMany({
    include: {
      _count: {
        select: { articles: true }
      }
    }
  });

  const inventory = result.map(t => ({
    id: t.id,
    titre: t.titre,
    nature: t.nature,
    articlesCount: t._count.articles
  }));

  fs.writeFileSync('inventory.json', JSON.stringify(inventory, null, 2));
  console.log('Inventory written to inventory.json');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
