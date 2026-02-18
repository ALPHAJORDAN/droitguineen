/**
 * Module d'export de documents juridiques vers PDF et DOCX
 */

import { PDFDocument, StandardFonts, rgb, PageSizes, degrees } from 'pdf-lib';
import {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    Header,
    Footer,
    PageNumber,
    convertInchesToTwip,
} from 'docx';
import { Texte, Article, Section } from '@prisma/client';

export interface ExportOptions {
    includeTableOfContents?: boolean;
    includeMetadata?: boolean;
    includeHeader?: boolean;
    includeFooter?: boolean;
    includePageNumbers?: boolean;
    watermark?: string;
}

interface TexteWithRelations extends Texte {
    articles?: Article[];
    sections?: (Section & {
        articles?: Article[];
        enfants?: Section[];
    })[];
}

/**
 * Export vers PDF formaté
 */
export async function exportToPDF(
    texte: TexteWithRelations,
    options: ExportOptions = {}
): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
    const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

    const pageWidth = PageSizes.A4[0];
    const pageHeight = PageSizes.A4[1];
    const margin = 70;
    const lineHeight = 14;
    const fontSize = {
        title: 16,
        sectionTitle: 14,
        articleTitle: 12,
        body: 11,
        footer: 9
    };

    let currentPage = pdfDoc.addPage(PageSizes.A4);
    let yPosition = pageHeight - margin;

    // Helper pour ajouter une nouvelle page
    function addNewPage(): void {
        currentPage = pdfDoc.addPage(PageSizes.A4);
        yPosition = pageHeight - margin;
        
        if (options.includeHeader) {
            currentPage.drawText('RÉPUBLIQUE DE GUINÉE', {
                x: margin,
                y: pageHeight - 30,
                size: 8,
                font: timesRomanItalic,
                color: rgb(0.4, 0.4, 0.4)
            });
        }
    }

    // Helper pour vérifier l'espace disponible
    function checkSpace(needed: number): void {
        if (yPosition - needed < margin + 50) {
            addNewPage();
        }
    }

    // Helper pour dessiner du texte avec retour à la ligne
    function drawWrappedText(
        text: string,
        x: number,
        maxWidth: number,
        font: typeof timesRoman,
        size: number,
        color = rgb(0, 0, 0),
        align: 'left' | 'center' | 'justify' = 'left'
    ): void {
        const words = text.split(' ');
        let line = '';
        
        for (const word of words) {
            const testLine = line ? `${line} ${word}` : word;
            const textWidth = font.widthOfTextAtSize(testLine, size);
            
            if (textWidth > maxWidth && line) {
                checkSpace(lineHeight);
                
                let drawX = x;
                if (align === 'center') {
                    drawX = x + (maxWidth - font.widthOfTextAtSize(line, size)) / 2;
                }
                
                currentPage.drawText(line, {
                    x: drawX,
                    y: yPosition,
                    size,
                    font,
                    color
                });
                
                yPosition -= lineHeight;
                line = word;
            } else {
                line = testLine;
            }
        }
        
        if (line) {
            checkSpace(lineHeight);
            
            let drawX = x;
            if (align === 'center') {
                drawX = x + (maxWidth - font.widthOfTextAtSize(line, size)) / 2;
            }
            
            currentPage.drawText(line, {
                x: drawX,
                y: yPosition,
                size,
                font,
                color
            });
            
            yPosition -= lineHeight;
        }
    }

    // En-tête de la République
    if (options.includeHeader !== false) {
        currentPage.drawText('RÉPUBLIQUE DE GUINÉE', {
            x: margin,
            y: yPosition,
            size: 10,
            font: timesRomanBold,
            color: rgb(0, 0, 0)
        });
        yPosition -= lineHeight;
        
        currentPage.drawText('Travail - Justice - Solidarité', {
            x: margin,
            y: yPosition,
            size: 9,
            font: timesRomanItalic,
            color: rgb(0.3, 0.3, 0.3)
        });
        yPosition -= lineHeight * 3;
    }

    // Titre du document
    checkSpace(60);
    drawWrappedText(
        (texte.titre || 'Sans titre').toUpperCase(),
        margin,
        pageWidth - 2 * margin,
        timesRomanBold,
        fontSize.title,
        rgb(0, 0, 0),
        'center'
    );
    yPosition -= lineHeight;

    // Numéro et date
    if (texte.numero || texte.dateSignature) {
        const metaText = [
            texte.numero ? `N° ${texte.numero}` : '',
            texte.dateSignature ? `du ${formatDateFr(texte.dateSignature)}` : ''
        ].filter(Boolean).join(' ');
        
        drawWrappedText(
            metaText,
            margin,
            pageWidth - 2 * margin,
            timesRomanItalic,
            fontSize.body,
            rgb(0.3, 0.3, 0.3),
            'center'
        );
    }
    
    yPosition -= lineHeight * 2;

    // Ligne de séparation
    currentPage.drawLine({
        start: { x: margin, y: yPosition },
        end: { x: pageWidth - margin, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0)
    });
    yPosition -= lineHeight * 2;

    // Visas
    if (texte.visas) {
        drawWrappedText(
            texte.visas,
            margin,
            pageWidth - 2 * margin,
            timesRomanItalic,
            fontSize.body - 1,
            rgb(0.2, 0.2, 0.2)
        );
        yPosition -= lineHeight * 2;
    }

    // Articles
    const articles = texte.articles || [];
    for (const article of articles.sort((a, b) => a.ordre - b.ordre)) {
        checkSpace(40);
        
        // Numéro de l'article
        currentPage.drawText(`Article ${article.numero}`, {
            x: margin,
            y: yPosition,
            size: fontSize.articleTitle,
            font: timesRomanBold,
            color: rgb(0, 0.2, 0.5)
        });
        yPosition -= lineHeight * 1.5;
        
        // Contenu de l'article
        drawWrappedText(
            article.contenu,
            margin + 20,
            pageWidth - 2 * margin - 20,
            timesRoman,
            fontSize.body,
            rgb(0, 0, 0),
            'justify'
        );
        yPosition -= lineHeight;
    }

    // Sections (pour les Codes)
    if (texte.sections && texte.sections.length > 0) {
        await renderSectionsPDF(texte.sections, 0);
    }

    async function renderSectionsPDF(sections: TexteWithRelations['sections'], level: number): Promise<void> {
        if (!sections) return;
        
        for (const section of sections) {
            checkSpace(30);
            
            const indentation = level * 20;
            const titleSize = Math.max(fontSize.sectionTitle - level * 2, 10);
            
            currentPage.drawText((section.titre || '').toUpperCase(), {
                x: margin + indentation,
                y: yPosition,
                size: titleSize,
                font: timesRomanBold,
                color: rgb(0, 0.2, 0.4)
            });
            yPosition -= lineHeight * 1.5;
            
            // Articles de cette section
            if (section.articles) {
                for (const article of section.articles.sort((a, b) => a.ordre - b.ordre)) {
                    checkSpace(40);
                    
                    currentPage.drawText(`Article ${article.numero}`, {
                        x: margin + indentation + 10,
                        y: yPosition,
                        size: fontSize.articleTitle,
                        font: timesRomanBold,
                        color: rgb(0, 0.2, 0.5)
                    });
                    yPosition -= lineHeight * 1.5;
                    
                    drawWrappedText(
                        article.contenu,
                        margin + indentation + 30,
                        pageWidth - 2 * margin - indentation - 30,
                        timesRoman,
                        fontSize.body,
                        rgb(0, 0, 0),
                        'justify'
                    );
                    yPosition -= lineHeight;
                }
            }
            
            // Sous-sections récursives
            if (section.enfants) {
                await renderSectionsPDF(section.enfants as TexteWithRelations['sections'], level + 1);
            }
        }
    }

    // Signataires
    if (texte.signataires) {
        yPosition -= lineHeight * 3;
        checkSpace(60);
        
        drawWrappedText(
            texte.signataires,
            pageWidth / 2,
            pageWidth / 2 - margin,
            timesRoman,
            fontSize.body,
            rgb(0, 0, 0)
        );
    }

    // Pied de page avec numéros de page
    if (options.includePageNumbers !== false) {
        const pages = pdfDoc.getPages();
        pages.forEach((page, index) => {
            page.drawText(`Page ${index + 1} / ${pages.length}`, {
                x: pageWidth / 2 - 30,
                y: 30,
                size: fontSize.footer,
                font: timesRoman,
                color: rgb(0.5, 0.5, 0.5)
            });
        });
    }

    // Watermark
    if (options.watermark) {
        const pages = pdfDoc.getPages();
        pages.forEach(page => {
            page.drawText(options.watermark!, {
                x: pageWidth / 4,
                y: pageHeight / 2,
                size: 50,
                font: timesRomanBold,
                color: rgb(0.9, 0.9, 0.9),
                rotate: degrees(45)
            });
        });
    }

    return Buffer.from(await pdfDoc.save());
}

/**
 * Export vers DOCX formaté
 */
export async function exportToDOCX(
    texte: TexteWithRelations,
    options: ExportOptions = {}
): Promise<Buffer> {
    const children: Paragraph[] = [];

    // En-tête République
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: 'RÉPUBLIQUE DE GUINÉE',
                    bold: true,
                    size: 24
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 }
        }),
        new Paragraph({
            children: [
                new TextRun({
                    text: 'Travail - Justice - Solidarité',
                    italics: true,
                    size: 20,
                    color: '666666'
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
        })
    );

    // Titre du document
    children.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: (texte.titre || 'Sans titre').toUpperCase(),
                    bold: true,
                    size: 32
                })
            ],
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
        })
    );

    // Numéro et date
    if (texte.numero || texte.dateSignature) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: [
                            texte.numero ? `N° ${texte.numero}` : '',
                            texte.dateSignature ? `du ${formatDateFr(texte.dateSignature)}` : ''
                        ].filter(Boolean).join(' '),
                        italics: true,
                        size: 22,
                        color: '666666'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );
    }

    // Séparateur
    children.push(
        new Paragraph({
            border: {
                bottom: {
                    style: BorderStyle.SINGLE,
                    size: 6,
                    color: '000000'
                }
            },
            spacing: { after: 400 }
        })
    );

    // Visas
    if (texte.visas) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: texte.visas,
                        italics: true,
                        size: 20,
                        color: '444444'
                    })
                ],
                spacing: { after: 400 }
            })
        );
    }

    // Articles
    const articles = texte.articles || [];
    for (const article of articles.sort((a, b) => a.ordre - b.ordre)) {
        children.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Article ${article.numero}`,
                        bold: true,
                        size: 24,
                        color: '003366'
                    })
                ],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 300, after: 100 }
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: article.contenu,
                        size: 22
                    })
                ],
                alignment: AlignmentType.JUSTIFIED,
                indent: { left: convertInchesToTwip(0.5) },
                spacing: { after: 200 }
            })
        );
    }

    // Sections (Codes)
    function addSections(sections: TexteWithRelations['sections'], level: number = 0): void {
        if (!sections) return;
        
        for (const section of sections) {
            const headingLevel = level === 0 ? HeadingLevel.HEADING_1 :
                                 level === 1 ? HeadingLevel.HEADING_2 :
                                 level === 2 ? HeadingLevel.HEADING_3 :
                                 HeadingLevel.HEADING_4;
            
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: (section.titre || '').toUpperCase(),
                            bold: true,
                            size: 28 - level * 2,
                            color: '003366'
                        })
                    ],
                    heading: headingLevel,
                    spacing: { before: 400, after: 200 }
                })
            );

            // Articles de la section
            if (section.articles) {
                for (const article of section.articles.sort((a, b) => a.ordre - b.ordre)) {
                    children.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `Article ${article.numero}`,
                                    bold: true,
                                    size: 22,
                                    color: '003366'
                                })
                            ],
                            heading: HeadingLevel.HEADING_3,
                            spacing: { before: 200, after: 100 }
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: article.contenu,
                                    size: 22
                                })
                            ],
                            alignment: AlignmentType.JUSTIFIED,
                            indent: { left: convertInchesToTwip(0.3 + level * 0.2) },
                            spacing: { after: 150 }
                        })
                    );
                }
            }

            // Récursion pour sous-sections
            if (section.enfants) {
                addSections(section.enfants as TexteWithRelations['sections'], level + 1);
            }
        }
    }

    if (texte.sections && texte.sections.length > 0) {
        addSections(texte.sections);
    }

    // Signataires
    if (texte.signataires) {
        children.push(
            new Paragraph({
                spacing: { before: 800 }
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: texte.signataires,
                        size: 22
                    })
                ],
                alignment: AlignmentType.RIGHT
            })
        );
    }

    // Création du document
    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: {
                        top: convertInchesToTwip(1),
                        right: convertInchesToTwip(1),
                        bottom: convertInchesToTwip(1),
                        left: convertInchesToTwip(1.2)
                    }
                }
            },
            headers: options.includeHeader !== false ? {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Droitguinéen',
                                    italics: true,
                                    size: 18,
                                    color: '999999'
                                })
                            ],
                            alignment: AlignmentType.RIGHT
                        })
                    ]
                })
            } : undefined,
            footers: options.includePageNumbers !== false ? {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    children: ['Page ', PageNumber.CURRENT, ' / ', PageNumber.TOTAL_PAGES],
                                    size: 18,
                                    color: '999999'
                                })
                            ],
                            alignment: AlignmentType.CENTER
                        })
                    ]
                })
            } : undefined,
            children
        }]
    });

    return Buffer.from(await Packer.toBuffer(doc));
}

function formatDateFr(date: Date): string {
    const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return `${date.getDate()} ${mois[date.getMonth()]} ${date.getFullYear()}`;
}
