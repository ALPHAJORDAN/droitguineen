import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Rename the correctly processed document
  const correctDoc = await prisma.texte.findFirst({
    where: { titre: 'Test Loi Upload' }
  });

  if (correctDoc) {
    await prisma.texte.update({
      where: { id: correctDoc.id },
      data: { titre: 'Code civil de la République de Guinée' }
    });
    console.log(`Renamed [${correctDoc.id}] to 'Code civil de la République de Guinée'`);
  } else {
    console.log("Could not find 'Test Loi Upload'");
  }

  // 2. Clear out the empty placeholders to avoid confusion
  const emptyDocs = await prisma.texte.findMany({
    where: {
      articles: { none: {} },
      sections: { none: {} }
    }
  });

  for (const doc of emptyDocs) {
    // Only delete if it's one of the "Code civil" placeholders or has no title
    if (!doc.titre || doc.titre.includes('Code civil')) {
      await prisma.texte.delete({ where: { id: doc.id } });
      console.log(`Deleted empty/redundant record: ${doc.id} (${doc.titre})`);
    } else {
        console.log(`Keeping non-Code civil empty record: ${doc.id} (${doc.titre})`);
    }
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
