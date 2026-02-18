import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyzeCodeCommerce() {
    console.log('🔍 Analyse du Code de Commerce dans la DB\n');

    const codeCommerce = await prisma.texte.findFirst({
        where: {
            OR: [
                { titre: { contains: 'commerce', mode: 'insensitive' } },
                { titre: { contains: 'commercial', mode: 'insensitive' } }
            ]
        },
        include: {
            articles: {
                orderBy: { ordre: 'asc' },
                take: 20
            }
        }
    });

    if (!codeCommerce) {
        console.log('❌ Code de Commerce non trouvé');
        return;
    }

    console.log(`✅ Trouvé: ${codeCommerce.titre}`);
    console.log(`📊 Total articles: ${codeCommerce.articles.length}\n`);

    console.log('📄 Premiers 20 articles:');
    for (const article of codeCommerce.articles) {
        const preview = article.contenu.substring(0, 80).replace(/\n/g, ' ');
        console.log(`\n  Art.${article.numero}:`);
        console.log(`    ${preview}...`);
    }

    // Vérifier si Article 30 existe
    const art30 = codeCommerce.articles.find(a => a.numero === '30');
    console.log(`\n🔍 Article 30 existe: ${art30 ? 'OUI' : 'NON'}`);

    // Chercher "entreprenant" dans les articles
    const withEntreprenant = codeCommerce.articles.filter(a =>
        a.contenu.toLowerCase().includes('entreprenant')
    );
    console.log(`🔍 Articles mentionnant "entreprenant": ${withEntreprenant.length}`);
    for (const a of withEntreprenant.slice(0, 3)) {
        console.log(`   - Art.${a.numero}`);
    }
}

analyzeCodeCommerce()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
