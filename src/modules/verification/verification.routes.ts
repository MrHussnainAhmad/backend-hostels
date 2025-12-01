import { Router } from 'express';
import { VerificationController } from './verification.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize, notTerminated } from '../../middleware/auth.middleware';
import { submitVerificationSchema, reviewVerificationSchema } from './verification.schema';

const router = Router();
const verificationController = new VerificationController();

// Manager routes
router.post(
  '/',
  authenticate,
  authorize('MANAGER'),
  notTerminated,
  validate(submitVerificationSchema),
  (req, res) => verificationController.submit(req, res)
);

router.get(
  '/my',
  authenticate,
  authorize('MANAGER'),
  (req, res) => verificationController.getMyVerifications(req, res)
);

// Admin routes
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUBADMIN'),
  (req, res) => verificationController.getAll(req, res)
);

router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUBADMIN'),
  (req, res) => verificationController.getById(req, res)
);

router.post(
  '/:id/review',
  authenticate,
  authorize('ADMIN', 'SUBADMIN'),
  validate(reviewVerificationSchema),
  (req, res) => verificationController.review(req, res)
);

export default router;