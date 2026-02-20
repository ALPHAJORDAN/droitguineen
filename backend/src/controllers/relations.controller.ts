import { Request, Response } from 'express';
import { relationService } from '../services/relation.service';
import { asyncHandler } from '../middlewares/error.middleware';
import { TypeRelation } from '@prisma/client';
import { CreateRelationInput, UpdateRelationInput } from '../validators/relation.validator';

class RelationsController {
  /**
   * GET /relations/:texteId - Get all relations for a texte
   */
  getRelationsByTexteId = asyncHandler(async (req: Request, res: Response) => {
    const { texteId } = req.params;
    const result = await relationService.getRelationsByTexteId(texteId);

    res.json({
      success: true,
      ...result,
    });
  });

  /**
   * POST /relations - Create a new relation
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as CreateRelationInput;

    const relation = await relationService.create({
      texteSourceId: data.texteSourceId,
      texteCibleId: data.texteCibleId,
      type: data.type as TypeRelation,
      articleCibleNum: data.articleCibleNum || undefined,
      articleSourceNum: data.articleSourceNum || undefined,
      description: data.description || undefined,
      dateEffet: data.dateEffet || undefined,
    });

    res.status(201).json({
      success: true,
      data: relation,
    });
  });

  /**
   * PUT /relations/:id - Update a relation
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdateRelationInput;

    const relation = await relationService.update(id, {
      type: data.type as TypeRelation | undefined,
      articleCibleNum: data.articleCibleNum ?? undefined,
      articleSourceNum: data.articleSourceNum ?? undefined,
      description: data.description ?? undefined,
      dateEffet: data.dateEffet ?? undefined,
    });

    res.json({
      success: true,
      data: relation,
    });
  });

  /**
   * DELETE /relations/:id - Delete a relation
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await relationService.delete(id);

    res.status(204).send();
  });

  /**
   * POST /relations/detect - Detect relations automatically
   */
  detectRelations = asyncHandler(async (req: Request, res: Response) => {
    const { texteId } = req.body;
    const result = await relationService.detectRelations(texteId);

    res.json({
      success: true,
      ...result,
    });
  });

  /**
   * GET /relations/graph/:texteId - Get relation graph for visualization
   */
  getRelationGraph = asyncHandler(async (req: Request, res: Response) => {
    const { texteId } = req.params;
    const { depth = '2' } = req.query;
    const maxDepth = Math.min(parseInt(depth as string, 10), 5);

    const result = await relationService.buildRelationGraph(texteId, maxDepth);

    res.json({
      success: true,
      ...result,
    });
  });
}

export const relationsController = new RelationsController();
