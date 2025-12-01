import { z } from 'zod';

export const createReservationSchema = z.object({
  hostelId: z.string(),
  message: z.string().optional(),
});

export const reviewReservationSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
  rejectReason: z.string().optional(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;
export type ReviewReservationInput = z.infer<typeof reviewReservationSchema>;