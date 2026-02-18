import prisma from '../lib/prisma';
import { Nature, EtatTexte, Prisma } from '@prisma/client';

export interface FindAllOptions {
  page: number;
  limit: number;
  nature?: Nature;
  etat?: EtatTexte;
  sousCategorie?: string;
  dateDebut?: Date;
  dateFin?: Date;
  sort: string;
  order: 'asc' | 'desc';
}

export interface CreateTexteData {
  cid: string;
  nor?: string | null;
  eli?: string | null;
  titre: string;
  titreComplet?: string | null;
  nature: Nature;
  sousCategorie?: string | null;
  numero?: string | null;
  dateSignature?: Date | null;
  datePublication?: Date | null;
  dateEntreeVigueur?: Date | null;
  etat?: EtatTexte;
  visas?: string | null;
  signataires?: string | null;
  sourceJO?: string | null;
  urlJO?: string | null;
  fichierPdf?: string | null;
  articles?: Array<{
    cid?: string;
    numero: string;
    contenu: string;
    ordre?: number;
  }>;
}

class TexteRepository {
  private readonly selectList = {
    id: true,
    cid: true,
    nor: true,
    eli: true,
    titre: true,
    nature: true,
    numero: true,
    dateSignature: true,
    datePublication: true,
    etat: true,
    sourceJO: true,
    sousCategorie: true,
    createdAt: true,
  };

  private readonly includeDetails = {
    articles: {
      include: {
        section: true,
      },
    },
    sections: {
      orderBy: { ordre: 'asc' as const },
      where: { parentId: null },
      include: {
        articles: true,
        enfants: {
          orderBy: { ordre: 'asc' as const },
          include: {
            articles: true,
            enfants: {
              orderBy: { ordre: 'asc' as const },
              include: {
                articles: true,
                enfants: {
                  orderBy: { ordre: 'asc' as const },
                  include: {
                    articles: true,
                    enfants: {
                      orderBy: { ordre: 'asc' as const },
                      include: { articles: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    versions: {
      orderBy: { dateDebut: 'desc' as const },
    },
    relationsSource: {
      include: {
        texteCible: {
          select: {
            id: true,
            titre: true,
            nature: true,
            numero: true,
            etat: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' as const },
    },
    relationsCible: {
      include: {
        texteSource: {
          select: {
            id: true,
            titre: true,
            nature: true,
            numero: true,
            dateSignature: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' as const },
    },
  };

  async findAll(options: FindAllOptions) {
    const skip = (options.page - 1) * options.limit;

    const where: Prisma.TexteWhereInput = {};

    if (options.nature) {
      where.nature = options.nature;
    }

    if (options.sousCategorie) {
      where.sousCategorie = options.sousCategorie;
    }

    if (options.etat) {
      where.etat = options.etat;
    }

    if (options.dateDebut || options.dateFin) {
      where.datePublication = {};
      if (options.dateDebut) {
        where.datePublication.gte = options.dateDebut;
      }
      if (options.dateFin) {
        where.datePublication.lte = options.dateFin;
      }
    }

    const [textes, total] = await Promise.all([
      prisma.texte.findMany({
        where,
        skip,
        take: options.limit,
        orderBy: { [options.sort]: options.order },
        select: this.selectList,
      }),
      prisma.texte.count({ where }),
    ]);

    return { textes, total };
  }

  async findById(id: string) {
    return prisma.texte.findUnique({
      where: { id },
      include: this.includeDetails,
    });
  }

  async findByCid(cid: string) {
    return prisma.texte.findUnique({
      where: { cid },
      include: this.includeDetails,
    });
  }

  async create(data: CreateTexteData) {
    const { articles, ...texteData } = data;

    return prisma.texte.create({
      data: {
        ...texteData,
        etat: texteData.etat || 'VIGUEUR',
        articles: articles
          ? {
              create: articles.map((article, index) => ({
                cid: article.cid || `${data.cid}-ART-${index + 1}`,
                numero: article.numero || `${index + 1}`,
                contenu: article.contenu,
                ordre: article.ordre ?? index + 1,
              })),
            }
          : undefined,
      },
      include: { articles: true },
    });
  }

  async update(id: string, data: Prisma.TexteUpdateInput) {
    return prisma.texte.update({
      where: { id },
      data,
      include: { articles: true },
    });
  }

  async delete(id: string) {
    return prisma.texte.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const count = await prisma.texte.count({
      where: { id },
    });
    return count > 0;
  }

  async existsByCid(cid: string): Promise<boolean> {
    const count = await prisma.texte.count({
      where: { cid },
    });
    return count > 0;
  }
}

export const texteRepository = new TexteRepository();
export default texteRepository;
