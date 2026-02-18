import fs from 'fs';
import prisma from '../lib/prisma';
import { indexTexte, indexArticles } from '../lib/meilisearch';
import { Nature, EtatTexte } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { log } from '../utils/logger';
import { cleanupOnError } from '../middlewares/upload.middleware';
import {
  extractTextFromPdf as pipelineExtractText,
  cleanText,
  extractMetadata,
  extractStructure,
  type OCRResult,
  type SectionNode,
  type ArticleNode,
} from '../lib/ocr-pipeline';

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
  signataires?: string[];
  visas?: string[];
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
  signataires?: string[];
  visas?: string[];
}

class UploadService {
  /**
   * Extract text from PDF using the advanced OCR pipeline
   * Strategy: Native → Google Vision → Tesseract.js
   */
  async extractTextFromPdf(filePath: string): Promise<{ text: string; method: 'native' | 'ocr' }> {
    try {
      const ocrResult: OCRResult = await pipelineExtractText(filePath);
      const cleanedText = cleanText(ocrResult.text);

      // Map 'hybrid' to 'ocr' for backward compatibility
      const method = ocrResult.method === 'hybrid' ? 'ocr' : ocrResult.method;

      log.info('PDF text extraction completed', {
        filePath,
        method: ocrResult.method,
        confidence: Math.round(ocrResult.confidence),
        pages: ocrResult.pages.length,
        textLength: cleanedText.length,
        processingTime: ocrResult.processingTime,
      });

      return { text: cleanedText, method };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      log.error('Error extracting text from PDF', error as Error);
      throw new AppError(500, 'Impossible d\'extraire le texte du PDF');
    }
  }

  /**
   * Parse metadata from extracted text using the advanced pipeline
   */
  parseMetadataFromText(text: string): ExtractedMetadata {
    const pipelineMeta = extractMetadata(text);

    return {
      titre: pipelineMeta.titre,
      numero: pipelineMeta.numero,
      nature: pipelineMeta.nature || Nature.AUTRE,
      dateSignature: pipelineMeta.dateSignature,
    };
  }

  /**
   * Extract articles from text using the advanced pipeline
   */
  extractArticles(text: string): ArticleContent[] {
    const structure = extractStructure(text);
    return structure.articles.map((a) => ({
      numero: a.numero,
      contenu: a.contenu,
    }));
  }

  /**
   * Extract hierarchical structure from text using the advanced pipeline
   */
  extractStructureFromText(text: string): SectionContent[] {
    const structure = extractStructure(text);
    return this.mapSectionNodes(structure.sections);
  }

  /**
   * Map pipeline SectionNode[] to service SectionContent[]
   */
  private mapSectionNodes(nodes: SectionNode[]): SectionContent[] {
    const typeMap: Record<string, SectionContent['type']> = {
      'LIVRE': 'LIVRE',
      'PARTIE': 'LIVRE',
      'TITRE': 'TITRE',
      'SOUS_TITRE': 'TITRE',
      'CHAPITRE': 'CHAPITRE',
      'SECTION': 'SECTION',
      'SOUS_SECTION': 'SECTION',
      'PARAGRAPHE': 'SECTION',
    };

    return nodes.map((node) => ({
      titre: node.titre
        ? `${node.type} ${node.numero} - ${node.titre}`
        : `${node.type} ${node.numero}`,
      niveau: node.niveau,
      type: typeMap[node.type] || 'SECTION',
      subSections: this.mapSectionNodes(node.children),
      articles: node.articles.map((a) => ({
        numero: a.numero,
        contenu: a.contenu,
      })),
    }));
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

    // Extract full metadata including signataires and visas
    const fullMeta = extractMetadata(text);

    // Determine if it's a Code
    const isCode =
      metadata.nature === Nature.CODE ||
      (metadata.titre ? metadata.titre.toLowerCase().includes('code') : false) ||
      text.substring(0, 1000).toLowerCase().includes('code');

    let sections: SectionContent[] = [];
    let articles: ArticleContent[] = [];

    if (isCode) {
      sections = this.extractStructureFromText(text);
      // Count articles inside sections recursively
      let articlesInSections = 0;
      for (const s of sections) {
        articlesInSections += this.countArticles(s);
      }
      // If sections exist but contain no articles, fall back to flat article extraction
      if (sections.length === 0 || articlesInSections === 0) {
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
      signataires: fullMeta.signataires,
      visas: fullMeta.visas,
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
      signataires,
      visas,
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
          signataires: signataires?.join(', ') || null,
          visas: visas?.join(';\n') || null,
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
          await indexArticles(texteComplete);
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
