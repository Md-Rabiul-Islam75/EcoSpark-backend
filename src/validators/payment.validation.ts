import { z } from 'zod';

export const checkoutSchema = z.object({
  body: z.object({
    ideaId: z.string().min(1),
  }),
});
