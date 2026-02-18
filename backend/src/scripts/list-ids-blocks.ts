import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.texte.findMany({
    select: { id: true, titre: true }
  });
  
  console.log("BLOCK_PRINT_START");
  result.forEach(t => {
    console.log(`[TITLE]: ${t.titre}`);
    console.log("[ID_BLOCKS]:");
    const id = t.id;
    for (let i = 0; i < id.length; i += 4) {
        console.log(`B${i}:${id.substring(i, i+4)}`);
    }
    console.log("---");
  });
  console.log("BLOCK_PRINT_END");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
