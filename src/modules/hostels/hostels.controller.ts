import { Response } from 'express';
import { AuthRequest } from '../../types';
import { HostelsService } from './hostels.service';

const hostelsService = new HostelsService();

export class HostelsController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await hostelsService.createHostel(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async update(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await hostelsService.updateHostel(req.user!.userId, req.params.id, req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async delete(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await hostelsService.deleteHostel(req.user!.userId, req.params.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMyHostels(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await hostelsService.getMyHostels(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async search(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await hostelsService.searchHostels(req.query as any);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await hostelsService.getHostelById(req.params.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getHostelStudents(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await hostelsService.getHostelStudents(req.user!.userId, req.params.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await hostelsService.getAllHostels();
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}