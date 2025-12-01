import { Response } from 'express';
import { AuthRequest } from '../../types';
import { ReservationsService } from './reservations.service';

const reservationsService = new ReservationsService();

export class ReservationsController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await reservationsService.createReservation(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMyReservations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await reservationsService.getMyReservations(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async cancel(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await reservationsService.cancelReservation(req.user!.userId, req.params.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getHostelReservations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await reservationsService.getHostelReservations(req.user!.userId, req.params.hostelId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async review(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await reservationsService.reviewReservation(req.user!.userId, req.params.id, req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}