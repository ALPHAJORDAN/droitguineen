/**
 * Conversion PDF vers images pour OCR page par page
 */

// @ts-ignore - pdfjs-dist types are complex
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';
import { log } from '../utils/logger';

// Configuration de pdfjs pour Node.js
const NodeCanvasFactory = {
    create(width: number, height: number) {
        const canvas = createCanvas(width, height);
        return {
            canvas,
            context: canvas.getContext('2d')
        };
    },
    reset(canvasAndContext: any, width: number, height: number) {
        canvasAndContext.canvas.width = width;
        canvasAndContext.canvas.height = height;
    },
    destroy(canvasAndContext: any) {
        canvasAndContext.canvas.width = 0;
        canvasAndContext.canvas.height = 0;
        canvasAndContext.canvas = null;
        canvasAndContext.context = null;
    }
};

export interface PDFPageImage {
    pageNumber: number;
    imageBuffer: Buffer;
    width: number;
    height: number;
}

/**
 * Convertir une page PDF en image
 */
async function convertPdfPageToImage(
    page: any,
    pageNumber: number,
    scale: number = 2.0
): Promise<PDFPageImage> {
    const viewport = page.getViewport({ scale });

    const canvasFactory = NodeCanvasFactory;
    const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);

    const renderContext = {
        canvasContext: canvasAndContext.context,
        viewport: viewport,
        canvasFactory: canvasFactory
    };

    await page.render(renderContext).promise;

    // Convertir le canvas en buffer PNG
    const imageBuffer = canvasAndContext.canvas.toBuffer('image/png');

    canvasFactory.destroy(canvasAndContext);

    return {
        pageNumber,
        imageBuffer,
        width: viewport.width,
        height: viewport.height
    };
}

/**
 * Extraire toutes les pages d'un PDF en images
 */
export async function extractPdfPagesAsImages(
    pdfPath: string,
    options: {
        scale?: number;
        maxPages?: number;
        onProgress?: (current: number, total: number) => void;
    } = {}
): Promise<PDFPageImage[]> {
    const { scale = 2.0, maxPages, onProgress } = options;

    try {
        // Charger le PDF
        const data = new Uint8Array(fs.readFileSync(pdfPath));
        const loadingTask = pdfjsLib.getDocument({
            data,
            useSystemFonts: true,
            disableFontFace: true
        });

        const pdfDocument = await loadingTask.promise;
        const numPages = Math.min(pdfDocument.numPages, maxPages || pdfDocument.numPages);

        const pageImages: PDFPageImage[] = [];

        // Traiter chaque page
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            if (onProgress) {
                onProgress(pageNum, numPages);
            }

            const page = await pdfDocument.getPage(pageNum);
            const pageImage = await convertPdfPageToImage(page, pageNum, scale);
            pageImages.push(pageImage);

            // Libérer la mémoire de la page
            page.cleanup();
        }

        // Nettoyer le document
        await pdfDocument.destroy();

        return pageImages;
    } catch (error) {
        log.error('Failed to extract PDF pages as images', error as Error);
        throw new Error(`Impossible d'extraire les pages du PDF: ${error}`);
    }
}

/**
 * Sauvegarder temporairement les images de pages
 */
export async function savePdfPagesAsImages(
    pdfPath: string,
    outputDir: string,
    options: {
        scale?: number;
        maxPages?: number;
        onProgress?: (current: number, total: number) => void;
    } = {}
): Promise<string[]> {
    // Créer le répertoire de sortie si nécessaire
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const pageImages = await extractPdfPagesAsImages(pdfPath, options);
    const imagePaths: string[] = [];

    for (const pageImage of pageImages) {
        const imagePath = path.join(
            outputDir,
            `page-${pageImage.pageNumber.toString().padStart(3, '0')}.png`
        );

        fs.writeFileSync(imagePath, pageImage.imageBuffer);
        imagePaths.push(imagePath);
    }

    return imagePaths;
}
