import { Router } from 'express';
import { FeesController } from './fees.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize, notTerminated } from '../../middleware/auth.middleware';
import { submitFeeSchema, reviewFeeSchema } from './fees.schema';

const router = Router();
const feesController = new FeesController();

// Manager routes
router.post(
  '/',
  authenticate,
  authorize('MANAGER'),
  notTerminated,
  validate(submitFeeSchema),
  (req, res) => feesController.submit(req, res)
);

router.get(
  '/my',
  authenticate,
  authorize('MANAGER'),
  (req, res) => feesController.getMyFees(req, res)
);

router.get(
  '/pending-summary',
  authenticate,
  authorize('MANAGER'),
  (req, res) => feesController.getPendingSummary(req, res)
);

// Admin routes
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUBADMIN'),
  (req, res) => feesController.getAll(req, res)
);

router.post(
  '/:id/review',
  authenticate,
  authorize('ADMIN', 'SUBADMIN'),
  validate(reviewFeeSchema),
  (req, res) => feesController.review(req, res)
);

export default router;