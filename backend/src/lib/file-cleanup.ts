import fs from 'fs';
import path from 'path';
import prisma from './prisma';

/**
 * Utilitaire pour nettoyer les fichiers PDF orphelins
 * Un fichier est considéré orphelin s'il existe dans uploads/ mais n'est pas référencé en base
 */

export interface CleanupResult {
    scannedFiles: number;
    orphanedFiles: string[];
    deletedFiles: string[];
    errors: string[];
    totalSizeFreed: number; // en bytes
}

/**
 * Scanner le répertoire uploads et identifier les fichiers orphelins
 */
export async function findOrphanedFiles(uploadsDir: string = path.join(process.cwd(), 'uploads')): Promise<string[]> {
    const orphanedFiles: string[] = [];

    try {
        // Vérifier que le répertoire existe
        if (!fs.existsSync(uploadsDir)) {
            console.log('📁 Répertoire uploads n\'existe pas');
            return orphanedFiles;
        }

        // Lister tous les fichiers dans uploads/
        const files = fs.readdirSync(uploadsDir);

        // Récupérer tous les chemins de fichiers référencés en base
        const textesWithFiles = await prisma.texte.findMany({
            where: {
                fichierPdf: { not: null }
            },
            select: {
                fichierPdf: true
            }
        });

        const referencedFiles = new Set(
            textesWithFiles
                .map(t => t.fichierPdf)
                .filter((f): f is string => f !== null)
                .map(f => path.basename(f)) // Extraire juste le nom du fichier
        );

        // Identifier les fichiers orphelins
        for (const file of files) {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);

            // Ignorer les répertoires
            if (stats.isDirectory()) continue;

            // Vérifier si le fichier est référencé
            if (!referencedFiles.has(file)) {
                orphanedFiles.push(filePath);
            }
        }

        return orphanedFiles;
    } catch (error) {
        console.error('Erreur lors de la recherche de fichiers orphelins:', error);
        throw error;
    }
}

/**
 * Nettoyer les fichiers orphelins
 */
export async function cleanupOrphanedFiles(
    uploadsDir: string = path.join(process.cwd(), 'uploads'),
    dryRun: boolean = false
): Promise<CleanupResult> {
    const result: CleanupResult = {
        scannedFiles: 0,
        orphanedFiles: [],
        deletedFiles: [],
        errors: [],
        totalSizeFreed: 0
    };

    try {
        // Trouver les fichiers orphelins
        const orphanedFiles = await findOrphanedFiles(uploadsDir);
        result.orphanedFiles = orphanedFiles;
        result.scannedFiles = fs.readdirSync(uploadsDir).filter(f => {
            const stats = fs.statSync(path.join(uploadsDir, f));
            return stats.isFile();
        }).length;

        // Supprimer les fichiers (sauf en mode dry-run)
        for (const filePath of orphanedFiles) {
            try {
                // Obtenir la taille avant suppression
                const stats = fs.statSync(filePath);
                const fileSize = stats.size;

                if (!dryRun) {
                    fs.unlinkSync(filePath);
                    result.deletedFiles.push(filePath);
                    result.totalSizeFreed += fileSize;
                    console.log(`🗑️ Supprimé: ${path.basename(filePath)} (${formatBytes(fileSize)})`);
                } else {
                    console.log(`[DRY RUN] Serait supprimé: ${path.basename(filePath)} (${formatBytes(fileSize)})`);
                    result.totalSizeFreed += fileSize;
                }
            } catch (error) {
                const errorMsg = `Erreur lors de la suppression de ${filePath}: ${error}`;
                result.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }

        return result;
    } catch (error) {
        console.error('Erreur lors du nettoyage:', error);
        throw error;
    }
}

/**
 * Formater les bytes en format lisible
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Générer un rapport de nettoyage
 */
export function generateCleanupReport(result: CleanupResult): string {
    const report = `
📊 RAPPORT DE NETTOYAGE DES FICHIERS
=====================================

Fichiers scannés: ${result.scannedFiles}
Fichiers orphelins trouvés: ${result.orphanedFiles.length}
Fichiers supprimés: ${result.deletedFiles.length}
Erreurs: ${result.errors.length}
Espace libéré: ${formatBytes(result.totalSizeFreed)}

${result.orphanedFiles.length > 0 ? `
Fichiers orphelins:
${result.orphanedFiles.map(f => `  - ${path.basename(f)}`).join('\n')}
` : ''}

${result.errors.length > 0 ? `
Erreurs:
${result.errors.map(e => `  - ${e}`).join('\n')}
` : ''}
`;

    return report;
}
