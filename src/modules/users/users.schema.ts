import { z } from 'zod';

export const selfVerifySchema = z.object({
  fatherName: z.string().min(1),
  instituteName: z.string().min(1),
  permanentAddress: z.string().min(1),
  phoneNumber: z.string().min(10),
  whatsappNumber: z.string().min(10),
});

export const updateProfileSchema = z.object({
  fullName: z.string().optional(),
  phone: z.string().optional(),
});

export type SelfVerifyInput = z.infer<typeof selfVerifySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;