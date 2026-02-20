import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validate, validateId } from '../middlewares/validation.middleware';
import { passwordChangeLimiter } from '../middlewares/rateLimiter.middleware';
import {
  loginSchema,
  refreshTokenSchema,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
} from '../validators/auth.validator';

const router = Router();

// Routes publiques
router.post('/login', validate(loginSchema, 'body'), authController.login);
router.post('/refresh', validate(refreshTokenSchema, 'body'), authController.refreshToken);

// Routes authentifiées
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.put('/change-password', authenticate, passwordChangeLimiter, validate(changePasswordSchema, 'body'), authController.changePassword);

// Routes admin (gestion des utilisateurs)
router.post('/users', authenticate, authorize('ADMIN'), validate(createUserSchema, 'body'), authController.createUser);
router.get('/users', authenticate, authorize('ADMIN'), authController.getAllUsers);
router.put('/users/:id', authenticate, authorize('ADMIN'), validateId(), validate(updateUserSchema, 'body'), authController.updateUser);
router.delete('/users/:id', authenticate, authorize('ADMIN'), validateId(), authController.deleteUser);

export default router;
