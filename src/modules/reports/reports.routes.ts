import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize, notTerminated } from '../../middleware/auth.middleware';
import { createReportSchema, resolveReportSchema } from './reports.schema';

const router = Router();
const reportsController = new ReportsController();

// Student routes
router.post(
  '/',
  authenticate,
  authorize('STUDENT'),
  notTerminated,
  validate(createReportSchema),
  (req, res) => reportsController.create(req, res)
);

router.get(
  '/my',
  authenticate,
  authorize('STUDENT'),
  (req, res) => reportsController.getMyReports(req, res)
);

// Manager routes
router.get(
  '/manager/my',
  authenticate,
  authorize('MANAGER'),
  (req, res) => reportsController.getManagerReports(req, res)
);

// Admin routes
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'SUBADMIN'),
  (req, res) => reportsController.getAll(req, res)
);

router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'SUBADMIN'),
  (req, res) => reportsController.getById(req, res)
);

router.post(
  '/:id/resolve',
  authenticate,
  authorize('ADMIN', 'SUBADMIN'),
  validate(resolveReportSchema),
  (req, res) => reportsController.resolve(req, res)
);

export default router;