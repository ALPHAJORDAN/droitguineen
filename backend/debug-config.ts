/**
 * Script de test pour Google Cloud Vision avec debug
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Charger les variables d'environnement
dotenv.config();

console.log('🔍 Debug Configuration Google Cloud Vision\n');

console.log('📋 Variables d\'environnement:');
console.log(`   GOOGLE_CLOUD_VISION_ENABLED = "${process.env.GOOGLE_CLOUD_VISION_ENABLED}"`);
console.log(`   GOOGLE_CLOUD_PROJECT_ID = "${process.env.GOOGLE_CLOUD_PROJECT_ID}"`);
console.log(`   GOOGLE_APPLICATION_CREDENTIALS = "${process.env.GOOGLE_APPLICATION_CREDENTIALS}"\n`);

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (credPath) {
    const resolvedPath = path.resolve(process.cwd(), credPath);
    console.log(`📁 Chemin résolu: ${resolvedPath}`);
    console.log(`   Existe? ${fs.existsSync(resolvedPath) ? '✅ Oui' : '❌ Non'}\n`);

    if (fs.existsSync(resolvedPath)) {
        try {
            const content = fs.readFileSync(resolvedPath, 'utf-8');
            const json = JSON.parse(content);
            console.log(`✅ Fichier JSON valide`);
            console.log(`   Project ID dans le fichier: ${json.project_id}\n`);
        } catch (error) {
            console.log(`❌ Erreur lecture JSON: ${error}\n`);
        }
    }
} else {
    console.log('❌ GOOGLE_APPLICATION_CREDENTIALS non défini\n');
}

console.log('📂 Répertoire de travail:', process.cwd());
