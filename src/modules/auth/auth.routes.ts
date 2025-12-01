import { Router } from 'express';
import { AuthController } from './auth.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { registerSchema, loginSchema, createSubAdminSchema } from './auth.schema';

const router = Router();
const authController = new AuthController();

router.post('/register', validate(registerSchema), (req, res) => authController.register(req, res));
router.post('/login', validate(loginSchema), (req, res) => authController.login(req, res));
router.get('/me', authenticate, (req, res) => authController.getMe(req, res));

router.post(
  '/sub-admin',
  authenticate,
  authorize('ADMIN'),
  validate(createSubAdminSchema),
  (req, res) => authController.createSubAdmin(req, res)
);

router.delete(
  '/sub-admin/:id',
  authenticate,
  authorize('ADMIN'),
  (req, res) => authController.deleteSubAdmin(req, res)
);

export default router;