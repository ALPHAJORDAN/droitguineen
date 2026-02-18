import prisma from '../src/lib/prisma';
import { meiliClient, TEXTES_INDEX_NAME } from '../src/lib/meilisearch';
import fs from 'fs';
import path from 'path';

async function reset() {
    console.log('🗑️  Starting cleanup...');

    // 1. Delete all data from Postgres
    console.log('Deleting data from PostgreSQL...');
    try {
        await prisma.article.deleteMany({});
        await prisma.section.deleteMany({});
        await prisma.versionTexte.deleteMany({});
        const deleteResult = await prisma.texte.deleteMany({});
        console.log(`✅ Deleted ${deleteResult.count} textes from database.`);
    } catch (e) {
        console.error('❌ Error deleting from DB:', e);
    }

    // 2. Clear Meilisearch index
    console.log('Clearing Meilisearch index...');
    try {
        await meiliClient.index(TEXTES_INDEX_NAME).deleteAllDocuments();
        console.log('✅ Meilisearch index cleared.');
    } catch (e) {
        console.error('❌ Error clearing Meilisearch:', e);
    }

    // 3. Delete uploaded files
    console.log('Deleting uploaded files...');
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        for (const file of files) {
            if (file === '.gitkeep') continue; // Keep .gitkeep if exists
            fs.unlinkSync(path.join(uploadsDir, file));
        }
        console.log(`✅ Deleted ${files.length} files from uploads/`);
    } else {
        console.log('ℹ️  Uploads directory does not exist.');
    }

    console.log('✨ Cleanup complete!');
    process.exit(0);
}

reset();
