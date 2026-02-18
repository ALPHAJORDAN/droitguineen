/**
 * Routes d'export des documents juridiques (PDF/DOCX)
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { exportToPDF, exportToDOCX, ExportOptions } from '../lib/document-export';

const router = Router();

/**
 * GET /export/pdf/:id - Exporter un texte en PDF
 */
router.get('/pdf/:id', async (req: Request, res: Response) => {
    try {
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
            watermark: watermark as string | undefined
        };

        // Récupérer le texte avec ses articles et sections
        const texte = await prisma.texte.findUnique({
            where: { id },
            include: {
                articles: {
                    orderBy: { ordre: 'asc' },
                    where: { sectionId: null } // Articles sans section
                },
                sections: {
                    orderBy: { ordre: 'asc' },
                    where: { parentId: null },
                    include: {
                        articles: { orderBy: { ordre: 'asc' } },
                        enfants: {
                            orderBy: { ordre: 'asc' },
                            include: {
                                articles: { orderBy: { ordre: 'asc' } },
                                enfants: {
                                    orderBy: { ordre: 'asc' },
                                    include: {
                                        articles: { orderBy: { ordre: 'asc' } },
                                        enfants: {
                                            orderBy: { ordre: 'asc' },
                                            include: {
                                                articles: { orderBy: { ordre: 'asc' } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!texte) {
            return res.status(404).json({ error: 'Texte non trouvé' });
        }

        // Générer le PDF
        const pdfBuffer = await exportToPDF(texte, options);

        // Créer un nom de fichier sécurisé
        const safeFilename = texte.titre
            .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);

        // Envoyer le PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error exporting to PDF:', error);
        res.status(500).json({ error: 'Erreur lors de l\'export PDF' });
    }
});

/**
 * GET /export/docx/:id - Exporter un texte en DOCX
 */
router.get('/docx/:id', async (req: Request, res: Response) => {
    try {
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

        // Récupérer le texte avec ses articles et sections
        const texte = await prisma.texte.findUnique({
            where: { id },
            include: {
                articles: {
                    orderBy: { ordre: 'asc' },
                    where: { sectionId: null }
                },
                sections: {
                    orderBy: { ordre: 'asc' },
                    where: { parentId: null },
                    include: {
                        articles: { orderBy: { ordre: 'asc' } },
                        enfants: {
                            orderBy: { ordre: 'asc' },
                            include: {
                                articles: { orderBy: { ordre: 'asc' } },
                                enfants: {
                                    orderBy: { ordre: 'asc' },
                                    include: {
                                        articles: { orderBy: { ordre: 'asc' } },
                                        enfants: {
                                            orderBy: { ordre: 'asc' },
                                            include: {
                                                articles: { orderBy: { ordre: 'asc' } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!texte) {
            return res.status(404).json({ error: 'Texte non trouvé' });
        }

        // Générer le DOCX
        const docxBuffer = await exportToDOCX(texte, options);

        // Créer un nom de fichier sécurisé
        const safeFilename = texte.titre
            .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);

        // Envoyer le DOCX
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.docx"`);
        res.setHeader('Content-Length', docxBuffer.length);
        res.send(docxBuffer);

    } catch (error) {
        console.error('Error exporting to DOCX:', error);
        res.status(500).json({ error: 'Erreur lors de l\'export DOCX' });
    }
});

/**
 * GET /export/json/:id - Exporter un texte en JSON structuré
 */
router.get('/json/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Récupérer le texte complet
        const texte = await prisma.texte.findUnique({
            where: { id },
            include: {
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
                sections: {
                    orderBy: { ordre: 'asc' },
                    where: { parentId: null },
                    include: {
                        articles: { orderBy: { ordre: 'asc' } },
                        enfants: {
                            orderBy: { ordre: 'asc' },
                            include: {
                                articles: { orderBy: { ordre: 'asc' } },
                                enfants: {
                                    orderBy: { ordre: 'asc' },
                                    include: {
                                        articles: { orderBy: { ordre: 'asc' } }
                                    }
                                }
                            }
                        }
                    }
                },
                relationsSource: {
                    include: {
                        texteCible: {
                            select: {
                                id: true,
                                titre: true,
                                nature: true,
                                numero: true
                            }
                        }
                    }
                },
                relationsCible: {
                    include: {
                        texteSource: {
                            select: {
                                id: true,
                                titre: true,
                                nature: true,
                                numero: true
                            }
                        }
                    }
                }
            }
        });

        if (!texte) {
            return res.status(404).json({ error: 'Texte non trouvé' });
        }

        // Formater le JSON pour export
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
                modifie: texte.relationsSource.filter(r => r.type === 'MODIFIE'),
                abroge: texte.relationsSource.filter(r => r.type === 'ABROGE'),
                cite: texte.relationsSource.filter(r => r.type === 'CITE'),
                modifiePar: texte.relationsCible.filter(r => r.type === 'MODIFIE'),
                abrogePar: texte.relationsCible.filter(r => r.type === 'ABROGE'),
                citePar: texte.relationsCible.filter(r => r.type === 'CITE')
            },
            exportedAt: new Date().toISOString(),
            source: 'Legifrance-Guinée'
        };

        // Créer un nom de fichier sécurisé
        const safeFilename = texte.titre
            .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.json"`);
        res.json(exportData);

    } catch (error) {
        console.error('Error exporting to JSON:', error);
        res.status(500).json({ error: 'Erreur lors de l\'export JSON' });
    }
});

/**
 * GET /export/html/:id - Exporter un texte en HTML
 */
router.get('/html/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const texte = await prisma.texte.findUnique({
            where: { id },
            include: {
                articles: {
                    orderBy: { ordre: 'asc' },
                    where: { sectionId: null }
                },
                sections: {
                    orderBy: { ordre: 'asc' },
                    where: { parentId: null },
                    include: {
                        articles: { orderBy: { ordre: 'asc' } },
                        enfants: {
                            orderBy: { ordre: 'asc' },
                            include: {
                                articles: { orderBy: { ordre: 'asc' } }
                            }
                        }
                    }
                }
            }
        });

        if (!texte) {
            return res.status(404).json({ error: 'Texte non trouvé' });
        }

        // Générer le HTML
        const html = generateHTML(texte);

        const safeFilename = texte.titre
            .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s-]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.html"`);
        res.send(html);

    } catch (error) {
        console.error('Error exporting to HTML:', error);
        res.status(500).json({ error: 'Erreur lors de l\'export HTML' });
    }
});

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
    
    // Articles sans section
    for (const article of texte.articles) {
        articlesHtml += `
            <div class="article">
                <h3 class="article-title">Article ${article.numero}</h3>
                <p class="article-content">${article.contenu.replace(/\n/g, '<br>')}</p>
            </div>
        `;
    }

    // Sections
    function renderSections(sections: typeof texte.sections, level: number = 1): string {
        let html = '';
        for (const section of sections) {
            const tag = `h${Math.min(level + 2, 6)}`;
            html += `<${tag} class="section-title level-${level}">${section.titre}</${tag}>`;
            
            for (const article of section.articles) {
                html += `
                    <div class="article">
                        <h4 class="article-title">Article ${article.numero}</h4>
                        <p class="article-content">${article.contenu.replace(/\n/g, '<br>')}</p>
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
    <title>${texte.titre}</title>
    <style>
        body {
            font-family: 'Times New Roman', Times, serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
        }
        .republic {
            font-weight: bold;
            font-size: 14px;
        }
        .motto {
            font-style: italic;
            color: #666;
            margin-top: 5px;
        }
        h1 {
            font-size: 24px;
            text-transform: uppercase;
            margin: 30px 0 10px;
        }
        .meta {
            font-style: italic;
            color: #666;
        }
        .visas {
            font-style: italic;
            color: #444;
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-left: 3px solid #ccc;
        }
        .section-title {
            color: #003366;
            margin-top: 30px;
        }
        .article {
            margin: 20px 0;
            padding-left: 20px;
        }
        .article-title {
            color: #003366;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .article-content {
            text-align: justify;
        }
        .signataires {
            margin-top: 50px;
            text-align: right;
        }
        .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
        @media print {
            body { padding: 20px; }
            .article { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="republic">RÉPUBLIQUE DE GUINÉE</div>
        <div class="motto">Travail - Justice - Solidarité</div>
    </div>
    
    <h1>${texte.titre}</h1>
    ${texte.numero || texte.dateSignature ? `
        <p class="meta">
            ${texte.numero ? `N° ${texte.numero}` : ''}
            ${texte.dateSignature ? `du ${formatDate(texte.dateSignature)}` : ''}
        </p>
    ` : ''}
    
    ${texte.visas ? `<div class="visas">${texte.visas.replace(/\n/g, '<br>')}</div>` : ''}
    
    <div class="content">
        ${articlesHtml}
        ${sectionsHtml}
    </div>
    
    ${texte.signataires ? `<div class="signataires">${texte.signataires.replace(/\n/g, '<br>')}</div>` : ''}
    
    <div class="footer">
        <p>Document exporté depuis Legifrance-Guinée</p>
        <p>Date d'export : ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
</body>
</html>`;
}

export default router;
