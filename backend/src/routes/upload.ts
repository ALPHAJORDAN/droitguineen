import { Router } from 'express';
import { uploadController } from '../controllers/upload.controller';
import { uploadMiddleware, verifyPdfSignature } from '../middlewares/upload.middleware';
import { validate, validateId } from '../middlewares/validation.middleware';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { confirmUploadSchema } from '../validators/upload.validator';

const router = Router();

// Toutes les routes upload nécessitent ADMIN ou EDITOR
router.use(authenticate, authorize('ADMIN', 'EDITOR'));

// GET /upload/files - List all uploaded files
router.get('/files', uploadController.getFiles);

// DELETE /upload/files/:id - Delete an uploaded file
router.delete('/files/:id', validateId(), uploadController.deleteFile);

// POST /upload/pdf - Upload and process a PDF
router.post(
  '/pdf',
  uploadMiddleware.single('file'),
  verifyPdfSignature,
  uploadController.uploadPdf
);

// POST /upload/confirm - Confirm and save a previewed PDF
router.post('/confirm', validate(confirmUploadSchema), uploadController.confirmUpload);

export default router;
