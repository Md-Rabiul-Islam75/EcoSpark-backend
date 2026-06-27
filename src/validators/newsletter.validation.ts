import { z } from 'zod';

export const newsletterSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});
