import type { Request, Response } from 'express';
import { VoteType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/response';

export const castVote = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Unauthorized access');

  const { ideaId } = req.params;
  const { type } = req.body as { type: VoteType | 'REMOVE' };

  const existing = await prisma.vote.findUnique({
    where: { userId_ideaId: { userId, ideaId } },
  });

  if (type === 'REMOVE') {
    if (existing) {
      await prisma.vote.delete({ where: { userId_ideaId: { userId, ideaId } } });
    }
    return sendResponse(res, 200, null, 'Vote removed');
  }

  const vote = existing
    ? await prisma.vote.update({
        where: { userId_ideaId: { userId, ideaId } },
        data: { type },
      })
    : await prisma.vote.create({
        data: { userId, ideaId, type },
      });

  sendResponse(res, 200, vote, 'Vote recorded');
});
