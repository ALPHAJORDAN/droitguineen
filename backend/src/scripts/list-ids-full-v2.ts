import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.texte.findMany({
    select: { id: true, titre: true }
  });
  
  console.log("FETCH_ALL_DATA_START");
  for (const t of result) {
      console.log(`[TITLE]: ${t.titre}`);
      console.log(`[ID]: ${t.id}`);
      console.log('---');
  }
  console.log("FETCH_ALL_DATA_END");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
