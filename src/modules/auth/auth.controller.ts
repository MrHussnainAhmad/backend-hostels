import { Response } from 'express';
import { AuthRequest } from '../../types';
import { AuthService } from './auth.service';

const authService = new AuthService();

export class AuthController {
  async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }

  async createSubAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.createSubAdmin(req.body, req.user!.userId);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async deleteSubAdmin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.deleteSubAdmin(req.params.id, req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMe(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.getMe(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}