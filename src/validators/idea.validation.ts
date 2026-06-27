import { z } from 'zod';

export const ideaCreateSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    categoryId: z.string().min(1),
    problemStatement: z.string().min(10),
    proposedSolution: z.string().min(10),
    description: z.string().min(20),
    images: z.array(z.string().url()).default([]),
    isPaid: z.boolean().default(false),
    price: z.coerce.number().positive().optional(),
    status: z.enum(['DRAFT', 'UNDER_REVIEW']).default('UNDER_REVIEW'),
    isFeatured: z.boolean().optional(),
  }),
});

export const ideaUpdateSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    categoryId: z.string().min(1).optional(),
    problemStatement: z.string().min(10).optional(),
    proposedSolution: z.string().min(10).optional(),
    description: z.string().min(20).optional(),
    images: z.array(z.string().url()).optional(),
    isPaid: z.boolean().optional(),
    price: z.coerce.number().positive().optional(),
  }),
});
