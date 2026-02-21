import prisma from '../lib/prisma';
import { CategorieLivre, Prisma } from '@prisma/client';

export interface FindAllLivresOptions {
  page: number;
  limit: number;
  categorie?: CategorieLivre;
  auteur?: string;
  sort: string;
  order: 'asc' | 'desc';
}

export interface CreateLivreData {
  titre: string;
  auteur: string;
  editeur?: string | null;
  anneePublication?: number | null;
  isbn?: string | null;
  resume?: string | null;
  categorie: CategorieLivre;
  couverture?: string | null;
  fichierPdf?: string | null;
  fichierOriginal?: string | null;
  formatOriginal?: string | null;
  chapitres?: Array<{
    titre: string;
    contenu: string;
    ordre: number;
  }>;
}

const ALLOWED_SORT_FIELDS = new Set(['anneePublication', 'createdAt', 'titre', 'auteur']);

class LivreRepository {
  private readonly selectList = {
    id: true,
    titre: true,
    auteur: true,
    editeur: true,
    anneePublication: true,
    isbn: true,
    resume: true,
    categorie: true,
    couverture: true,
    fichierPdf: true,
    fichierOriginal: true,
    formatOriginal: true,
    createdAt: true,
  };

  async findAll(options: FindAllLivresOptions) {
    const skip = (options.page - 1) * options.limit;

    const where: Prisma.LivreWhereInput = {};

    if (options.categorie) {
      where.categorie = options.categorie;
    }

    if (options.auteur) {
      where.auteur = { contains: options.auteur, mode: 'insensitive' };
    }

    const sortField = ALLOWED_SORT_FIELDS.has(options.sort) ? options.sort : 'createdAt';

    const [livres, total] = await Promise.all([
      prisma.livre.findMany({
        where,
        skip,
        take: options.limit,
        orderBy: { [sortField]: options.order },
        select: this.selectList,
      }),
      prisma.livre.count({ where }),
    ]);

    return { livres, total };
  }

  async findById(id: string) {
    return prisma.livre.findUnique({
      where: { id },
      include: {
        chapitres: {
          orderBy: { ordre: 'asc' },
        },
      },
    });
  }

  async create(data: CreateLivreData) {
    const { chapitres, ...livreData } = data;

    return prisma.livre.create({
      data: {
        ...livreData,
        chapitres: chapitres
          ? {
              create: chapitres.map((ch) => ({
                titre: ch.titre,
                contenu: ch.contenu,
                ordre: ch.ordre,
              })),
            }
          : undefined,
      },
      include: { chapitres: { orderBy: { ordre: 'asc' } } },
    });
  }

  async update(id: string, data: Prisma.LivreUpdateInput) {
    return prisma.livre.update({
      where: { id },
      data,
      include: { chapitres: { orderBy: { ordre: 'asc' } } },
    });
  }

  async delete(id: string) {
    return prisma.livre.delete({
      where: { id },
    });
  }

  async getStats() {
    const [total, byCategorie, recent] = await Promise.all([
      prisma.livre.count(),
      prisma.livre.groupBy({ by: ['categorie'], _count: true }),
      prisma.livre.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: this.selectList,
      }),
    ]);

    const categorieCounts: Record<string, number> = {};
    for (const row of byCategorie) {
      categorieCounts[row.categorie] = row._count;
    }

    return { total, categorieCounts, recent };
  }
}

export const livreRepository = new LivreRepository();
export default livreRepository;
