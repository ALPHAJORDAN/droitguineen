import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.texte.findMany({
    select: { id: true, titre: true }
  });
  
  console.log("FULL_DATABASE_TEXTE_LIST:");
  result.forEach(t => {
    console.log(`ID: [${t.id}] TITLE: [${t.titre}]`);
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
