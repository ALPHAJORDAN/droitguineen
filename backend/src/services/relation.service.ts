import prisma from '../lib/prisma';
import { TypeRelation, EtatTexte, Prisma } from '@prisma/client';
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
    // Run all 3 queries in parallel instead of sequentially
    const [texte, relationsSource, relationsCible] = await Promise.all([
      prisma.texte.findUnique({
        where: { id: texteId },
        select: { id: true, titre: true },
      }),
      prisma.texteRelation.findMany({
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
      }),
      prisma.texteRelation.findMany({
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
      }),
    ]);

    if (!texte) {
      throw new AppError(404, 'Texte non trouvé');
    }

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

    const relation = await prisma.$transaction(async (tx) => {
      const updated = await tx.texteRelation.update({
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
        await this.recalculateTexteState(oldRelation.texteCibleId, tx);
      }

      return updated;
    });

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

    await prisma.$transaction(async (tx) => {
      await tx.texteRelation.delete({ where: { id } });

      // Recalculate the target texte's state after removing the relation
      await this.recalculateTexteState(relation.texteCibleId, tx);
    });

    log.info('Relation deleted', { id });
  }

  /**
   * Recalculate a texte's state based on its remaining incoming relations
   */
  private async recalculateTexteState(
    texteId: string,
    tx: Prisma.TransactionClient = prisma,
  ): Promise<void> {
    const incomingRelations = await tx.texteRelation.findMany({
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

    await tx.texte.update({
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

    // Phase 1: Collect all regex matches without DB queries
    const rawMatches: Array<{
      type: string;
      reference: string;
      context: string;
      normalizedRef: string;
    }> = [];

    for (const [type, pattern] of Object.entries(patterns)) {
      let match;
      while ((match = pattern.exec(fullText)) !== null) {
        const reference = match[1] || match[0];
        const startContext = Math.max(0, match.index - 100);
        const endContext = Math.min(fullText.length, match.index + match[0].length + 100);
        const context = fullText.substring(startContext, endContext);
        rawMatches.push({
          type: type === 'abrogation' ? 'ABROGE' : type === 'modification' ? 'MODIFIE' : 'CITE',
          reference: reference || match[0],
          context: context.trim(),
          normalizedRef: reference ? reference.replace(/\s+/g, '') : '',
        });
      }
    }

    // Phase 2: Batch-resolve all unique references in a single query
    const uniqueRefs = [...new Set(rawMatches.map(m => m.normalizedRef).filter(Boolean))];
    const refToIdMap = new Map<string, string>();

    if (uniqueRefs.length > 0) {
      const matchingTextes = await prisma.texte.findMany({
        where: {
          OR: uniqueRefs.flatMap(ref => [
            { numero: { contains: ref } },
            { cid: { contains: ref } },
          ]),
        },
        select: { id: true, numero: true, cid: true },
      });

      // Map each reference to the first matching texte
      for (const ref of uniqueRefs) {
        const found = matchingTextes.find(
          t => (t.numero && t.numero.includes(ref)) || t.cid.includes(ref)
        );
        if (found) refToIdMap.set(ref, found.id);
      }
    }

    // Phase 3: Build results with resolved IDs
    const detectedRelations: DetectedRelation[] = rawMatches.map(m => ({
      type: m.type,
      reference: m.reference,
      context: m.context,
      texteCibleId: m.normalizedRef ? refToIdMap.get(m.normalizedRef) : undefined,
    }));

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
    const visited = new Set<string>();

    // Batch-load relations for a set of texte IDs in 2 parallel queries
    const loadRelationsForIds = async (ids: string[]) => {
      const [outgoing, incoming] = await Promise.all([
        prisma.texteRelation.findMany({
          where: { texteSourceId: { in: ids } },
          include: {
            texteCible: { select: { id: true, titre: true, nature: true, etat: true } },
          },
        }),
        prisma.texteRelation.findMany({
          where: { texteCibleId: { in: ids } },
          include: {
            texteSource: { select: { id: true, titre: true, nature: true, etat: true } },
          },
        }),
      ]);
      return { outgoing, incoming };
    };

    const addNode = (id: string, titre: string, nature: string, etat: string) => {
      if (!nodes.has(id)) {
        nodes.set(id, {
          id,
          titre: titre.substring(0, 50) + (titre.length > 50 ? '...' : ''),
          nature,
          etat,
        });
      }
    };

    // Load root texte
    const rootTexte = await prisma.texte.findUnique({
      where: { id: texteId },
      select: { id: true, titre: true, nature: true, etat: true },
    });

    if (!rootTexte) {
      throw new AppError(404, 'Texte non trouvé');
    }

    addNode(rootTexte.id, rootTexte.titre, rootTexte.nature, rootTexte.etat);

    // BFS by depth level with batch loading
    let currentIds = [texteId];

    for (let depth = 0; depth < maxDepth && currentIds.length > 0; depth++) {
      const unvisitedIds = currentIds.filter(id => !visited.has(id));
      if (unvisitedIds.length === 0) break;

      for (const id of unvisitedIds) visited.add(id);

      const { outgoing, incoming } = await loadRelationsForIds(unvisitedIds);
      const nextIds = new Set<string>();

      for (const rel of outgoing) {
        addNode(rel.texteCible.id, rel.texteCible.titre, rel.texteCible.nature, rel.texteCible.etat);
        edges.push({
          source: rel.texteSourceId,
          target: rel.texteCibleId,
          type: rel.type,
          label: RELATION_LABELS[rel.type] || rel.type,
        });
        if (!visited.has(rel.texteCibleId)) nextIds.add(rel.texteCibleId);
      }

      for (const rel of incoming) {
        addNode(rel.texteSource.id, rel.texteSource.titre, rel.texteSource.nature, rel.texteSource.etat);
        const edgeExists = edges.some(
          e => e.source === rel.texteSourceId && e.target === rel.texteCibleId && e.type === rel.type
        );
        if (!edgeExists) {
          edges.push({
            source: rel.texteSourceId,
            target: rel.texteCibleId,
            type: rel.type,
            label: RELATION_LABELS[rel.type] || rel.type,
          });
        }
        if (!visited.has(rel.texteSourceId)) nextIds.add(rel.texteSourceId);
      }

      currentIds = Array.from(nextIds);
    }

    return {
      nodes: Array.from(nodes.values()),
      edges,
      rootId: texteId,
    };
  }
}

export const relationService = new RelationService();
export default relationService;
