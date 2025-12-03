import { z } from 'zod';

export const registerSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['STUDENT', 'MANAGER']),
    fullName: z
      .string()
      .min(1, 'Full name is required')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'STUDENT' && !data.fullName?.trim()) {
      ctx.addIssue({
        path: ['fullName'],
        code: z.ZodIssueCode.custom,
        message: 'Full name is required for students',
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const createSubAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateSubAdminInput = z.infer<typeof createSubAdminSchema>;