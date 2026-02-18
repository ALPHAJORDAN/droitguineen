import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.texte.findMany({
    select: { id: true, titre: true }
  });
  
  console.log("X_X_START_X_X");
  result.forEach(t => {
    console.log(`X_ID_${t.id}_ID_X | ${t.titre}`);
  });
  console.log("X_X_END_X_X");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
