import { Request, Response } from 'express';
import { asyncHandler } from '../middlewares/error.middleware';
import { AuthRequest } from '../middlewares/auth.middleware';
import { authService } from '../services/auth.service';
import { googleAuthService } from '../services/google-auth.service';
import { invitationService } from '../services/invitation.service';

class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.json({
      success: true,
      data: result,
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { id } = (req as AuthRequest).user;
    await authService.logout(id);

    res.json({
      success: true,
      message: 'Déconnexion réussie',
    });
  });

  getMe = asyncHandler(async (req: Request, res: Response) => {
    const { id } = (req as AuthRequest).user;
    const user = await authService.getMe(id);

    res.json({
      success: true,
      data: user,
    });
  });

  createUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.createUser(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  });

  getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string, 10) || 20), 100);
    const result = await authService.getAllUsers(page, limit);

    res.json({
      success: true,
      ...result,
    });
  });

  updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await authService.updateUser(id, req.body);

    res.json({
      success: true,
      data: user,
    });
  });

  deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const requesterId = (req as AuthRequest).user.id;
    await authService.deleteUser(id, requesterId);

    res.json({
      success: true,
      message: 'Utilisateur supprimé',
    });
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { id } = (req as AuthRequest).user;
    await authService.changePassword(id, req.body);

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès',
    });
  });

  // Google OAuth
  googleLogin = asyncHandler(async (req: Request, res: Response) => {
    const { credential } = req.body;
    const result = await googleAuthService.loginWithGoogle(credential);

    res.json({
      success: true,
      data: result,
    });
  });

  // Invitations
  createInvitation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = (req as AuthRequest).user;
    const invitation = await invitationService.createInvitation(req.body, id);

    res.status(201).json({
      success: true,
      data: invitation,
    });
  });

  listInvitations = asyncHandler(async (req: Request, res: Response) => {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string, 10) || 20), 100);
    const result = await invitationService.listInvitations(page, limit);

    res.json({
      success: true,
      ...result,
    });
  });

  revokeInvitation = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await invitationService.revokeInvitation(id);

    res.json({
      success: true,
      message: 'Invitation révoquée',
    });
  });
}

export const authController = new AuthController();
