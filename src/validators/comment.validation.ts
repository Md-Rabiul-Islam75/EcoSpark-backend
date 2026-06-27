import { z } from 'zod';

export const commentCreateSchema = z.object({
  body: z.object({
    content: z.string().min(1),
    parentId: z.string().optional(),
  }),
});
