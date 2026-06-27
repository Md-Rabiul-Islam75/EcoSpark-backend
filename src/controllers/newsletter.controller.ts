import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/response';

export const subscribeNewsletter = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const subscription = await prisma.newsletter.upsert({
    where: { email },
    update: {},
    create: { email, userId: req.user?.id },
  });

  sendResponse(res, 201, subscription, 'Newsletter subscription saved');
});
