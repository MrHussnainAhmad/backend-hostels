import { z } from 'zod';

export const startConversationSchema = z.object({
  managerId: z.string(),
});

export const sendMessageSchema = z.object({
  conversationId: z.string(),
  text: z.string().min(1),
});

export type StartConversationInput = z.infer<typeof startConversationSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;