/**
 * Image preprocessing with Sharp to improve OCR quality on old/scanned documents.
 * Pipeline: grayscale → normalize → sharpen → denoise → binarize
 */

import sharp from 'sharp';
import { PDFPageImage } from './pdf-to-image';
import { log } from '../utils/logger';

/**
 * Preprocess a single image buffer for optimal OCR recognition.
 */
export async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    return sharp(imageBuffer)
        .grayscale()                    // Remove color noise (yellowed pages)
        .normalize()                    // Auto-stretch histogram (maximize contrast)
        .sharpen({ sigma: 1.5 })        // Enhance character edges
        .median(3)                      // Remove small speckles/scan artifacts
        .threshold(0, { greyscale: true }) // Otsu binarization (black text on white)
        .png()
        .toBuffer();
}

/**
 * Preprocess all PDF page images before sending to OCR engines.
 */
export async function preprocessPdfPages(pageImages: PDFPageImage[]): Promise<PDFPageImage[]> {
    const start = Date.now();
    const totalSizeBefore = pageImages.reduce((sum, p) => sum + p.imageBuffer.length, 0);

    const preprocessed: PDFPageImage[] = [];

    for (const page of pageImages) {
        const processedBuffer = await preprocessImage(page.imageBuffer);
        preprocessed.push({
            ...page,
            imageBuffer: processedBuffer,
        });
    }

    const totalSizeAfter = preprocessed.reduce((sum, p) => sum + p.imageBuffer.length, 0);
    const duration = Date.now() - start;

    log.info('Image preprocessing completed', {
        pages: pageImages.length,
        sizeBefore: `${(totalSizeBefore / 1024 / 1024).toFixed(1)}MB`,
        sizeAfter: `${(totalSizeAfter / 1024 / 1024).toFixed(1)}MB`,
        duration: `${duration}ms`,
    });

    return preprocessed;
}
