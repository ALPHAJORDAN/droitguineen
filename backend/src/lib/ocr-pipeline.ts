/**
 * Pipeline OCR juridique avancé pour documents guinéens
 * Gère la qualité variable des PDFs avec prétraitement d'images
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

import { v4 as uuidv4 } from 'uuid';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse-fork');

export interface OCRResult {
    text: string;
    confidence: number;
    method: 'native' | 'ocr' | 'hybrid';
    pages: PageResult[];
    processingTime: number;
}

export interface PageResult {
    pageNumber: number;
    text: string;
    confidence: number;
    method: 'native' | 'ocr';
}

export interface ExtractedDocument {
    rawText: string;
    cleanedText: string;
    metadata: DocumentMetadata;
    structure: DocumentStructure;
    json: object;
    html: string;
}

export interface DocumentMetadata {
    titre?: string;
    titreComplet?: string;
    nature?: string;
    numero?: string;
    dateSignature?: Date;
    datePublication?: Date;
    signataires?: string[];
    visas?: string[];
    references?: TextReference[];
}

export interface TextReference {
    type: 'abroge' | 'modifie' | 'cite' | 'applique' | 'complete';
    texteRef: string;
    articleRef?: string;
    description?: string;
}

export interface DocumentStructure {
    preambule?: string;
    visas?: string[];
    sections: SectionNode[];
    articles: ArticleNode[];
    annexes?: AnnexeNode[];
}

export interface SectionNode {
    id: string;
    type: 'LIVRE' | 'PARTIE' | 'TITRE' | 'SOUS_TITRE' | 'CHAPITRE' | 'SECTION' | 'SOUS_SECTION' | 'PARAGRAPHE';
    numero: string;
    titre: string;
    niveau: number;
    children: SectionNode[];
    articles: ArticleNode[];
}

export interface ArticleNode {
    id: string;
    numero: string;
    titre?: string;
    contenu: string;
    alineas: string[];
    etat: 'VIGUEUR' | 'MODIFIE' | 'ABROGE';
    references: TextReference[];
}

export interface AnnexeNode {
    id: string;
    numero: string;
    titre: string;
    contenu: string;
}



/**
 * Extraction de texte depuis un PDF avec stratégie à 3 niveaux
 * 1. Native (rapide, gratuit)
 * 2. Google Cloud Vision (précis, quota-limited)
 */
export async function extractTextFromPdf(filePath: string): Promise<OCRResult> {
    const startTime = Date.now();
    const pages: PageResult[] = [];
    let totalText = '';
    let method: 'native' | 'ocr' | 'hybrid' = 'native';
    let totalConfidence = 0;

    try {
        // Étape 1: Essayer l'extraction native
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);

        const nativeText = pdfData.text?.trim() || '';
        const charDensity = nativeText.length / (pdfData.numpages || 1);

        // Si le texte natif est suffisant (>500 chars/page en moyenne), l'utiliser
        if (charDensity > 500) {
            console.log(`✅ Extraction native (densité: ${charDensity} chars/page)`);
            totalText = nativeText;
            method = 'native';
            totalConfidence = 95;

            // Simuler les pages
            const pageTexts = nativeText.split(/\f|\n{3,}/);
            pageTexts.forEach((text: string, index: number) => {
                pages.push({
                    pageNumber: index + 1,
                    text: text.trim(),
                    confidence: 95,
                    method: 'native'
                });
            });
        } else {
            // Étape 2: OCR nécessaire - le PDF semble être scanné
            console.log(`📄 PDF scanné détecté (densité: ${charDensity} chars/page)`);

            // Import dynamique des modules OCR
            const { extractPdfPagesAsImages } = await import('./pdf-to-image');
            const { isVisionAvailable, processPagesWithVision } = await import('./google-vision-ocr');
            const { checkQuotaAvailable, trackQuotaUsage } = await import('./quota-tracker');

            // Vérifier que Google Cloud Vision est disponible
            if (!isVisionAvailable()) {
                throw new Error('Google Cloud Vision non configuré. Veuillez configurer GOOGLE_CLOUD_VISION_ENABLED et GOOGLE_APPLICATION_CREDENTIALS dans .env');
            }

            if (!checkQuotaAvailable()) {
                throw new Error('Quota Google Cloud Vision dépassé. Veuillez attendre la réinitialisation ou augmenter votre quota.');
            }

            // Convertir le PDF en images page par page
            console.log('🔄 Conversion PDF → Images...');
            const pageImages = await extractPdfPagesAsImages(filePath, {
                scale: 2.0,
                onProgress: (current, total) => {
                    console.log(`  📄 Page ${current}/${total}`);
                }
            });

            console.log(`✅ ${pageImages.length} pages converties`);

            // Utiliser Google Cloud Vision
            console.log('🌐 Traitement avec Google Cloud Vision API');
            method = 'ocr';

            const visionResults = await processPagesWithVision(
                pageImages,
                (current, total) => {
                    console.log(`  🔍 OCR Vision page ${current}/${total}`);
                }
            );

            // Traquer l'utilisation du quota
            trackQuotaUsage(pageImages.length);

            // Compiler les résultats
            let pageConfidences: number[] = [];

            for (const result of visionResults) {
                pages.push({
                    pageNumber: result.pageNumber,
                    text: result.text,
                    confidence: result.confidence,
                    method: 'ocr'
                });

                totalText += result.text + '\n\n';
                pageConfidences.push(result.confidence);
            }

            totalConfidence = pageConfidences.length > 0
                ? pageConfidences.reduce((a, b) => a + b, 0) / pageConfidences.length
                : 0;

            console.log(`✅ Google Vision: ${totalConfidence.toFixed(1)}% confiance`);

            // Si l'OCR donne un résultat faible, combiner avec le texte natif
            if (totalConfidence < 60 && nativeText.length > 0) {
                console.log('🔀 Mode hybride activé (confiance faible)');
                method = 'hybrid';
                totalText = mergeTexts(nativeText, totalText);
            }
        }

    } catch (error) {
        console.error('❌ Erreur extraction PDF:', error);
        throw new Error('Impossible d\'extraire le texte du PDF');
    }

    const processingTime = Date.now() - startTime;
    console.log(`⏱️ Traitement terminé en ${(processingTime / 1000).toFixed(1)}s`);

    return {
        text: totalText,
        confidence: totalConfidence,
        method,
        pages,
        processingTime
    };
}

/**
 * Fusion intelligente de deux textes (natif + OCR)
 */
function mergeTexts(nativeText: string, ocrText: string): string {
    // Stratégie simple: prendre le plus long des deux s'ils sont très différents
    if (ocrText.length > nativeText.length * 1.5) {
        return ocrText;
    }
    return nativeText;
}

/**
 * Nettoyage du texte extrait
 */
export function cleanText(rawText: string): string {
    return rawText
        // Normaliser les espaces
        .replace(/\s+/g, ' ')
        // Corriger les erreurs OCR courantes
        .replace(/\bl\s*'\s*/g, "l'")
        .replace(/\bd\s*'\s*/g, "d'")
        .replace(/\bqu\s*'\s*/g, "qu'")
        .replace(/\bn\s*'\s*/g, "n'")
        .replace(/\bs\s*'\s*/g, "s'")
        .replace(/\bj\s*'\s*/g, "j'")
        // Corriger "Articte" -> "Article"
        .replace(/Articte/gi, 'Article')
        .replace(/Artide/gi, 'Article')
        // Corriger caractères mal reconnus
        .replace(/[ﬁ]/g, 'fi')
        .replace(/[ﬂ]/g, 'fl')
        .replace(/[œ]/g, 'oe')
        .replace(/[æ]/g, 'ae')
        // Normaliser les tirets
        .replace(/[–—]/g, '-')
        // Supprimer les caractères de contrôle
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
        // Restaurer les sauts de ligne pour les articles
        .replace(/\s*(Article\s+\d+)/gi, '\n\n$1')
        .replace(/\s*(TITRE\s+[IVX\d]+)/gi, '\n\n$1')
        .replace(/\s*(CHAPITRE\s+[IVX\d]+)/gi, '\n\n$1')
        .trim();
}

/**
 * Extraction des métadonnées juridiques
 */
export function extractMetadata(text: string): DocumentMetadata {
    const metadata: DocumentMetadata = {
        references: []
    };

    // Extraction du titre
    const titlePatterns = [
        /(?:LOI|ORDONNANCE|DÉCRET|DECRET|ARRÊTÉ|ARRETE)\s+(?:N°?\s*)?([A-Z0-9\/\-]+)?\s*(?:DU\s+\d+.+?)?\s*(?:PORTANT|RELATIVE?|FIXANT|MODIFIANT|ABROGEANT)\s+(.+?)(?:\.|$)/im,
        /^(.{30,200}?)(?:\n|$)/m
    ];

    for (const pattern of titlePatterns) {
        const match = text.match(pattern);
        if (match) {
            metadata.titre = match[0].trim().substring(0, 500);
            break;
        }
    }

    // Extraction du numéro
    const numeroPatterns = [
        /(?:N°|No\.?|Numéro)\s*([A-Z]?\/?\d{4}\/\d{3}(?:\/[A-Z]+)?)/i,
        /([LDOA]\/\d{4}\/\d{3}(?:\/[A-Z]+)?)/i,
        /(\d{4}[-\/]\d{2,4})/
    ];

    for (const pattern of numeroPatterns) {
        const match = text.match(pattern);
        if (match) {
            metadata.numero = match[1].toUpperCase();
            break;
        }
    }

    // Extraction de la nature
    const natureKeywords: Record<string, string> = {
        'constitution': 'LOI_CONSTITUTIONNELLE',
        'loi constitutionnelle': 'LOI_CONSTITUTIONNELLE',
        'loi organique': 'LOI_ORGANIQUE',
        'ordonnance': 'ORDONNANCE',
        'décret-loi': 'DECRET_LOI',
        'decret-loi': 'DECRET_LOI',
        'décret': 'DECRET',
        'decret': 'DECRET',
        'arrêté': 'ARRETE',
        'arrete': 'ARRETE',
        'circulaire': 'CIRCULAIRE',
        'code': 'CODE',
        'loi': 'LOI'
    };

    const textLower = text.toLowerCase().substring(0, 1000);
    for (const [keyword, nature] of Object.entries(natureKeywords)) {
        if (textLower.includes(keyword)) {
            metadata.nature = nature;
            break;
        }
    }

    // Extraction des dates
    const datePatterns = [
        { pattern: /(?:fait|signé|donné)\s+(?:à\s+\w+\s+)?le\s+(\d{1,2})\s+(\w+)\s+(\d{4})/i, type: 'signature' },
        { pattern: /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i, type: 'date' },
        { pattern: /(\d{1,2})\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)\s+(\d{4})/i, type: 'date' }
    ];

    const moisFr: Record<string, number> = {
        'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3,
        'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7,
        'septembre': 8, 'octobre': 9, 'novembre': 10, 'décembre': 11
    };

    for (const { pattern, type } of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            let date: Date | undefined;
            if (match[2] && moisFr[match[2].toLowerCase()] !== undefined) {
                date = new Date(parseInt(match[3]), moisFr[match[2].toLowerCase()], parseInt(match[1]));
            } else if (match.length === 4) {
                date = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
            }
            if (date && !isNaN(date.getTime())) {
                if (type === 'signature' || !metadata.dateSignature) {
                    metadata.dateSignature = date;
                }
            }
        }
    }

    // Extraction des signataires
    const signatairePatterns = [
        /(?:Le\s+)?Président\s+de\s+la\s+R[ée]publique[,:]?\s*([A-ZÀ-Ü][a-zà-ü]+(?:\s+[A-ZÀ-Ü][a-zà-ü]+)+)/gi,
        /(?:Le\s+)?Premier\s+Ministre[,:]?\s*([A-ZÀ-Ü][a-zà-ü]+(?:\s+[A-ZÀ-Ü][a-zà-ü]+)+)/gi,
        /(?:Le\s+)?Ministre\s+(?:de\s+)?[^,\n]+[,:]?\s*([A-ZÀ-Ü][a-zà-ü]+(?:\s+[A-ZÀ-Ü][a-zà-ü]+)+)/gi
    ];

    const signataires: string[] = [];
    for (const pattern of signatairePatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            if (match[1] && !signataires.includes(match[1])) {
                signataires.push(match[1]);
            }
        }
    }
    if (signataires.length > 0) {
        metadata.signataires = signataires;
    }

    // Extraction des références (abrogation, modification, etc.)
    const refPatterns = [
        { pattern: /abroge(?:ant)?\s+(?:la\s+|le\s+|l[''])?(?:loi|ordonnance|décret|arrêté)[^.]*?(?:n[°o]?\s*)?([A-Z]?\/?\d{4}\/\d{3}[^\s.]*)/gi, type: 'abroge' as const },
        { pattern: /modifi(?:ant|e)\s+(?:la\s+|le\s+|l[''])?(?:loi|ordonnance|décret|arrêté)[^.]*?(?:n[°o]?\s*)?([A-Z]?\/?\d{4}\/\d{3}[^\s.]*)/gi, type: 'modifie' as const },
        { pattern: /compléter?\s+(?:la\s+|le\s+|l[''])?(?:loi|ordonnance|décret|arrêté)[^.]*?(?:n[°o]?\s*)?([A-Z]?\/?\d{4}\/\d{3}[^\s.]*)/gi, type: 'complete' as const },
        { pattern: /(?:en\s+)?application\s+de\s+(?:la\s+|le\s+|l[''])?(?:loi|ordonnance|décret|arrêté)[^.]*?(?:n[°o]?\s*)?([A-Z]?\/?\d{4}\/\d{3}[^\s.]*)/gi, type: 'applique' as const }
    ];

    for (const { pattern, type } of refPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            if (match[1]) {
                metadata.references!.push({
                    type,
                    texteRef: match[1].toUpperCase(),
                    description: match[0].substring(0, 200)
                });
            }
        }
    }

    return metadata;
}

/**
 * Extraction de la structure du document
 */
export function extractStructure(text: string): DocumentStructure {
    const structure: DocumentStructure = {
        sections: [],
        articles: []
    };

    // Extraction des visas
    const visasMatch = text.match(/Vu\s+[^;]+;/gi);
    if (visasMatch) {
        structure.visas = visasMatch.map(v => v.trim());
    }

    // Extraction du préambule (texte avant le premier article)
    const firstArticleIndex = text.search(/Article\s+(?:premier|1er|1)\b/i);
    if (firstArticleIndex > 0) {
        structure.preambule = text.substring(0, firstArticleIndex).trim();
    }

    // Patterns pour sections
    const sectionPatterns: { pattern: RegExp; type: SectionNode['type']; niveau: number }[] = [
        { pattern: /LIVRE\s+([IVX\d]+|PREMIER)(?:[\s\-:]+(.+))?/gi, type: 'LIVRE', niveau: 1 },
        { pattern: /PARTIE\s+([IVX\d]+|PREMIERE)(?:[\s\-:]+(.+))?/gi, type: 'PARTIE', niveau: 1 },
        { pattern: /TITRE\s+([IVX\d]+|PREMIER)(?:[\s\-:]+(.+))?/gi, type: 'TITRE', niveau: 2 },
        { pattern: /CHAPITRE\s+([IVX\d]+|PREMIER)(?:[\s\-:]+(.+))?/gi, type: 'CHAPITRE', niveau: 3 },
        { pattern: /Section\s+([IVX\d]+|première)(?:[\s\-:]+(.+))?/gi, type: 'SECTION', niveau: 4 },
        { pattern: /Sous-section\s+([IVX\d]+)(?:[\s\-:]+(.+))?/gi, type: 'SOUS_SECTION', niveau: 5 },
        { pattern: /§\s*(\d+)(?:[\s\-:]+(.+))?/gi, type: 'PARAGRAPHE', niveau: 6 }
    ];

    // Créer un index de toutes les sections avec leurs positions
    const sectionMatches: { match: RegExpExecArray; type: SectionNode['type']; niveau: number }[] = [];

    for (const { pattern, type, niveau } of sectionPatterns) {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            sectionMatches.push({ match, type, niveau });
        }
    }

    // Trier par position dans le texte
    sectionMatches.sort((a, b) => a.match.index! - b.match.index!);

    // Construire l'arbre des sections
    const sectionStack: SectionNode[] = [];

    for (const { match, type, niveau } of sectionMatches) {
        const section: SectionNode = {
            id: uuidv4(),
            type,
            numero: match[1],
            titre: match[2]?.trim() || '',
            niveau,
            children: [],
            articles: []
        };

        // Trouver le parent approprié
        while (sectionStack.length > 0 && sectionStack[sectionStack.length - 1].niveau >= niveau) {
            sectionStack.pop();
        }

        if (sectionStack.length > 0) {
            sectionStack[sectionStack.length - 1].children.push(section);
        } else {
            structure.sections.push(section);
        }

        sectionStack.push(section);
    }

    // Extraction des articles avec pattern amélioré
    // Gère: "Article 123", "Article premier", "Article 1er", "Art. 123", "Art 123"
    // Capture tout le contenu jusqu'au prochain article ou fin de texte
    const articlePattern = /(?:Article|Art\.?)\s+(?:i+|premier|1er|[\dIVXLCDM]+)(?:\s*[.:\-#]?\s*)[\s\S]*?(?=(?:Article|Art\.?)\s+(?:i+|premier|1er|[\dIVXLCDM]+)|$)/gi;

    const articleMatches = text.match(articlePattern);

    if (articleMatches) {
        let ordre = 0;

        for (const articleText of articleMatches) {
            ordre++;

            // Extraire le numéro de l'article
            const numeroMatch = articleText.match(/(?:Article|Art\.?)\s+(i+|premier|1er|[\dIVXLCDM]+)/i);
            if (!numeroMatch) continue;

            let numero = numeroMatch[1];

            // Normaliser les numéros
            if (numero.toLowerCase() === 'premier' || numero === '1er') {
                numero = '1';
            } else if (/^i+$/i.test(numero)) {
                // Convertir les chiffres romains en minuscules en numéros
                const romanMap: { [key: string]: number } = {
                    'i': 1, 'ii': 2, 'iii': 3, 'iv': 4, 'v': 5,
                    'vi': 6, 'vii': 7, 'viii': 8, 'ix': 9, 'x': 10
                };
                const romanLower = numero.toLowerCase();
                numero = (romanMap[romanLower] || numero).toString();
            }

            // Extraire le titre (optionnel, sur la même ligne que "Article")
            const titleMatch = articleText.match(/(?:Article|Art\.?)\s+(?:i+|premier|1er|[\dIVXLCDM]+)\s*[.:\-#]?\s*([^\n]+)?/i);
            const titre = titleMatch && titleMatch[1] ? titleMatch[1].trim() : undefined;

            // Extraire le contenu (tout après la première ligne)
            const contentLines = articleText.split('\n');
            const contenu = contentLines.slice(1).join('\n').trim()
                // Nettoyer les caractères spéciaux
                .replace(/\s+/g, ' ')
                .replace(/\s*#\s*/g, ' ')
                .trim();

            // Ignorer les articles vides, trop courts ou ressemblant à une Table des Matières
            // ToC detection: termine par un chiffre, contient des points de suite, ou très court
            if (contenu.length < 20 ||
                /(\.{3,}|…)\s*\d+\s*$/.test(contenu) ||
                /^\s*\d+\s*$/.test(contenu)) {
                continue;
            }

            // Découper en alinéas
            const alineas = contenu
                .split(/\n+/)
                .map(a => a.trim())
                .filter(a => a.length > 0);

            const article: ArticleNode = {
                id: uuidv4(),
                numero,
                titre,
                contenu,
                alineas: alineas.length > 0 ? alineas : [contenu],
                etat: 'VIGUEUR',
                references: []
            };

            // Détecter les références dans l'article
            if (/abrog[ée]/i.test(contenu)) {
                article.references.push({ type: 'abroge', texteRef: 'AUTO', description: 'Mentionné dans le texte' });
            }
            if (/modifi[ée]/i.test(contenu)) {
                article.references.push({ type: 'modifie', texteRef: 'AUTO', description: 'Mentionné dans le texte' });
            }

            structure.articles.push(article);
        }
    }

    return structure;
}

/**
 * Génération de la sortie JSON structurée
 */
export function generateJSON(metadata: DocumentMetadata, structure: DocumentStructure): object {
    return {
        document: {
            identification: {
                titre: metadata.titre,
                titreComplet: metadata.titreComplet,
                numero: metadata.numero,
                nature: metadata.nature,
                dateSignature: metadata.dateSignature?.toISOString(),
                datePublication: metadata.datePublication?.toISOString()
            },
            signataires: metadata.signataires,
            visas: structure.visas,
            preambule: structure.preambule,
            references: metadata.references,
            structure: {
                sections: structure.sections,
                articles: structure.articles.map(a => ({
                    numero: a.numero,
                    titre: a.titre,
                    contenu: a.contenu,
                    alineas: a.alineas,
                    etat: a.etat
                }))
            },
            annexes: structure.annexes
        },
        meta: {
            extractedAt: new Date().toISOString(),
            version: '1.0'
        }
    };
}

/**
 * Génération de la sortie HTML formatée
 */
export function generateHTML(metadata: DocumentMetadata, structure: DocumentStructure): string {
    let html = `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(metadata.titre || 'Document juridique')}</title>
    <style>
        body { font-family: 'Georgia', serif; max-width: 800px; margin: 0 auto; padding: 2rem; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 2rem; border-bottom: 2px solid #333; padding-bottom: 1rem; }
        .titre { font-size: 1.5rem; font-weight: bold; margin-bottom: 0.5rem; }
        .meta { color: #666; font-size: 0.9rem; }
        .visas { font-style: italic; margin: 1rem 0; padding: 1rem; background: #f5f5f5; }
        .section { margin: 2rem 0; }
        .section-titre { font-weight: bold; text-transform: uppercase; margin: 1.5rem 0 1rem; }
        .section-niveau-1 { font-size: 1.3rem; border-bottom: 1px solid #333; }
        .section-niveau-2 { font-size: 1.2rem; }
        .section-niveau-3 { font-size: 1.1rem; }
        .article { margin: 1.5rem 0; padding-left: 1rem; border-left: 3px solid #0066cc; }
        .article-numero { font-weight: bold; color: #0066cc; }
        .article-contenu { text-align: justify; }
        .alinea { margin: 0.5rem 0; }
        .signataires { margin-top: 3rem; text-align: right; }
        .signataire { margin: 0.5rem 0; }
        @media print { body { font-size: 11pt; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="titre">${escapeHtml(metadata.titre || '')}</div>
        <div class="meta">
            ${metadata.numero ? `<span>N° ${escapeHtml(metadata.numero)}</span>` : ''}
            ${metadata.dateSignature ? `<span> - ${formatDateFr(metadata.dateSignature)}</span>` : ''}
        </div>
    </div>
`;

    // Visas
    if (structure.visas && structure.visas.length > 0) {
        html += `    <div class="visas">\n`;
        for (const visa of structure.visas) {
            html += `        <p>${escapeHtml(visa)}</p>\n`;
        }
        html += `    </div>\n`;
    }

    // Préambule
    if (structure.preambule) {
        html += `    <div class="preambule"><p>${escapeHtml(structure.preambule)}</p></div>\n`;
    }

    // Sections
    function renderSection(section: SectionNode, depth: number = 0): string {
        let sectionHtml = `    <div class="section section-niveau-${section.niveau}">\n`;
        sectionHtml += `        <div class="section-titre">${escapeHtml(section.type)} ${escapeHtml(section.numero)}${section.titre ? ' - ' + escapeHtml(section.titre) : ''}</div>\n`;

        for (const child of section.children) {
            sectionHtml += renderSection(child, depth + 1);
        }

        for (const article of section.articles) {
            sectionHtml += renderArticle(article);
        }

        sectionHtml += `    </div>\n`;
        return sectionHtml;
    }

    function renderArticle(article: ArticleNode): string {
        let articleHtml = `        <div class="article" id="article-${article.numero}">\n`;
        articleHtml += `            <div class="article-numero">Article ${escapeHtml(article.numero)}</div>\n`;
        if (article.titre) {
            articleHtml += `            <div class="article-titre">${escapeHtml(article.titre)}</div>\n`;
        }
        articleHtml += `            <div class="article-contenu">\n`;
        for (const alinea of article.alineas) {
            articleHtml += `                <p class="alinea">${escapeHtml(alinea)}</p>\n`;
        }
        articleHtml += `            </div>\n`;
        articleHtml += `        </div>\n`;
        return articleHtml;
    }

    for (const section of structure.sections) {
        html += renderSection(section);
    }

    // Articles hors sections
    for (const article of structure.articles) {
        html += renderArticle(article);
    }

    // Signataires
    if (metadata.signataires && metadata.signataires.length > 0) {
        html += `    <div class="signataires">\n`;
        for (const signataire of metadata.signataires) {
            html += `        <div class="signataire">${escapeHtml(signataire)}</div>\n`;
        }
        html += `    </div>\n`;
    }

    html += `</body>\n</html>`;
    return html;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatDateFr(date: Date): string {
    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Pipeline complet d'extraction
 */
export async function processDocument(filePath: string): Promise<ExtractedDocument> {
    // 1. Extraction du texte
    const ocrResult = await extractTextFromPdf(filePath);

    // 2. Nettoyage
    const cleanedText = cleanText(ocrResult.text);

    // 3. Extraction des métadonnées
    const metadata = extractMetadata(cleanedText);

    // 4. Extraction de la structure
    const structure = extractStructure(cleanedText);

    // 5. Génération des sorties
    const json = generateJSON(metadata, structure);
    const html = generateHTML(metadata, structure);

    return {
        rawText: ocrResult.text,
        cleanedText,
        metadata,
        structure,
        json,
        html
    };
}
