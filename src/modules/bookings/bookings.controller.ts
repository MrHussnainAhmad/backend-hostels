import { Response } from 'express';
import { AuthRequest } from '../../types';
import { BookingsService } from './bookings.service';

const bookingsService = new BookingsService();

export class BookingsController {
  async create(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await bookingsService.createBooking(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMyBookings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await bookingsService.getMyBookings(req.user!.userId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getHostelBookings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await bookingsService.getHostelBookings(req.user!.userId, req.params.hostelId);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async approve(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await bookingsService.approveBooking(req.user!.userId, req.params.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async disapprove(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await bookingsService.disapproveBooking(req.user!.userId, req.params.id, req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async leave(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await bookingsService.leaveHostel(req.user!.userId, req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async kick(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await bookingsService.kickStudent(req.user!.userId, req.params.id, req.body);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAll(req: AuthRequest, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const result = await bookingsService.getAllBookings(status);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await bookingsService.getBookingById(req.params.id);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}