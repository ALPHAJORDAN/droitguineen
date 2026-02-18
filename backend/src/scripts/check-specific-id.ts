import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const texte = await prisma.texte.findFirst({
    where: { titre: { contains: "Code civil" } },
    include: {
        articles: {
            take: 5,
            include: { section: true }
        }
    }
  });
  
  if (texte) {
    console.log("FOUND_TEXTE_ID:", texte.id);
    console.log("ARTICLES_WITH_SECTIONS:");
    console.log(JSON.stringify(texte.articles, null, 2));
  } else {
    console.log("NOT_FOUND by title 'Code civil'");
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
