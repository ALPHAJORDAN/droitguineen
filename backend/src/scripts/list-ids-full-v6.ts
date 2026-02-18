import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.texte.findMany({
    select: { id: true, titre: true }
  });
  
  console.log("MARKER_START");
  result.forEach(t => {
    console.log(`TITLE: ${t.titre}`);
    console.log(`ID_START|${t.id}|ID_END`);
    console.log("--------------------------------------------------");
  });
  console.log("MARKER_END");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
