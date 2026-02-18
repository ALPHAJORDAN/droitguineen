import prisma from '../lib/prisma';
import { TypeRelation, EtatTexte } from '@prisma/client';
import { AppError } from '../middlewares/error.middleware';
import { log } from '../utils/logger';

export interface CreateRelationData {
  texteSourceId: string;
  texteCibleId: string;
  type: TypeRelation;
  articleCibleNum?: string;
  articleSourceNum?: string;
  description?: string;
  dateEffet?: string;
}

export interface UpdateRelationData {
  type?: TypeRelation;
  articleCibleNum?: string;
  articleSourceNum?: string;
  description?: string;
  dateEffet?: string;
}

export interface DetectedRelation {
  type: string;
  reference: string;
  context: string;
  texteCibleId?: string;
}

export interface GraphNode {
  id: string;
  titre: string;
  nature: string;
  etat: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
  label: string;
}

const RELATION_LABELS: Record<TypeRelation, string> = {
  ABROGE: 'Abroge',
  ABROGE_PARTIELLEMENT: 'Abroge partiellement',
  MODIFIE: 'Modifie',
  COMPLETE: 'Complète',
  CITE: 'Cite',
  APPLIQUE: 'Applique',
  PROROGE: 'Proroge',
  SUSPEND: 'Suspend',
  RATIFIE: 'Ratifie',
  CODIFIE: 'Codifie',
  CONSOLIDE: 'Consolide',
};

class RelationService {
  /**
   * Get all relations for a texte
   */
  async getRelationsByTexteId(texteId: string) {
    const texte = await prisma.texte.findUnique({
      where: { id: texteId },
      select: { id: true, titre: true },
    });

    if (!texte) {
      throw new AppError(404, 'Texte non trouvé');
    }

    // Get outgoing relations (this texte modifies/abrogates others)
    const relationsSource = await prisma.texteRelation.findMany({
      where: { texteSourceId: texteId },
      include: {
        texteCible: {
          select: {
            id: true,
            cid: true,
            titre: true,
            nature: true,
            numero: true,
            dateSignature: true,
            etat: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get incoming relations (this texte is modified/abrogated by others)
    const relationsCible = await prisma.texteRelation.findMany({
      where: { texteCibleId: texteId },
      include: {
        texteSource: {
          select: {
            id: true,
            cid: true,
            titre: true,
            nature: true,
            numero: true,
            dateSignature: true,
            etat: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by type
    const grouped = {
      // What this texte does to others
      abroge: relationsSource.filter(
        (r) => r.type === 'ABROGE' || r.type === 'ABROGE_PARTIELLEMENT'
      ),
      modifie: relationsSource.filter((r) => r.type === 'MODIFIE'),
      complete: relationsSource.filter((r) => r.type === 'COMPLETE'),
      cite: relationsSource.filter((r) => r.type === 'CITE'),
      applique: relationsSource.filter((r) => r.type === 'APPLIQUE'),
      proroge: relationsSource.filter((r) => r.type === 'PROROGE'),
      suspend: relationsSource.filter((r) => r.type === 'SUSPEND'),
      ratifie: relationsSource.filter((r) => r.type === 'RATIFIE'),
      codifie: relationsSource.filter((r) => r.type === 'CODIFIE'),
      consolide: relationsSource.filter((r) => r.type === 'CONSOLIDE'),

      // What others do to this texte
      abrogePar: relationsCible.filter(
        (r) => r.type === 'ABROGE' || r.type === 'ABROGE_PARTIELLEMENT'
      ),
      modifiePar: relationsCible.filter((r) => r.type === 'MODIFIE'),
      completePar: relationsCible.filter((r) => r.type === 'COMPLETE'),
      citePar: relationsCible.filter((r) => r.type === 'CITE'),
      appliquePar: relationsCible.filter((r) => r.type === 'APPLIQUE'),
      prorogePar: relationsCible.filter((r) => r.type === 'PROROGE'),
      suspendPar: relationsCible.filter((r) => r.type === 'SUSPEND'),
      ratifiePar: relationsCible.filter((r) => r.type === 'RATIFIE'),
      codifiePar: relationsCible.filter((r) => r.type === 'CODIFIE'),
      consolidePar: relationsCible.filter((r) => r.type === 'CONSOLIDE'),
    };

    return {
      texte: { id: texte.id, titre: texte.titre },
      relations: grouped,
      counts: {
        source: relationsSource.length,
        cible: relationsCible.length,
        total: relationsSource.length + relationsCible.length,
      },
    };
  }

  /**
   * Create a new relation
   */
  async create(data: CreateRelationData) {
    // Verify both textes exist
    const [texteSource, texteCible] = await Promise.all([
      prisma.texte.findUnique({ where: { id: data.texteSourceId } }),
      prisma.texte.findUnique({ where: { id: data.texteCibleId } }),
    ]);

    if (!texteSource) {
      throw new AppError(404, 'Texte source non trouvé');
    }
    if (!texteCible) {
      throw new AppError(404, 'Texte cible non trouvé');
    }

    // Create the relation
    const relation = await prisma.texteRelation.create({
      data: {
        texteSourceId: data.texteSourceId,
        texteCibleId: data.texteCibleId,
        type: data.type,
        articleCibleNum: data.articleCibleNum,
        articleSourceNum: data.articleSourceNum,
        description: data.description,
        dateEffet: data.dateEffet ? new Date(data.dateEffet) : null,
      },
      include: {
        texteSource: { select: { id: true, titre: true, nature: true } },
        texteCible: { select: { id: true, titre: true, nature: true } },
      },
    });

    // Update target texte state if necessary
    if (data.type === 'ABROGE') {
      await prisma.texte.update({
        where: { id: data.texteCibleId },
        data: {
          etat: EtatTexte.ABROGE,
          dateAbrogation: data.dateEffet ? new Date(data.dateEffet) : new Date(),
        },
      });
    } else if (data.type === 'MODIFIE' || data.type === 'COMPLETE') {
      await prisma.texte.update({
        where: { id: data.texteCibleId },
        data: { etat: EtatTexte.MODIFIE },
      });
    }

    log.info('Relation created', {
      id: relation.id,
      type: data.type,
      source: data.texteSourceId,
      target: data.texteCibleId,
    });

    return relation;
  }

  /**
   * Update a relation
   */
  async update(id: string, data: UpdateRelationData) {
    const oldRelation = await prisma.texteRelation.findUnique({ where: { id } });
    if (!oldRelation) {
      throw new AppError(404, 'Relation non trouvée');
    }

    const relation = await prisma.texteRelation.update({
      where: { id },
      data: {
        type: data.type,
        articleCibleNum: data.articleCibleNum,
        articleSourceNum: data.articleSourceNum,
        description: data.description,
        dateEffet: data.dateEffet ? new Date(data.dateEffet) : undefined,
      },
      include: {
        texteSource: { select: { id: true, titre: true } },
        texteCible: { select: { id: true, titre: true } },
      },
    });

    // If the relation type changed, recalculate the target texte's state
    if (data.type && data.type !== oldRelation.type) {
      await this.recalculateTexteState(oldRelation.texteCibleId);
    }

    log.info('Relation updated', { id });

    return relation;
  }

  /**
   * Delete a relation
   */
  async delete(id: string) {
    const relation = await prisma.texteRelation.findUnique({ where: { id } });
    if (!relation) {
      throw new AppError(404, 'Relation non trouvée');
    }

    await prisma.texteRelation.delete({ where: { id } });

    // Recalculate the target texte's state after removing the relation
    await this.recalculateTexteState(relation.texteCibleId);

    log.info('Relation deleted', { id });
  }

  /**
   * Recalculate a texte's state based on its remaining incoming relations
   */
  private async recalculateTexteState(texteId: string): Promise<void> {
    const incomingRelations = await prisma.texteRelation.findMany({
      where: { texteCibleId: texteId },
      select: { type: true },
    });

    const types = new Set(incomingRelations.map(r => r.type));

    let newEtat: EtatTexte;
    if (types.has('ABROGE')) {
      newEtat = EtatTexte.ABROGE;
    } else if (types.has('MODIFIE') || types.has('COMPLETE')) {
      newEtat = EtatTexte.MODIFIE;
    } else {
      newEtat = EtatTexte.VIGUEUR;
    }

    await prisma.texte.update({
      where: { id: texteId },
      data: {
        etat: newEtat,
        dateAbrogation: newEtat === EtatTexte.ABROGE ? undefined : null,
      },
    });
  }

  /**
   * Detect relations in a texte automatically
   */
  async detectRelations(texteId: string): Promise<{
    texteId: string;
    detected: DetectedRelation[];
    count: number;
    matchedCount: number;
  }> {
    const texte = await prisma.texte.findUnique({
      where: { id: texteId },
      include: { articles: true },
    });

    if (!texte) {
      throw new AppError(404, 'Texte non trouvé');
    }

    // Combine all content for analysis
    const articles = texte.articles || [];
    const fullText = [texte.visas || '', ...articles.map((a) => a.contenu)].join('\n');

    // Detection patterns
    const patterns = {
      abrogation:
        /abrog[éeant]+\s+(?:par\s+)?(?:la\s+|le\s+|l')?(?:loi|décret|ordonnance|arrêté)\s*(?:n[°o.]?\s*)?([A-Z0-9\/\-]+)?/gi,
      modification:
        /modifi[éeant]+\s+(?:par\s+)?(?:la\s+|le\s+|l')?(?:loi|décret|ordonnance|arrêté)\s*(?:n[°o.]?\s*)?([A-Z0-9\/\-]+)?/gi,
      citation:
        /(?:en\s+application\s+de|conformément\s+à|en\s+vertu\s+de|prévu[es]?\s+(?:à|par))\s+(?:la\s+|le\s+|l')?(?:loi|décret|ordonnance|arrêté|article)\s*(?:n[°o.]?\s*)?([A-Z0-9\/\-]+)?/gi,
      reference:
        /(?:loi|décret|ordonnance|arrêté)\s*(?:n[°o.]?\s*)?([LODA]\/\d{4}\/\d{3}(?:\/[A-Z]+)?)/gi,
    };

    const detectedRelations: DetectedRelation[] = [];

    for (const [type, pattern] of Object.entries(patterns)) {
      let match;
      while ((match = pattern.exec(fullText)) !== null) {
        const reference = match[1] || match[0];
        const startContext = Math.max(0, match.index - 100);
        const endContext = Math.min(fullText.length, match.index + match[0].length + 100);
        const context = fullText.substring(startContext, endContext);

        // Try to find matching texte in database
        let texteCibleId: string | undefined;
        if (reference) {
          const matchingTexte = await prisma.texte.findFirst({
            where: {
              OR: [
                { numero: { contains: reference.replace(/\s+/g, '') } },
                { cid: { contains: reference.replace(/\s+/g, '') } },
              ],
            },
            select: { id: true },
          });
          texteCibleId = matchingTexte?.id;
        }

        detectedRelations.push({
          type:
            type === 'abrogation' ? 'ABROGE' : type === 'modification' ? 'MODIFIE' : 'CITE',
          reference: reference || match[0],
          context: context.trim(),
          texteCibleId,
        });
      }
    }

    return {
      texteId,
      detected: detectedRelations,
      count: detectedRelations.length,
      matchedCount: detectedRelations.filter((r) => r.texteCibleId).length,
    };
  }

  /**
   * Build a graph of relations for visualization
   */
  async buildRelationGraph(
    texteId: string,
    maxDepth: number = 2
  ): Promise<{
    nodes: GraphNode[];
    edges: GraphEdge[];
    rootId: string;
  }> {
    const nodes: Map<string, GraphNode> = new Map();
    const edges: GraphEdge[] = [];

    const traverseRelations = async (id: string, currentDepth: number, visited: Set<string>) => {
      if (currentDepth >= maxDepth || visited.has(id)) return;
      visited.add(id);

      const texte = await prisma.texte.findUnique({
        where: { id },
        select: { id: true, titre: true, nature: true, etat: true },
      });

      if (texte && !nodes.has(id)) {
        nodes.set(id, {
          id: texte.id,
          titre: texte.titre.substring(0, 50) + (texte.titre.length > 50 ? '...' : ''),
          nature: texte.nature,
          etat: texte.etat,
        });
      }

      // Outgoing relations
      const outgoing = await prisma.texteRelation.findMany({
        where: { texteSourceId: id },
        include: {
          texteCible: { select: { id: true, titre: true, nature: true, etat: true } },
        },
      });

      for (const rel of outgoing) {
        if (!nodes.has(rel.texteCibleId)) {
          nodes.set(rel.texteCibleId, {
            id: rel.texteCible.id,
            titre:
              rel.texteCible.titre.substring(0, 50) +
              (rel.texteCible.titre.length > 50 ? '...' : ''),
            nature: rel.texteCible.nature,
            etat: rel.texteCible.etat,
          });
        }

        edges.push({
          source: id,
          target: rel.texteCibleId,
          type: rel.type,
          label: RELATION_LABELS[rel.type] || rel.type,
        });

        await traverseRelations(rel.texteCibleId, currentDepth + 1, visited);
      }

      // Incoming relations
      const incoming = await prisma.texteRelation.findMany({
        where: { texteCibleId: id },
        include: {
          texteSource: { select: { id: true, titre: true, nature: true, etat: true } },
        },
      });

      for (const rel of incoming) {
        if (!nodes.has(rel.texteSourceId)) {
          nodes.set(rel.texteSourceId, {
            id: rel.texteSource.id,
            titre:
              rel.texteSource.titre.substring(0, 50) +
              (rel.texteSource.titre.length > 50 ? '...' : ''),
            nature: rel.texteSource.nature,
            etat: rel.texteSource.etat,
          });
        }

        // Avoid duplicate edges
        const edgeExists = edges.some(
          (e) => e.source === rel.texteSourceId && e.target === id && e.type === rel.type
        );

        if (!edgeExists) {
          edges.push({
            source: rel.texteSourceId,
            target: id,
            type: rel.type,
            label: RELATION_LABELS[rel.type] || rel.type,
          });
        }

        await traverseRelations(rel.texteSourceId, currentDepth + 1, visited);
      }
    };

    await traverseRelations(texteId, 0, new Set());

    return {
      nodes: Array.from(nodes.values()),
      edges,
      rootId: texteId,
    };
  }
}

export const relationService = new RelationService();
export default relationService;
