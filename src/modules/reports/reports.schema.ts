import { z } from 'zod';

export const createReportSchema = z.object({
  bookingId: z.string(),
  description: z.string().min(10),
});

export const resolveReportSchema = z.object({
  decision: z.enum(['STUDENT_FAULT', 'MANAGER_FAULT', 'NONE']),
  finalResolution: z.string().min(1),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;