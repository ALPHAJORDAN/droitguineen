import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const lastTexte = await prisma.texte.findFirst({
        orderBy: { createdAt: 'desc' },
        include: {
            sections: {
                include: {
                    articles: true,
                    enfants: {
                        include: {
                            articles: true,
                            enfants: {
                                include: {
                                    articles: true
                                }
                            }
                        }
                    }
                }
            },
            articles: true
        }
    });

    if (!lastTexte) {
        console.log("No text found in database.");
        return;
    }

    console.log(`Last Text: ${lastTexte.titre} (${lastTexte.nature})`);
    console.log(`Total Root Articles (Flat): ${lastTexte.articles.length}`);
    console.log(`Total Root Sections: ${lastTexte.sections.length}`);

    let totalDeepArticles = 0;

    function printSection(section: any, indent = '') {
        console.log(`${indent}Section: ${section.titre} (Level ${section.niveau}) - Articles: ${section.articles.length}`);
        totalDeepArticles += section.articles.length;
        section.articles.forEach((a: any) => console.log(`${indent}  - Art ${a.numero}: ${a.contenu.substring(0, 30)}...`));

        section.enfants.forEach((child: any) => printSection(child, indent + '  '));
    }

    lastTexte.sections.forEach(s => printSection(s));

    console.log(`Total Articles found deep in sections: ${totalDeepArticles}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
