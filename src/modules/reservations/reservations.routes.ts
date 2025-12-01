import { Router } from 'express';
import { ReservationsController } from './reservations.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize, notTerminated } from '../../middleware/auth.middleware';
import { createReservationSchema, reviewReservationSchema } from './reservations.schema';

const router = Router();
const reservationsController = new ReservationsController();

// Student routes
router.post(
  '/',
  authenticate,
  authorize('STUDENT'),
  notTerminated,
  validate(createReservationSchema),
  (req, res) => reservationsController.create(req, res)
);

router.get(
  '/my',
  authenticate,
  authorize('STUDENT'),
  (req, res) => reservationsController.getMyReservations(req, res)
);

router.post(
  '/:id/cancel',
  authenticate,
  authorize('STUDENT'),
  notTerminated,
  (req, res) => reservationsController.cancel(req, res)
);

// Manager routes
router.get(
  '/hostel/:hostelId',
  authenticate,
  authorize('MANAGER'),
  (req, res) => reservationsController.getHostelReservations(req, res)
);

router.post(
  '/:id/review',
  authenticate,
  authorize('MANAGER'),
  notTerminated,
  validate(reviewReservationSchema),
  (req, res) => reservationsController.review(req, res)
);

export default router;