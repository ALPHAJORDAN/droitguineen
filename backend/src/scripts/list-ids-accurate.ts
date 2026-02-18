import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const codeCivil = await prisma.texte.findFirst({
    where: { titre: { contains: "Code civil" } }
  });
  
  const testLoi = await prisma.texte.findFirst({
    where: { titre: { contains: "Test Loi Upload" } }
  });
  
  console.log("ACCURATE_GET_START");
  if (codeCivil) {
    console.log(`CODE_CIVIL_ID_IS: [${codeCivil.id}]`);
  }
  if (testLoi) {
    console.log(`TEST_LOI_ID_IS: [${testLoi.id}]`);
  }
  console.log("ACCURATE_GET_END");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
