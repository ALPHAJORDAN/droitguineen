import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- DETAILED CLEANUP START ---');

  // 1. Delete all Code civil entries with 0 articles
  const deletedCount = await prisma.texte.deleteMany({
    where: {
      titre: { contains: 'Code civil' },
      articles: { none: {} }
    }
  });
  console.log(`Deleted ${deletedCount.count} empty 'Code civil' records.`);

  // 2. Update the one with 1656 articles
  const correctId = '1c76e006-a3ba-44c5-bef2-a0f547e7cc6b';
  const updatedDoc = await prisma.texte.update({
    where: { id: correctId },
    data: {
      titre: 'Code civil de la République de Guinée',
      nature: 'CODE',
      etat: 'VIGUEUR'
    }
  });
  console.log(`Updated document ${correctId}: Title='${updatedDoc.titre}', Nature='${updatedDoc.nature}'`);

  // 3. Verify final state
  const finalDocs = await prisma.texte.findMany({
    select: { id: true, titre: true, _count: { select: { articles: true } } }
  });
  console.log('Final Database State:');
  finalDocs.forEach(d => console.log(`- ${d.id}: ${d.titre} (${d._count.articles} articles)`));

  console.log('--- DETAILED CLEANUP END ---');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
