#!/usr/bin/env ts-node

/**
 * Script de nettoyage des fichiers orphelins
 * Usage: ts-node src/scripts/cleanup-orphaned-files.ts [--dry-run]
 */

import { cleanupOrphanedFiles, generateCleanupReport } from '../lib/file-cleanup';

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes('--dry-run');

    console.log('🧹 Démarrage du nettoyage des fichiers orphelins...\n');

    if (dryRun) {
        console.log('⚠️ MODE DRY-RUN: Aucun fichier ne sera supprimé\n');
    }

    try {
        const result = await cleanupOrphanedFiles(undefined, dryRun);
        const report = generateCleanupReport(result);

        console.log(report);

        if (result.errors.length > 0) {
            process.exit(1);
        }

        if (!dryRun && result.deletedFiles.length > 0) {
            console.log('✅ Nettoyage terminé avec succès');
        } else if (dryRun) {
            console.log('ℹ️ Exécutez sans --dry-run pour supprimer les fichiers');
        } else {
            console.log('✅ Aucun fichier orphelin trouvé');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
        process.exit(1);
    }
}

main();
