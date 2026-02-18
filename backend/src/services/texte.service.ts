import { texteRepository, FindAllOptions, CreateTexteData } from '../repositories/texte.repository';
import { indexTexte, indexArticles, removeTexteFromIndex, removeArticlesFromIndex } from '../lib/meilisearch';
import { AppError } from '../middlewares/error.middleware';
import { Prisma } from '@prisma/client';
import { log } from '../utils/logger';

class TexteService {
  /**
   * Sort articles by numeric article number
   */
  private sortArticlesByNumber(articles: any[]): any[] {
    return articles.sort((a, b) => {
      const numA = parseInt(a.numero.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.numero.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
  }

  /**
   * Recursively sort articles within sections
   */
  private sortSectionArticles(sections: any[]): void {
    for (const section of sections) {
      if (section.articles?.length > 0) {
        section.articles = this.sortArticlesByNumber(section.articles);
      }
      if (section.enfants?.length > 0) {
        this.sortSectionArticles(section.enfants);
      }
    }
  }

  /**
   * Get paginated list of textes
   */
  async findAll(options: FindAllOptions) {
    const { textes, total } = await texteRepository.findAll(options);

    return {
      data: textes,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      },
    };
  }

  /**
   * Get texte by ID with full details
   */
  async findById(id: string) {
    const texte = await texteRepository.findById(id);

    if (!texte) {
      throw new AppError(404, 'Texte non trouvé');
    }

    // Sort articles
    if (texte.articles?.length > 0) {
      (texte as any).articles = this.sortArticlesByNumber(texte.articles);
    }

    // Sort articles in sections
    if (texte.sections?.length > 0) {
      this.sortSectionArticles(texte.sections as any[]);
    }

    return texte;
  }

  /**
   * Create a new texte
   */
  async create(data: CreateTexteData) {
    // Check if CID already exists
    const exists = await texteRepository.existsByCid(data.cid);
    if (exists) {
      throw new AppError(409, `Un texte avec le CID "${data.cid}" existe déjà`);
    }

    // Create texte
    const texte = await texteRepository.create(data);

    // Index in Meilisearch
    try {
      await indexTexte({
        ...texte,
        articles: texte.articles,
      });
      await indexArticles(texte);
    } catch (error) {
      log.warn('Failed to index texte in Meilisearch', { texteId: texte.id, error });
    }

    log.info('Texte created', { texteId: texte.id, cid: texte.cid });

    return texte;
  }

  /**
   * Update a texte
   */
  async update(id: string, data: Partial<CreateTexteData>) {
    // Check if texte exists
    const exists = await texteRepository.exists(id);
    if (!exists) {
      throw new AppError(404, 'Texte non trouvé');
    }

    // Prepare update data
    const updateData: Prisma.TexteUpdateInput = {};

    // Copy scalar fields
    const scalarFields = [
      'nor', 'eli', 'titre', 'titreComplet', 'nature', 'sousCategorie',
      'numero', 'etat', 'visas', 'signataires', 'sourceJO', 'urlJO', 'fichierPdf'
    ] as const;

    for (const field of scalarFields) {
      if (data[field] !== undefined) {
        (updateData as any)[field] = data[field];
      }
    }

    // Handle dates
    if (data.dateSignature !== undefined) {
      updateData.dateSignature = data.dateSignature ? new Date(data.dateSignature as any) : null;
    }
    if (data.datePublication !== undefined) {
      updateData.datePublication = data.datePublication ? new Date(data.datePublication as any) : null;
    }
    if (data.dateEntreeVigueur !== undefined) {
      updateData.dateEntreeVigueur = data.dateEntreeVigueur ? new Date(data.dateEntreeVigueur as any) : null;
    }

    // Update texte
    const texte = await texteRepository.update(id, updateData);

    // Reindex in Meilisearch
    try {
      await indexTexte({
        ...texte,
        articles: texte.articles,
      });
      await indexArticles(texte);
    } catch (error) {
      log.warn('Failed to reindex texte in Meilisearch', { texteId: texte.id, error });
    }

    log.info('Texte updated', { texteId: texte.id });

    return texte;
  }

  /**
   * Delete a texte
   */
  async delete(id: string) {
    // Check if texte exists
    const exists = await texteRepository.exists(id);
    if (!exists) {
      throw new AppError(404, 'Texte non trouvé');
    }

    // Delete texte
    await texteRepository.delete(id);

    // Remove from Meilisearch
    try {
      await removeTexteFromIndex(id);
      await removeArticlesFromIndex(id);
    } catch (error) {
      log.warn('Failed to remove texte from Meilisearch', { texteId: id, error });
    }

    log.info('Texte deleted', { texteId: id });
  }
}

export const texteService = new TexteService();
export default texteService;
