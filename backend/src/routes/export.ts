/**
 * Routes d'export des documents juridiques (PDF/DOCX)
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { exportToPDF, exportToDOCX, ExportOptions } from '../lib/document-export';
import { asyncHandler, AppError } from '../middlewares/error.middleware';
import { validateId } from '../middlewares/validation.middleware';

const router = Router();

/** In-memory cache for export data (TTL: 5 minutes, max 50 entries) */
const MAX_CACHE_SIZE = 50;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const exportCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000;

/** Invalidate all cached export data for a given texte ID */
export function invalidateExportCache(texteId: string) {
    for (const key of exportCache.keys()) {
        if (key.startsWith(`${texteId}:`)) {
            exportCache.delete(key);
        }
    }
}

async function loadTexteForExport(id: string, include: object, format: string = 'default') {
    const cacheKey = `${id}:${format}`;
    const now = Date.now();
    const cached = exportCache.get(cacheKey);
    if (cached && now - cached.timestamp < CACHE_TTL) {
        return cached.data;
    }

    const texte = await prisma.texte.findUnique({ where: { id }, include });
    if (texte) {
        exportCache.set(cacheKey, { data: texte, timestamp: now });
        // Eviction: remove expired entries first, then oldest (by insertion order) if still over limit
        if (exportCache.size > MAX_CACHE_SIZE) {
            const expiredKeys: string[] = [];
            for (const [key, val] of exportCache) {
                if (now - val.timestamp > CACHE_TTL) expiredKeys.push(key);
            }
            for (const key of expiredKeys) exportCache.delete(key);

            // If still over limit, remove oldest entries
            const overflow = exportCache.size - MAX_CACHE_SIZE;
            if (overflow > 0) {
                let removed = 0;
                for (const key of exportCache.keys()) {
                    if (removed >= overflow) break;
                    exportCache.delete(key);
                    removed++;
                }
            }
        }
    }
    return texte;
}

/** Helper: escape HTML special characters to prevent XSS */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/** Helper: deep include for sections hierarchy */
const sectionsInclude = {
    orderBy: { ordre: 'asc' as const },
    where: { parentId: null },
    include: {
        articles: { orderBy: { ordre: 'asc' as const } },
        enfants: {
            orderBy: { ordre: 'asc' as const },
            include: {
                articles: { orderBy: { ordre: 'asc' as const } },
                enfants: {
                    orderBy: { ordre: 'asc' as const },
                    include: {
                        articles: { orderBy: { ordre: 'asc' as const } },
                        enfants: {
                            orderBy: { ordre: 'asc' as const },
                            include: {
                                articles: { orderBy: { ordre: 'asc' as const } }
                            }
                        }
                    }
                }
            }
        }
    }
};

/** Helper: create safe filename from title */
function safeFilename(titre: string): string {
    const sanitized = (titre || '')
        .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
    return sanitized || 'Document';
}

/**
 * GET /export/pdf/:id - Exporter un texte en PDF
 */
router.get('/pdf/:id', validateId(), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        includeTableOfContents = 'true',
        includeMetadata = 'true',
        includeHeader = 'true',
        includeFooter = 'true',
        includePageNumbers = 'true',
        watermark
    } = req.query;

    const options: ExportOptions = {
        includeTableOfContents: includeTableOfContents === 'true',
        includeMetadata: includeMetadata === 'true',
        includeHeader: includeHeader === 'true',
        includeFooter: includeFooter === 'true',
        includePageNumbers: includePageNumbers === 'true',
        watermark: typeof watermark === 'string' ? watermark.slice(0, 100) : undefined
    };

    const texte = await loadTexteForExport(id, {
        articles: {
            orderBy: { ordre: 'asc' },
            where: { sectionId: null }
        },
        sections: sectionsInclude
    }, 'pdf');

    if (!texte) {
        throw new AppError(404, 'Texte non trouvé');
    }

    const pdfBuffer = await exportToPDF(texte, options);
    const filename = safeFilename(texte.titre);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
}));

/**
 * GET /export/docx/:id - Exporter un texte en DOCX
 */
router.get('/docx/:id', validateId(), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const {
        includeTableOfContents = 'true',
        includeMetadata = 'true',
        includeHeader = 'true',
        includeFooter = 'true',
        includePageNumbers = 'true'
    } = req.query;

    const options: ExportOptions = {
        includeTableOfContents: includeTableOfContents === 'true',
        includeMetadata: includeMetadata === 'true',
        includeHeader: includeHeader === 'true',
        includeFooter: includeFooter === 'true',
        includePageNumbers: includePageNumbers === 'true'
    };

    const texte = await loadTexteForExport(id, {
        articles: {
            orderBy: { ordre: 'asc' },
            where: { sectionId: null }
        },
        sections: sectionsInclude
    }, 'docx');

    if (!texte) {
        throw new AppError(404, 'Texte non trouvé');
    }

    const docxBuffer = await exportToDOCX(texte, options);
    const filename = safeFilename(texte.titre);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.docx"`);
    res.setHeader('Content-Length', docxBuffer.length);
    res.send(docxBuffer);
}));

/**
 * GET /export/json/:id - Exporter un texte en JSON structuré
 */
router.get('/json/:id', validateId(), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const texte = await loadTexteForExport(id, {
        articles: {
            orderBy: { ordre: 'asc' },
            select: {
                id: true,
                cid: true,
                numero: true,
                contenu: true,
                etat: true,
                dateDebut: true,
                dateFin: true,
                ordre: true
            }
        },
        sections: sectionsInclude,
        relationsSource: {
            include: {
                texteCible: {
                    select: { id: true, titre: true, nature: true, numero: true }
                }
            }
        },
        relationsCible: {
            include: {
                texteSource: {
                    select: { id: true, titre: true, nature: true, numero: true }
                }
            }
        }
    }, 'json');

    if (!texte) {
        throw new AppError(404, 'Texte non trouvé');
    }

    const exportData = {
        metadata: {
            id: texte.id,
            cid: texte.cid,
            nor: texte.nor,
            eli: texte.eli,
            titre: texte.titre,
            titreComplet: texte.titreComplet,
            nature: texte.nature,
            numero: texte.numero,
            etat: texte.etat,
            dateSignature: texte.dateSignature,
            datePublication: texte.datePublication,
            dateEntreeVigueur: texte.dateEntreeVigueur,
            dateAbrogation: texte.dateAbrogation,
            sourceJO: texte.sourceJO,
            visas: texte.visas,
            signataires: texte.signataires
        },
        structure: texte.sections.length > 0 ? texte.sections : undefined,
        articles: texte.articles.length > 0 ? texte.articles : undefined,
        relations: {
            modifie: texte.relationsSource.filter((r: { type: string }) => r.type === 'MODIFIE'),
            abroge: texte.relationsSource.filter((r: { type: string }) => r.type === 'ABROGE'),
            cite: texte.relationsSource.filter((r: { type: string }) => r.type === 'CITE'),
            modifiePar: texte.relationsCible.filter((r: { type: string }) => r.type === 'MODIFIE'),
            abrogePar: texte.relationsCible.filter((r: { type: string }) => r.type === 'ABROGE'),
            citePar: texte.relationsCible.filter((r: { type: string }) => r.type === 'CITE')
        },
        exportedAt: new Date().toISOString(),
        source: 'Droitguinéen'
    };

    const filename = safeFilename(texte.titre);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
    res.json(exportData);
}));

/**
 * GET /export/html/:id - Exporter un texte en HTML
 */
router.get('/html/:id', validateId(), asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const texte = await loadTexteForExport(id, {
        articles: {
            orderBy: { ordre: 'asc' },
            where: { sectionId: null }
        },
        sections: sectionsInclude
    }, 'html');

    if (!texte) {
        throw new AppError(404, 'Texte non trouvé');
    }

    const html = generateHTML(texte);
    const filename = safeFilename(texte.titre);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.html"`);
    res.send(html);
}));

function generateHTML(texte: {
    titre: string;
    numero?: string | null;
    dateSignature?: Date | null;
    visas?: string | null;
    signataires?: string | null;
    articles: Array<{ numero: string; contenu: string }>;
    sections: Array<{
        titre: string;
        articles: Array<{ numero: string; contenu: string }>;
        enfants?: Array<{
            titre: string;
            articles: Array<{ numero: string; contenu: string }>;
        }>;
    }>;
}): string {
    const formatDate = (date: Date | null | undefined) => {
        if (!date) return '';
        const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        return `${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()}`;
    };

    let articlesHtml = '';

    for (const article of texte.articles) {
        articlesHtml += `
            <div class="article">
                <h3 class="article-title">Article ${escapeHtml(article.numero)}</h3>
                <p class="article-content">${escapeHtml(article.contenu).replace(/\n/g, '<br>')}</p>
            </div>
        `;
    }

    function renderSections(sections: typeof texte.sections, level: number = 1): string {
        let html = '';
        for (const section of sections) {
            const tag = `h${Math.min(level + 2, 6)}`;
            html += `<${tag} class="section-title level-${level}">${escapeHtml(section.titre)}</${tag}>`;

            for (const article of section.articles) {
                html += `
                    <div class="article">
                        <h4 class="article-title">Article ${escapeHtml(article.numero)}</h4>
                        <p class="article-content">${escapeHtml(article.contenu).replace(/\n/g, '<br>')}</p>
                    </div>
                `;
            }

            if (section.enfants) {
                html += renderSections(section.enfants as typeof texte.sections, level + 1);
            }
        }
        return html;
    }

    const sectionsHtml = renderSections(texte.sections);

    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(texte.titre)}</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
        }
        .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #000; padding-bottom: 20px; }
        .republic { font-weight: bold; font-size: 14px; }
        .motto { font-style: italic; color: #666; margin-top: 5px; }
        h1 { font-size: 24px; text-transform: uppercase; margin: 30px 0 10px; }
        .meta { font-style: italic; color: #666; }
        .visas { font-style: italic; color: #444; margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 3px solid #ccc; }
        .section-title { color: #003366; margin-top: 30px; }
        .article { margin: 20px 0; padding-left: 20px; }
        .article-title { color: #003366; font-size: 16px; margin-bottom: 10px; }
        .article-content { text-align: justify; }
        .signataires { margin-top: 50px; text-align: right; }
        .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; text-align: center; }
        @media print { body { padding: 20px; } .article { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="republic">RÉPUBLIQUE DE GUINÉE</div>
        <div class="motto">Travail - Justice - Solidarité</div>
    </div>

    <h1>${escapeHtml(texte.titre)}</h1>
    ${texte.numero || texte.dateSignature ? `
        <p class="meta">
            ${texte.numero ? `N&deg; ${escapeHtml(texte.numero)}` : ''}
            ${texte.dateSignature ? `du ${formatDate(texte.dateSignature)}` : ''}
        </p>
    ` : ''}

    ${texte.visas ? `<div class="visas">${escapeHtml(texte.visas).replace(/\n/g, '<br>')}</div>` : ''}

    <div class="content">
        ${articlesHtml}
        ${sectionsHtml}
    </div>

    ${texte.signataires ? `<div class="signataires">${escapeHtml(texte.signataires).replace(/\n/g, '<br>')}</div>` : ''}

    <div class="footer">
        <p>Document exporté depuis Droitguinéen</p>
        <p>Date d'export : ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
</body>
</html>`;
}

export default router;
