import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.texte.findMany({
    select: { id: true, titre: true }
  });
  
  console.log("FINAL_ID_LIST_START");
  result.forEach(t => {
    console.log(`[TITLE]: ${t.titre}`);
    console.log(`[ID]: ${t.id}`);
    console.log(`[LENGTH]: ${t.id.length}`);
    console.log('---');
  });
  console.log("FINAL_ID_LIST_END");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
