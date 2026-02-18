import fs from 'fs';
import prisma from '../lib/prisma';
import { indexTexte } from '../lib/meilisearch';
import { Nature, EtatTexte } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { log } from '../utils/logger';
import { cleanupOnError } from '../middlewares/upload.middleware';
import { isVisionAvailable, processImageFileWithVision } from '../lib/google-vision-ocr';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse-fork');

// Interfaces
export interface ArticleContent {
  numero: string;
  contenu: string;
}

export interface SectionContent {
  titre: string;
  niveau: number;
  type: 'LIVRE' | 'TITRE' | 'CHAPITRE' | 'SECTION';
  subSections: SectionContent[];
  articles: ArticleContent[];
}

export interface ExtractedMetadata {
  titre?: string;
  numero?: string;
  nature?: Nature;
  dateSignature?: Date;
}

export interface PdfExtractionResult {
  text: string;
  method: 'native' | 'ocr';
  metadata: ExtractedMetadata;
  articles: ArticleContent[];
  sections: SectionContent[];
  isCode: boolean;
}

export interface CreateTexteFromPdfOptions {
  cid: string;
  titre: string;
  nature: Nature;
  sousCategorie?: string;
  numero?: string;
  dateSignature?: string;
  datePublication?: string;
  sourceJO?: string;
  filePath: string;
  articles?: ArticleContent[];
  sections?: SectionContent[];
}

class UploadService {
  /**
   * Extract text from PDF using native extraction or OCR
   */
  async extractTextFromPdf(filePath: string): Promise<{ text: string; method: 'native' | 'ocr' }> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);

      // If extracted text is sufficient, use native extraction
      if (pdfData.text && pdfData.text.trim().length > 100) {
        return { text: pdfData.text, method: 'native' };
      }

      // Otherwise, use Google Cloud Vision OCR for scanned PDFs
      log.info('PDF appears to be scanned, attempting OCR...', { filePath });
      
      // Check if Google Cloud Vision is available
      if (!isVisionAvailable()) {
        log.warn('Google Cloud Vision not available, checking for partial text');
        
        // If we have some text from native extraction, use it
        if (pdfData.text && pdfData.text.trim().length > 0) {
          log.info('Using partial native extraction as fallback');
          return { text: pdfData.text, method: 'native' };
        }
        
        throw new AppError(
          500,
          'Le PDF semble être scanné et l\'OCR n\'est pas disponible. Veuillez configurer Google Cloud Vision ou utiliser un PDF avec du texte sélectionnable.'
        );
      }
      
      try {
        log.info('Using Google Cloud Vision OCR...', { filePath });
        const result = await processImageFileWithVision(filePath);
        
        if (!result.text || result.text.trim().length === 0) {
          throw new Error('No text extracted from OCR');
        }
        
        log.info('Google Cloud Vision OCR completed', { 
          confidence: result.confidence,
          textLength: result.text.length 
        });
        
        return { text: result.text, method: 'ocr' };
      } catch (visionError) {
        log.error('Google Cloud Vision OCR failed', visionError as Error);
        
        // Fallback to partial native extraction if available
        if (pdfData.text && pdfData.text.trim().length > 0) {
          log.warn('Falling back to partial native extraction after OCR failure');
          return { text: pdfData.text, method: 'native' };
        }
        
        throw new AppError(
          500,
          'Impossible d\'extraire le texte du PDF. L\'OCR a échoué et aucun texte natif n\'est disponible.'
        );
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      log.error('Error extracting text from PDF', error as Error);
      throw new AppError(500, 'Impossible d\'extraire le texte du PDF');
    }
  }

  /**
   * Parse metadata from extracted text
   */
  parseMetadataFromText(text: string): ExtractedMetadata {
    const lines = text.split('\n').filter((line) => line.trim());

    // Find title (usually in first significant lines)
    let titre = '';
    for (const line of lines.slice(0, 10)) {
      if (line.length > 20 && line.length < 300) {
        titre = line.trim();
        break;
      }
    }

    // Find number (format L/2023/001 or D/2023/045, etc.)
    const numeroMatch = text.match(/[LODA]\/\d{4}\/\d{3}(\/[A-Z]+)?/i);
    const numero = numeroMatch ? numeroMatch[0].toUpperCase() : undefined;

    // Determine nature
    let nature: Nature = Nature.AUTRE;
    const textLower = text.toLowerCase();

    if (textLower.includes('constitution') || textLower.includes('loi constitutionnelle')) {
      nature = Nature.LOI_CONSTITUTIONNELLE;
    } else if (textLower.includes('ordonnance')) {
      nature = Nature.ORDONNANCE;
    } else if (textLower.includes('décret') || textLower.includes('decret')) {
      nature = Nature.DECRET;
    } else if (textLower.includes('arrêté') || textLower.includes('arrete')) {
      nature = Nature.ARRETE;
    } else if (textLower.includes('loi organique')) {
      nature = Nature.LOI_ORGANIQUE;
    } else if (textLower.includes('code')) {
      nature = Nature.CODE;
    } else if (textLower.includes('loi')) {
      nature = Nature.LOI;
    }

    // Find date (format DD/MM/YYYY)
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    let dateSignature: Date | undefined;
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      dateSignature = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }

    return { titre, numero, nature, dateSignature };
  }

  /**
   * Extract articles from text (flat list)
   */
  extractArticles(text: string): ArticleContent[] {
    const articlePattern =
      /(?:Article|Art\.?)\s*(\d+|premier|1er)[\.\-:\s][\s\S]*?(?=(?:Article|Art\.?)\s*(?:\d+|premier|1er)[\.\-:\s]|(?:^|\n)\s*(?:LIVRE|TITRE|CHAPITRE|Livre|Titre|Chapitre)\s+|$)/gi;
    const articles: ArticleContent[] = [];
    const articleMatches = text.match(articlePattern);

    if (!articleMatches) return articles;

    for (const articleText of articleMatches) {
      const numeroMatch = articleText.match(/(?:Article|Art\.?)\s*(\d+|premier|1er)/i);
      if (!numeroMatch) continue;

      let numero = numeroMatch[1];
      if (numero.toLowerCase() === 'premier' || numero === '1er') {
        numero = '1';
      }

      let contenu = articleText
        .replace(/^(?:Article|Art\.?)\s*(?:\d+|premier|1er)[\.\-:\s]*/i, '')
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/[\u00AD]/g, '')
        .replace(/[\u2010-\u2015]/g, '-')
        .replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/\u2026/g, '...')
        .replace(/\u00A0/g, ' ')
        .substring(0, 50000);

      // Skip empty, too short, or table of contents entries
      if (
        contenu.length < 20 ||
        /(\.{3,}|…)\s*\d+\s*$/.test(contenu) ||
        /^\s*\d+\s*$/.test(contenu)
      ) {
        continue;
      }

      if (contenu.length > 0) {
        articles.push({ numero, contenu });
      }
    }

    return articles;
  }

  /**
   * Extract hierarchical structure from text (for Codes)
   */
  extractStructureFromText(text: string): SectionContent[] {
    const lines = text.split('\n');
    const rootSections: SectionContent[] = [];
    const stack: SectionContent[] = [];
    let currentArticle: ArticleContent | null = null;
    let buffer: string[] = [];

    const patterns = {
      livre: /^\s*(?:LIVRE)\s+([A-Z0-9]+|PREMIER|I|II|III|IV|V|VI|VII|VIII|IX|X)(?:[\s\-–:.]+(.+))?$/i,
      titre: /^\s*(?:TITRE)\s+([A-Z0-9]+|I|II|III|IV|V|VI|VII|VIII|IX|X)(?:[\s\-–:.]+(.+))?$/i,
      chapitre: /^\s*(?:CHAPITRE)\s+([A-Z0-9]+|I|II|III|IV|V|VI|VII|VIII|IX|X)(?:[\s\-–:.]+(.+))?$/i,
      section: /^\s*(?:Section)\s+([A-Z0-9]+|I|II|III|IV|V|VI|VII|VIII|IX|X)(?:[\s\-–:.]+(.+))?$/i,
      article: /^\s*(?:Article|Art\.?)\s*(\d+|premier|1er|unique|I|II|III|IV|V|VI|VII|VIII|IX|X)(.*)$/i,
    };

    const flushArticle = () => {
      if (currentArticle) {
        currentArticle.contenu += buffer.join('\n').trim();
        buffer = [];

        if (stack.length > 0) {
          stack[stack.length - 1].articles.push(currentArticle);
        }
        currentArticle = null;
      } else if (buffer.length > 0) {
        buffer = [];
      }
    };

    const createSection = (
      type: 'LIVRE' | 'TITRE' | 'CHAPITRE' | 'SECTION',
      titre: string,
      niveau: number
    ) => {
      flushArticle();
      const newSection: SectionContent = {
        titre: titre || type,
        niveau,
        type,
        subSections: [],
        articles: [],
      };

      while (stack.length > 0 && stack[stack.length - 1].niveau >= niveau) {
        stack.pop();
      }

      if (stack.length > 0) {
        stack[stack.length - 1].subSections.push(newSection);
      } else {
        rootSections.push(newSection);
      }
      stack.push(newSection);
    };

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      if (patterns.livre.test(trimmedLine)) {
        createSection('LIVRE', trimmedLine, 1);
        continue;
      }
      if (patterns.titre.test(trimmedLine)) {
        createSection('TITRE', trimmedLine, 2);
        continue;
      }
      if (patterns.chapitre.test(trimmedLine)) {
        createSection('CHAPITRE', trimmedLine, 3);
        continue;
      }
      if (patterns.section.test(trimmedLine)) {
        createSection('SECTION', trimmedLine, 4);
        continue;
      }

      const articleMatch = trimmedLine.match(patterns.article);
      if (articleMatch) {
        flushArticle();
        let numero = articleMatch[1];
        if (numero.toLowerCase() === 'premier') numero = '1';

        currentArticle = {
          numero,
          contenu: trimmedLine.replace(patterns.article, '').trim() + '\n',
        };
        continue;
      }

      if (currentArticle) {
        buffer.push(trimmedLine);
      }
    }

    flushArticle();
    return rootSections;
  }

  /**
   * Count articles in section tree
   */
  countArticles(section: SectionContent): number {
    let count = section.articles.length;
    for (const sub of section.subSections) {
      count += this.countArticles(sub);
    }
    return count;
  }

  /**
   * Process a PDF file and extract all data
   */
  async processPdf(filePath: string, originalFilename: string): Promise<PdfExtractionResult> {
    const { text, method } = await this.extractTextFromPdf(filePath);
    const metadata = this.parseMetadataFromText(text);

    // Determine if it's a Code
    const isCode =
      metadata.nature === Nature.CODE ||
      (metadata.titre && metadata.titre.toLowerCase().includes('code')) ||
      text.substring(0, 1000).toLowerCase().includes('code');

    let sections: SectionContent[] = [];
    let articles: ArticleContent[] = [];

    if (isCode) {
      sections = this.extractStructureFromText(text);
      if (sections.length === 0) {
        articles = this.extractArticles(text);
      }
    } else {
      articles = this.extractArticles(text);
    }

    // Use filename as fallback title
    if (!metadata.titre) {
      metadata.titre = originalFilename.replace('.pdf', '');
    }

    return {
      text,
      method,
      metadata,
      articles,
      sections,
      isCode,
    };
  }

  /**
   * Create sections recursively in database
   */
  async createSectionsRecursively(
    sections: SectionContent[],
    parentId: string | null,
    texteId: string,
    startIndex: { value: number }
  ): Promise<void> {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      const createdSection = await prisma.section.create({
        data: {
          cid: `LEGITEXT${Date.now()}-S-${Math.random().toString(36).substr(2, 9)}`,
          titre: section.titre,
          niveau: section.niveau,
          ordre: i + 1,
          texteId,
          parentId,
        },
      });

      if (section.articles.length > 0) {
        await prisma.article.createMany({
          data: section.articles.map((article, idx) => ({
            cid: `LEGITEXT${Date.now()}-ART-${startIndex.value + idx}`,
            numero: article.numero,
            contenu: article.contenu,
            ordre: startIndex.value + idx,
            texteId,
            sectionId: createdSection.id,
            etat: EtatTexte.VIGUEUR,
          })),
        });
        startIndex.value += section.articles.length;
      }

      if (section.subSections.length > 0) {
        await this.createSectionsRecursively(
          section.subSections,
          createdSection.id,
          texteId,
          startIndex
        );
      }
    }
  }

  /**
   * Create texte from processed PDF
   */
  async createTexteFromPdf(options: CreateTexteFromPdfOptions) {
    const {
      cid,
      titre,
      nature,
      sousCategorie,
      numero,
      dateSignature,
      datePublication,
      sourceJO,
      filePath,
      articles = [],
      sections = [],
    } = options;

    try {
      const texte = await prisma.texte.create({
        data: {
          cid,
          titre,
          nature,
          sousCategorie: sousCategorie || null,
          numero,
          dateSignature: dateSignature ? new Date(dateSignature) : null,
          datePublication: datePublication ? new Date(datePublication) : null,
          etat: EtatTexte.VIGUEUR,
          sourceJO,
          fichierPdf: filePath,
        },
      });

      // Save hierarchical or flat structure
      if (sections.length > 0) {
        await this.createSectionsRecursively(sections, null, texte.id, { value: 1 });
      } else if (articles.length > 0) {
        await prisma.article.createMany({
          data: articles.map((article, index) => ({
            cid: `${cid}-ART-${index + 1}`,
            numero: article.numero,
            contenu: article.contenu,
            ordre: index + 1,
            texteId: texte.id,
            etat: EtatTexte.VIGUEUR,
          })),
        });
      }

      const texteComplete = await prisma.texte.findUnique({
        where: { id: texte.id },
        include: { articles: true, sections: true },
      });

      // Index in Meilisearch
      if (texteComplete) {
        try {
          await indexTexte(texteComplete);
        } catch (e) {
          log.warn('Meilisearch indexing failed', { texteId: texte.id, error: e });
        }
      }

      log.info('Texte created from PDF', { texteId: texte.id, cid });

      return texteComplete;
    } catch (error) {
      // Cleanup file on database error
      cleanupOnError(filePath);
      throw error;
    }
  }

  /**
   * Get list of uploaded files
   */
  async getUploadedFiles(limit: number = 100) {
    const textes = await prisma.texte.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        titre: true,
        nature: true,
        fichierPdf: true,
        etat: true,
        createdAt: true,
      },
    });

    return textes.map((t) => ({
      id: t.id,
      name: t.titre || 'Sans titre',
      type: t.nature || 'AUTRE',
      size: t.fichierPdf ? 'PDF' : 'Texte',
      uploadDate: new Date(t.createdAt).toLocaleDateString('fr-FR'),
      status: t.etat === 'VIGUEUR' ? ('processed' as const) : ('processing' as const),
    }));
  }

  /**
   * Delete an uploaded file and its texte
   */
  async deleteUploadedFile(id: string) {
    const texte = await prisma.texte.findUnique({
      where: { id },
      select: { fichierPdf: true },
    });

    if (!texte) {
      throw new AppError(404, 'Texte non trouvé');
    }

    await prisma.texte.delete({ where: { id } });

    // Delete PDF file from disk if present
    if (texte.fichierPdf && fs.existsSync(texte.fichierPdf)) {
      try {
        fs.unlinkSync(texte.fichierPdf);
        log.info('File deleted', { filePath: texte.fichierPdf });
      } catch (fileError) {
        log.warn('Could not delete file', { filePath: texte.fichierPdf, error: fileError });
      }
    }

    log.info('Uploaded file deleted', { id });
  }
}

export const uploadService = new UploadService();
export default uploadService;
