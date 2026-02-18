import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCodeCommerce() {
    console.log('🔍 Vérification du Code de Commerce\n');

    // 1. Trouver le Code de Commerce
    const codeCommerce = await prisma.texte.findFirst({
        where: {
            OR: [
                { titre: { contains: 'commerce', mode: 'insensitive' } },
                { titre: { contains: 'commercial', mode: 'insensitive' } }
            ]
        },
        select: {
            id: true,
            titre: true,
            nature: true,
            _count: {
                select: {
                    articles: true
                }
            }
        }
    });

    if (!codeCommerce) {
        console.log('❌ Code de Commerce non trouvé');
        return;
    }

    console.log(`✅ Trouvé: ${codeCommerce.titre}`);
    console.log(`   ID: ${codeCommerce.id}`);
    console.log(`   Nature: ${codeCommerce.nature}`);
    console.log(`   Nombre d'articles: ${codeCommerce._count.articles}\n`);

    // 2. Vérifier les doublons
    const articles = await prisma.article.findMany({
        where: { texteId: codeCommerce.id },
        select: {
            numero: true,
            contenu: true
        },
        orderBy: { numero: 'asc' }
    });

    // Compter les doublons
    const numeroCounts: { [key: string]: number } = {};
    for (const article of articles) {
        numeroCounts[article.numero] = (numeroCounts[article.numero] || 0) + 1;
    }

    const duplicates = Object.entries(numeroCounts).filter(([_, count]) => count > 1);

    if (duplicates.length > 0) {
        console.log(`⚠️  ${duplicates.length} numéros d'articles dupliqués:`);
        for (const [numero, count] of duplicates.slice(0, 10)) {
            console.log(`   Article ${numero}: ${count} fois`);

            // Afficher le contenu des doublons pour voir si c'est la Table des Matières
            const dubs = articles.filter(a => a.numero === numero);
            dubs.forEach((d, i) => {
                console.log(`      Instance ${i + 1} (Length: ${d.contenu.length}): "${d.contenu.substring(0, 100).replace(/\n/g, ' ')}..."`);
            });
        }
        if (duplicates.length > 10) {
            console.log(`   ... et ${duplicates.length - 10} autres`);
        }
    } else {
        console.log('✅ Aucun doublon détecté');
    }

    // 3. Afficher quelques articles
    console.log(`\n📄 Premiers articles:`);
    for (const article of articles.slice(0, 5)) {
        console.log(`   Article ${article.numero}: ${article.contenu.substring(0, 50)}...`);
    }
}

checkCodeCommerce()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
