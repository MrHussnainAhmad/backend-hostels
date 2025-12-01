import { Response } from 'express';
import { AuthRequest } from '../../types';
import { ChatService } from './chat.service';

const chatService = new ChatService();

export class ChatController {
  async startConversation(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await chatService.startConversation(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async sendMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await chatService.sendMessage(req.user!.userId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMyConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await chatService.getMyConversations(req.user!.userId, req.user!.role);
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await chatService.getConversationMessages(
        req.user!.userId,
        req.params.conversationId,
        req.user!.role
      );
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async getAllConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await chatService.getAllConversations();
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}