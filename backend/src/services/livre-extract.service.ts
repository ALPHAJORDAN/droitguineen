import fs from 'fs';
import path from 'path';
import { load as cheerioLoad } from 'cheerio';
import { log } from '../utils/logger';

interface ExtractedChapter {
  titre: string;
  contenu: string;
  ordre: number;
}

interface ExtractionResult {
  chapitres: ExtractedChapter[];
  metadata?: {
    titre?: string;
    auteur?: string;
  };
}

const CHAPTER_REGEX = /^(Chapitre|Chapter|CHAPITRE|Partie|PARTIE|PART|TITRE|LIVRE|SECTION)\s+/m;

/**
 * Extract chapters from a file based on its format.
 */
export async function extractChaptersFromFile(
  filePath: string,
  format: string
): Promise<ExtractionResult> {
  switch (format) {
    case 'pdf':
      return extractFromPdf(filePath);
    case 'epub':
      return extractFromEpub(filePath);
    case 'txt':
      return extractFromTxt(filePath);
    case 'html':
      return extractFromHtml(filePath);
    default:
      log.warn('Unknown format, treating as plain text', { format });
      return extractFromTxt(filePath);
  }
}

/**
 * Detect format from file extension.
 */
export function detectFormat(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.pdf': return 'pdf';
    case '.epub': return 'epub';
    case '.txt': return 'txt';
    case '.html':
    case '.htm': return 'html';
    default: return 'txt';
  }
}

// ============ PDF ============

async function extractFromPdf(filePath: string): Promise<ExtractionResult> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pdfParse = require('pdf-parse-fork');
  const buffer = fs.readFileSync(filePath);
  const data = await pdfParse(buffer);
  const text = data.text || '';

  const chapitres = splitTextIntoChapters(text);

  return {
    chapitres,
    metadata: {
      titre: data.info?.Title || undefined,
      auteur: data.info?.Author || undefined,
    },
  };
}

// ============ EPUB ============

async function extractFromEpub(filePath: string): Promise<ExtractionResult> {
  const EPub = (await import('epub2')).default;

  return new Promise((resolve, reject) => {
    const epub = new EPub(filePath);

    epub.on('end', async () => {
      try {
        const chapitres: ExtractedChapter[] = [];
        const flow = epub.flow || [];
        let ordre = 1;

        for (const item of flow) {
          try {
            const itemId = item.id as string;
            if (!itemId) continue;
            const html = await getChapterContent(epub, itemId);
            if (!html) continue;

            const $ = cheerioLoad(html);

            // Remove scripts and styles
            $('script, style').remove();

            // Get title from first heading or manifest title
            const heading = $('h1, h2, h3').first().text().trim();
            const titre = heading || (item as { title?: string }).title || `Chapitre ${ordre}`;

            // Get text content
            const contenu = $('body').text().trim().replace(/\s+/g, ' ');

            // Skip very short chapters (likely table of contents, copyright, etc.)
            if (contenu.length < 50) continue;

            chapitres.push({ titre, contenu, ordre });
            ordre++;
          } catch (err) {
            log.warn('Failed to extract EPUB chapter', { itemId: item.id });
          }
        }

        resolve({
          chapitres,
          metadata: {
            titre: epub.metadata?.title || undefined,
            auteur: epub.metadata?.creator || undefined,
          },
        });
      } catch (err) {
        reject(err);
      }
    });

    epub.on('error', (err: Error) => {
      log.error('EPUB parse error', err);
      reject(err);
    });

    epub.parse();
  });
}

function getChapterContent(epub: any, chapterId: string): Promise<string | null> {
  return new Promise((resolve) => {
    epub.getChapter(chapterId, (err: Error | null, text: string) => {
      if (err) {
        resolve(null);
      } else {
        resolve(text);
      }
    });
  });
}

// ============ TXT ============

async function extractFromTxt(filePath: string): Promise<ExtractionResult> {
  const text = fs.readFileSync(filePath, 'utf-8');
  const chapitres = splitTextIntoChapters(text);

  return { chapitres };
}

// ============ HTML ============

async function extractFromHtml(filePath: string): Promise<ExtractionResult> {
  const html = fs.readFileSync(filePath, 'utf-8');
  const $ = cheerioLoad(html);

  $('script, style').remove();

  // Try to extract metadata
  const titre = $('title').text().trim() || $('h1').first().text().trim() || undefined;

  // Try heading-based chapter splitting
  const headings = $('h1, h2');
  if (headings.length > 1) {
    const chapitres: ExtractedChapter[] = [];
    let ordre = 1;

    headings.each((i, el) => {
      const headingText = $(el).text().trim();
      // Collect all siblings until next heading
      let contenu = '';
      let next = $(el).next();
      while (next.length && !next.is('h1, h2')) {
        contenu += next.text().trim() + '\n';
        next = next.next();
      }
      contenu = contenu.trim();

      if (contenu.length > 20) {
        chapitres.push({
          titre: headingText || `Chapitre ${ordre}`,
          contenu,
          ordre,
        });
        ordre++;
      }
    });

    if (chapitres.length > 0) {
      return { chapitres, metadata: { titre } };
    }
  }

  // Fallback: treat all body text as a single chapter
  const bodyText = $('body').text().trim();
  const chapitres = splitTextIntoChapters(bodyText);

  return { chapitres, metadata: { titre } };
}

// ============ Helpers ============

function splitTextIntoChapters(text: string): ExtractedChapter[] {
  if (!text || text.trim().length < 10) {
    return [];
  }

  // Try to split by chapter markers
  const lines = text.split('\n');
  const chapters: { titre: string; startIndex: number }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (CHAPTER_REGEX.test(line) && line.length < 200) {
      chapters.push({ titre: line, startIndex: i });
    }
  }

  if (chapters.length >= 2) {
    const result: ExtractedChapter[] = [];
    for (let i = 0; i < chapters.length; i++) {
      const start = chapters[i].startIndex + 1;
      const end = i + 1 < chapters.length ? chapters[i + 1].startIndex : lines.length;
      const contenu = lines.slice(start, end).join('\n').trim();

      if (contenu.length > 10) {
        result.push({
          titre: chapters[i].titre,
          contenu,
          ordre: i + 1,
        });
      }
    }
    return result;
  }

  // No chapter markers found — create a single chapter
  const trimmed = text.trim();
  if (trimmed.length > 10) {
    return [{ titre: 'Contenu', contenu: trimmed, ordre: 1 }];
  }

  return [];
}
