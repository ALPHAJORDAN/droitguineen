/**
 * Script de test pour Google Cloud Vision
 */

import { initVisionClient, isVisionAvailable } from './src/lib/google-vision-ocr';
import { checkQuotaAvailable, getQuotaStats } from './src/lib/quota-tracker';

async function testGoogleVision() {
    console.log('🧪 Test de configuration Google Cloud Vision\n');

    // Test 1: Vérifier la disponibilité
    console.log('1️⃣ Vérification de la disponibilité...');
    const available = isVisionAvailable();

    if (available) {
        console.log('   ✅ Google Cloud Vision est disponible\n');
    } else {
        console.log('   ❌ Google Cloud Vision n\'est pas disponible');
        console.log('   Vérifiez votre configuration .env\n');
        process.exit(1);
    }

    // Test 2: Vérifier le quota
    console.log('2️⃣ Vérification du quota...');
    const quotaOk = checkQuotaAvailable();

    if (quotaOk) {
        console.log('   ✅ Quota disponible\n');
    } else {
        console.log('   ⚠️  Quota dépassé\n');
    }

    // Test 3: Afficher les statistiques
    console.log('3️⃣ Statistiques de quota:');
    const stats = getQuotaStats();
    console.log(`   📊 Aujourd'hui: ${stats.daily.used}/${stats.daily.limit} (${stats.daily.percentage.toFixed(1)}%)`);
    console.log(`   📊 Ce mois: ${stats.monthly.used}/${stats.monthly.limit} (${stats.monthly.percentage.toFixed(1)}%)\n`);

    // Test 4: Initialiser le client
    console.log('4️⃣ Initialisation du client Vision...');
    const client = initVisionClient();

    if (client) {
        console.log('   ✅ Client initialisé avec succès\n');
    } else {
        console.log('   ❌ Échec de l\'initialisation du client\n');
        process.exit(1);
    }

    console.log('✅ Tous les tests sont passés !');
    console.log('\n🎯 Google Cloud Vision est prêt à être utilisé.');
    console.log('   Vous pouvez maintenant uploader des PDFs pour tester l\'OCR.\n');
}

testGoogleVision().catch(error => {
    console.error('❌ Erreur lors du test:', error);
    process.exit(1);
});
