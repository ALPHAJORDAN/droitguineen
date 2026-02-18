import { Router } from 'express';
import { relationsController } from '../controllers/relations.controller';
import { validate, validateId } from '../middlewares/validation.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { createRelationSchema, updateRelationSchema } from '../validators/relation.validator';

const router = Router();

// Routes publiques (lecture)
router.get('/graph/:texteId', validateId('texteId'), relationsController.getRelationGraph);
router.get('/:texteId', validateId('texteId'), relationsController.getRelationsByTexteId);

// Routes protégées (écriture)
router.post('/detect', authenticate, authorize('ADMIN', 'EDITOR'), relationsController.detectRelations);
router.post('/', authenticate, authorize('ADMIN', 'EDITOR'), validate(createRelationSchema, 'body'), relationsController.create);
router.put('/:id', authenticate, authorize('ADMIN', 'EDITOR'), validateId(), validate(updateRelationSchema, 'body'), relationsController.update);
router.delete('/:id', authenticate, authorize('ADMIN'), validateId(), relationsController.delete);

export default router;
