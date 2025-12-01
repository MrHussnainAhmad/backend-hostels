import { Router } from 'express';
import { ChatController } from './chat.controller';
import { validate } from '../../middleware/validate.middleware';
import { authenticate, authorize, notTerminated } from '../../middleware/auth.middleware';
import { startConversationSchema, sendMessageSchema } from './chat.schema';

const router = Router();
const chatController = new ChatController();

// Student routes
router.post(
  '/conversation',
  authenticate,
  authorize('STUDENT'),
  notTerminated,
  validate(startConversationSchema),
  (req, res) => chatController.startConversation(req, res)
);

// Common routes for Student and Manager
router.post(
  '/message',
  authenticate,
  authorize('STUDENT', 'MANAGER'),
  notTerminated,
  validate(sendMessageSchema),
  (req, res) => chatController.sendMessage(req, res)
);

router.get(
  '/conversations',
  authenticate,
  authorize('STUDENT', 'MANAGER'),
  (req, res) => chatController.getMyConversations(req, res)
);

router.get(
  '/conversation/:conversationId/messages',
  authenticate,
  authorize('STUDENT', 'MANAGER', 'ADMIN', 'SUBADMIN'),
  (req, res) => chatController.getMessages(req, res)
);

// Admin routes
router.get(
  '/admin/conversations',
  authenticate,
  authorize('ADMIN', 'SUBADMIN'),
  (req, res) => chatController.getAllConversations(req, res)
);

export default router;