/**
 * Script de re-traitement des articles existants
 * Relit les PDFs et re-parse les articles avec le pipeline amélioré
 * Usage: npx ts-node src/scripts/reprocess-articles.ts
 */

import prisma from '../lib/prisma';
import { indexArticles, removeArticlesFromIndex } from '../lib/meilisearch';
import { EtatTexte } from '@prisma/client';
import { log } from '../utils/logger';
import {
    extractTextFromPdf as pipelineExtractText,
    cleanText,
    extractStructure,
} from '../lib/ocr-pipeline';

async function reprocessArticles() {
    console.log('=== Re-traitement des articles ===\n');

    const textes = await prisma.texte.findMany({
        include: { articles: true },
    });

    console.log(`${textes.length} textes trouvés\n`);

    for (const texte of textes) {
        console.log(`--- ${texte.titre} (${texte.id}) ---`);
        console.log(`  Articles actuels: ${texte.articles.length}`);

        if (!texte.fichierPdf) {
            console.log('  Pas de PDF, skip\n');
            continue;
        }

        // Vérifier que le fichier existe
        const fs = require('fs');
        if (!fs.existsSync(texte.fichierPdf)) {
            console.log(`  PDF introuvable: ${texte.fichierPdf}, skip\n`);
            continue;
        }

        try {
            // Re-extraire le texte
            console.log('  Extraction du texte...');
            const ocrResult = await pipelineExtractText(texte.fichierPdf);
            const cleanedText = cleanText(ocrResult.text);
            console.log(`  Texte extrait: ${cleanedText.length} caractères (${ocrResult.method})`);

            // Re-parser les articles
            console.log('  Parsing des articles...');
            const structure = extractStructure(cleanedText);
            console.log(`  Articles trouvés: ${structure.articles.length}`);

            if (structure.articles.length === 0) {
                console.log('  Aucun article trouvé, skip\n');
                continue;
            }

            // Supprimer les anciens articles
            const deleted = await prisma.article.deleteMany({
                where: { texteId: texte.id },
            });
            console.log(`  ${deleted.count} anciens articles supprimés`);

            // Supprimer les anciennes sections aussi
            await prisma.section.deleteMany({
                where: { texteId: texte.id },
            });

            // Insérer les nouveaux articles
            await prisma.article.createMany({
                data: structure.articles.map((article, index) => ({
                    cid: `${texte.cid}-ART-${index + 1}`,
                    numero: article.numero,
                    contenu: article.contenu,
                    ordre: index + 1,
                    texteId: texte.id,
                    etat: EtatTexte.VIGUEUR,
                })),
            });
            console.log(`  ${structure.articles.length} nouveaux articles insérés`);

            // Montrer quelques exemples
            const examples = structure.articles.slice(0, 5);
            examples.forEach(a => {
                console.log(`    Art ${a.numero}: ${a.contenu.slice(0, 80)}...`);
            });

            // Re-indexer dans Meilisearch
            try {
                await removeArticlesFromIndex(texte.id);
                const texteComplete = await prisma.texte.findUnique({
                    where: { id: texte.id },
                    include: { articles: true, sections: true },
                });
                if (texteComplete) {
                    await indexArticles(texteComplete);
                    console.log('  Meilisearch re-indexé');
                }
            } catch (e) {
                console.log('  Erreur Meilisearch (non-bloquant):', e);
            }

            console.log('');
        } catch (error) {
            console.error(`  Erreur lors du re-traitement:`, error);
            console.log('');
        }
    }

    console.log('=== Re-traitement terminé ===');
    process.exit(0);
}

reprocessArticles().catch((err) => {
    console.error('Erreur fatale:', err);
    process.exit(1);
});
