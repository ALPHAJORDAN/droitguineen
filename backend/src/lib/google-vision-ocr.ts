/**
 * Google Cloud Vision OCR Module
 * Provides high-accuracy OCR using Google Cloud Vision API
 */

import { ImageAnnotatorClient } from '@google-cloud/vision';
import fs from 'fs';
import path from 'path';
import { log } from '../utils/logger';

export interface VisionOCRResult {
    text: string;
    confidence: number;
    blocks?: TextBlock[];
}

export interface TextBlock {
    text: string;
    confidence: number;
    boundingBox?: {
        vertices: { x: number; y: number }[];
    };
}

// Configuration
const GOOGLE_VISION_ENABLED = process.env.GOOGLE_CLOUD_VISION_ENABLED === 'true';
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? path.resolve(process.cwd(), process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : undefined;

let visionClient: ImageAnnotatorClient | null = null;

/**
 * Initialiser le client Google Cloud Vision
 */
export function initVisionClient(): ImageAnnotatorClient | null {
    if (!GOOGLE_VISION_ENABLED) {
        log.info('Google Cloud Vision disabled');
        return null;
    }

    if (!PROJECT_ID || !CREDENTIALS_PATH) {
        log.warn('Google Cloud Vision configuration incomplete');
        return null;
    }

    try {
        // Vérifier que le fichier de credentials existe
        if (!fs.existsSync(CREDENTIALS_PATH)) {
            log.warn('Google Cloud Vision credentials file not found', { path: CREDENTIALS_PATH });
            return null;
        }

        visionClient = new ImageAnnotatorClient({
            projectId: PROJECT_ID,
            keyFilename: CREDENTIALS_PATH
        });

        log.info('Google Cloud Vision client initialized');
        return visionClient;
    } catch (error) {
        log.error('Google Cloud Vision initialization failed', error as Error);
        return null;
    }
}

/**
 * Vérifier si Google Cloud Vision est disponible
 */
export function isVisionAvailable(): boolean {
    if (!visionClient) {
        visionClient = initVisionClient();
    }
    return visionClient !== null && GOOGLE_VISION_ENABLED;
}

/**
 * Traiter une image avec Google Cloud Vision
 */
export async function processImageWithVision(
    imageBuffer: Buffer
): Promise<VisionOCRResult> {
    if (!visionClient) {
        visionClient = initVisionClient();
    }

    if (!visionClient) {
        throw new Error('Google Cloud Vision client non disponible');
    }

    try {
        // Appel à l'API Vision pour détection de texte
        const [result] = await visionClient.documentTextDetection({
            image: { content: imageBuffer }
        });

        const detections = result.textAnnotations;

        if (!detections || detections.length === 0) {
            return {
                text: '',
                confidence: 0,
                blocks: []
            };
        }

        // Le premier élément contient tout le texte
        const fullText = detections[0].description || '';

        // Calculer la confiance moyenne à partir des blocs
        const blocks: TextBlock[] = [];
        let totalConfidence = 0;
        let blockCount = 0;

        // Les éléments suivants sont les blocs individuels
        for (let i = 1; i < detections.length; i++) {
            const detection = detections[i];
            if (detection.description && detection.boundingPoly) {
                const confidence = detection.confidence || 0.95; // Vision API ne retourne pas toujours la confiance
                const vertices = (detection.boundingPoly.vertices || []).map((v) => ({
                    x: v.x ?? 0,
                    y: v.y ?? 0
                }));
                blocks.push({
                    text: detection.description,
                    confidence: confidence * 100,
                    boundingBox: { vertices }
                });
                totalConfidence += confidence * 100;
                blockCount++;
            }
        }

        const averageConfidence = blockCount > 0 ? totalConfidence / blockCount : 95;

        return {
            text: fullText,
            confidence: averageConfidence,
            blocks
        };
    } catch (error: any) {
        // Gestion des erreurs spécifiques à l'API
        if (error.code === 8) {
            throw new Error('Quota Google Cloud Vision dépassé');
        } else if (error.code === 7) {
            throw new Error('Permission refusée - Vérifier les credentials');
        } else if (error.code === 3) {
            throw new Error('Image invalide pour Google Cloud Vision');
        }

        log.error('Google Cloud Vision processing error', error as Error);
        throw new Error(`Erreur Google Cloud Vision: ${error.message}`);
    }
}

/**
 * Traiter plusieurs pages avec Google Cloud Vision
 */
export async function processPagesWithVision(
    pageImages: { pageNumber: number; imageBuffer: Buffer }[],
    onProgress?: (current: number, total: number) => void
): Promise<Array<{ pageNumber: number; text: string; confidence: number }>> {
    const results: Array<{ pageNumber: number; text: string; confidence: number }> = [];

    for (const pageImage of pageImages) {
        if (onProgress) {
            onProgress(pageImage.pageNumber, pageImages.length);
        }

        try {
            const result = await processImageWithVision(pageImage.imageBuffer);
            results.push({
                pageNumber: pageImage.pageNumber,
                text: result.text,
                confidence: result.confidence
            });
        } catch (error) {
            log.error(`Vision OCR failed for page ${pageImage.pageNumber}`, error as Error);
            // En cas d'erreur sur une page, continuer avec les autres
            results.push({
                pageNumber: pageImage.pageNumber,
                text: '',
                confidence: 0
            });
        }
    }

    return results;
}

/**
 * Traiter un fichier image avec Google Cloud Vision
 */
export async function processImageFileWithVision(
    imagePath: string
): Promise<VisionOCRResult> {
    const imageBuffer = fs.readFileSync(imagePath);
    return processImageWithVision(imageBuffer);
}

/**
 * Traiter un PDF directement avec Google Cloud Vision (sans conversion en images)
 * Utilise batchAnnotateFiles qui accepte les PDF nativement.
 * Limite : 5 pages par requête, donc on découpe en lots.
 */
export async function processPdfWithVision(
    pdfBuffer: Buffer,
    totalPages: number,
    onProgress?: (current: number, total: number) => void
): Promise<Array<{ pageNumber: number; text: string; confidence: number }>> {
    if (!visionClient) {
        visionClient = initVisionClient();
    }

    if (!visionClient) {
        throw new Error('Google Cloud Vision client non disponible');
    }

    const results: Array<{ pageNumber: number; text: string; confidence: number }> = [];
    const PAGES_PER_BATCH = 5; // Google Vision limit per request

    for (let batchStart = 1; batchStart <= totalPages; batchStart += PAGES_PER_BATCH) {
        const batchEnd = Math.min(batchStart + PAGES_PER_BATCH - 1, totalPages);
        const pageNumbers = Array.from(
            { length: batchEnd - batchStart + 1 },
            (_, i) => batchStart + i
        );

        if (onProgress) {
            onProgress(batchStart, totalPages);
        }

        try {
            const [response] = await visionClient.batchAnnotateFiles({
                requests: [{
                    inputConfig: {
                        content: pdfBuffer.toString('base64'),
                        mimeType: 'application/pdf',
                    },
                    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
                    pages: pageNumbers,
                }]
            });

            const fileResponse = response.responses?.[0];
            if (fileResponse?.responses) {
                for (let i = 0; i < fileResponse.responses.length; i++) {
                    const pageResponse = fileResponse.responses[i];
                    const fullTextAnnotation = pageResponse?.fullTextAnnotation;
                    const text = fullTextAnnotation?.text || '';

                    // Calculate confidence from pages
                    let confidence = 95;
                    if (fullTextAnnotation?.pages?.[0]?.confidence) {
                        confidence = fullTextAnnotation.pages[0].confidence * 100;
                    }

                    results.push({
                        pageNumber: batchStart + i,
                        text,
                        confidence
                    });
                }
            }
        } catch (error: any) {
            log.error(`Vision PDF batch failed for pages ${batchStart}-${batchEnd}`, error as Error);
            // Add empty results for failed pages
            for (const pageNum of pageNumbers) {
                results.push({ pageNumber: pageNum, text: '', confidence: 0 });
            }
        }
    }

    return results;
}

// Initialiser le client au chargement du module
if (GOOGLE_VISION_ENABLED) {
    initVisionClient();
}

export default {
    initVisionClient,
    isVisionAvailable,
    processImageWithVision,
    processPagesWithVision,
    processImageFileWithVision,
    processPdfWithVision
};
