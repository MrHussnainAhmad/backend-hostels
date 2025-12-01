import { Response } from 'express';
import { AuthRequest } from '../../types';
import { ReportsService } from './reports.service';

const reportsService = new ReportsService();

export class ReportsController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await reportsService.createReport(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMyReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await reportsService.getMyReports(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getManagerReports(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await reportsService.getManagerReports(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const result = await reportsService.getAllReports(status);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await reportsService.getReportById(req.params.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async resolve(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await reportsService.resolveReport(req.params.id, req.user!.userId, req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}