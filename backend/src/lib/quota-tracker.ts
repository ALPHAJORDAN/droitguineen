/**
 * Quota Tracker for Google Cloud Vision API
 * Tracks usage to stay within free tier limits
 */

import fs from 'fs';
import path from 'path';

interface QuotaData {
    daily: {
        date: string;
        count: number;
    };
    monthly: {
        month: string;
        count: number;
    };
    lastReset: string;
}

const QUOTA_FILE = path.join(process.cwd(), 'data', 'vision-quota.json');
const DAILY_LIMIT = parseInt(process.env.GOOGLE_VISION_DAILY_LIMIT || '100');
const MONTHLY_LIMIT = parseInt(process.env.GOOGLE_VISION_MONTHLY_LIMIT || '1000');

/**
 * Charger les données de quota
 */
function loadQuotaData(): QuotaData {
    try {
        if (fs.existsSync(QUOTA_FILE)) {
            const data = fs.readFileSync(QUOTA_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.warn('Erreur lecture quota:', error);
    }

    // Données par défaut
    const now = new Date();
    return {
        daily: {
            date: now.toISOString().split('T')[0],
            count: 0
        },
        monthly: {
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            count: 0
        },
        lastReset: now.toISOString()
    };
}

/**
 * Sauvegarder les données de quota
 */
function saveQuotaData(data: QuotaData): void {
    try {
        const dir = path.dirname(QUOTA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(QUOTA_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Erreur sauvegarde quota:', error);
    }
}

/**
 * Réinitialiser les compteurs si nécessaire
 */
function resetIfNeeded(data: QuotaData): QuotaData {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let updated = false;

    // Réinitialiser le compteur journalier
    if (data.daily.date !== today) {
        data.daily = { date: today, count: 0 };
        updated = true;
    }

    // Réinitialiser le compteur mensuel
    if (data.monthly.month !== currentMonth) {
        data.monthly = { month: currentMonth, count: 0 };
        updated = true;
    }

    if (updated) {
        data.lastReset = now.toISOString();
        saveQuotaData(data);
    }

    return data;
}

/**
 * Vérifier si le quota est disponible
 */
export function checkQuotaAvailable(): boolean {
    const data = resetIfNeeded(loadQuotaData());

    if (data.daily.count >= DAILY_LIMIT) {
        console.warn(`⚠️ Quota journalier atteint: ${data.daily.count}/${DAILY_LIMIT}`);
        return false;
    }

    if (data.monthly.count >= MONTHLY_LIMIT) {
        console.warn(`⚠️ Quota mensuel atteint: ${data.monthly.count}/${MONTHLY_LIMIT}`);
        return false;
    }

    return true;
}

/**
 * Enregistrer l'utilisation du quota
 */
export function trackQuotaUsage(pagesProcessed: number): void {
    const data = resetIfNeeded(loadQuotaData());

    data.daily.count += pagesProcessed;
    data.monthly.count += pagesProcessed;

    saveQuotaData(data);

    // Alertes
    const dailyPercent = (data.daily.count / DAILY_LIMIT) * 100;
    const monthlyPercent = (data.monthly.count / MONTHLY_LIMIT) * 100;

    if (dailyPercent >= 80) {
        console.warn(`⚠️ Quota journalier à ${dailyPercent.toFixed(0)}%: ${data.daily.count}/${DAILY_LIMIT}`);
    }

    if (monthlyPercent >= 80) {
        console.warn(`⚠️ Quota mensuel à ${monthlyPercent.toFixed(0)}%: ${data.monthly.count}/${MONTHLY_LIMIT}`);
    }

    console.log(`📊 Quota utilisé: ${data.daily.count}/${DAILY_LIMIT} aujourd'hui, ${data.monthly.count}/${MONTHLY_LIMIT} ce mois`);
}

/**
 * Obtenir les statistiques de quota
 */
export function getQuotaStats(): {
    daily: { used: number; limit: number; percentage: number };
    monthly: { used: number; limit: number; percentage: number };
} {
    const data = resetIfNeeded(loadQuotaData());

    return {
        daily: {
            used: data.daily.count,
            limit: DAILY_LIMIT,
            percentage: (data.daily.count / DAILY_LIMIT) * 100
        },
        monthly: {
            used: data.monthly.count,
            limit: MONTHLY_LIMIT,
            percentage: (data.monthly.count / MONTHLY_LIMIT) * 100
        }
    };
}

/**
 * Réinitialiser manuellement les quotas (pour tests)
 */
export function resetQuota(): void {
    const now = new Date();
    const data: QuotaData = {
        daily: {
            date: now.toISOString().split('T')[0],
            count: 0
        },
        monthly: {
            month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
            count: 0
        },
        lastReset: now.toISOString()
    };
    saveQuotaData(data);
    console.log('✅ Quotas réinitialisés');
}

export default {
    checkQuotaAvailable,
    trackQuotaUsage,
    getQuotaStats,
    resetQuota
};
