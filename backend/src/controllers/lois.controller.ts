import { Request, Response, NextFunction } from 'express';
import { texteService } from '../services/texte.service';
import { asyncHandler } from '../middlewares/error.middleware';
import { PaginationInput, CreateLoiInput, UpdateLoiInput } from '../validators/loi.validator';
import { Nature, EtatTexte } from '@prisma/client';

class LoisController {
  /**
   * GET /lois - Liste paginée des textes
   */
  getAll = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as PaginationInput;

    const result = await texteService.findAll({
      page: query.page || 1,
      limit: query.limit || 20,
      nature: query.nature as Nature | undefined,
      etat: query.etat as EtatTexte | undefined,
      sousCategorie: query.sousCategorie,
      dateDebut: query.dateDebut ? new Date(query.dateDebut) : undefined,
      dateFin: query.dateFin ? new Date(query.dateFin) : undefined,
      sort: query.sort || 'datePublication',
      order: query.order || 'desc',
    });

    res.json({
      success: true,
      ...result,
    });
  });

  /**
   * GET /lois/:id - Détails d'un texte
   */
  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const texte = await texteService.findById(id);

    res.json({
      success: true,
      data: texte,
    });
  });

  /**
   * POST /lois - Créer un nouveau texte
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as CreateLoiInput;

    const texte = await texteService.create({
      cid: data.cid,
      nor: data.nor,
      eli: data.eli,
      titre: data.titre,
      titreComplet: data.titreComplet,
      nature: data.nature as Nature,
      sousCategorie: data.sousCategorie,
      numero: data.numero,
      dateSignature: data.dateSignature ? new Date(data.dateSignature) : null,
      datePublication: data.datePublication ? new Date(data.datePublication) : null,
      dateEntreeVigueur: data.dateEntreeVigueur ? new Date(data.dateEntreeVigueur) : null,
      etat: (data.etat as EtatTexte) || 'VIGUEUR',
      visas: data.visas,
      signataires: data.signataires,
      sourceJO: data.sourceJO,
      urlJO: data.urlJO,
      articles: data.articles,
    });

    res.status(201).json({
      success: true,
      data: texte,
    });
  });

  /**
   * PUT /lois/:id - Mettre à jour un texte
   */
  update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body as UpdateLoiInput;

    const texte = await texteService.update(id, data as any);

    res.json({
      success: true,
      data: texte,
    });
  });

  /**
   * DELETE /lois/:id - Supprimer un texte
   */
  delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await texteService.delete(id);

    res.status(204).send();
  });
}

export const loisController = new LoisController();
