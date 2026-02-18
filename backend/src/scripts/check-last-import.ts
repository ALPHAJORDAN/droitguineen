import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const allTextes = await prisma.texte.findMany({
    select: { id: true, titre: true }
  });
  
  console.log("LAW_IDS_START");
  allTextes.forEach(t => {
    console.log(`${t.id} | ${t.titre}`);
  });
  console.log("LAW_IDS_END");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
