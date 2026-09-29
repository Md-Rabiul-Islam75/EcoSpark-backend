import type { Request, Response } from 'express';
import { VoteType } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/response';

const getRouteParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const castVote = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Unauthorized access');

  const ideaId = getRouteParam(req.params.ideaId);
  const { type } = req.body as { type: VoteType | 'REMOVE' };

  const existing = await prisma.vote.findUnique({
    where: { userId_ideaId: { userId, ideaId } },
  });

  if (type === 'REMOVE') {
    if (existing) {
      await prisma.vote.delete({ where: { userId_ideaId: { userId, ideaId } } });
    }
    const totalVotes = await prisma.vote.count({ where: { ideaId } });
    sendResponse(res, 200, { totalVotes }, 'Vote removed');
    return;
  }

  const vote = existing
    ? await prisma.vote.update({
        where: { userId_ideaId: { userId, ideaId } },
        data: { type },
      })
    : await prisma.vote.create({
        data: { userId, ideaId, type },
      });

  const totalVotes = await prisma.vote.count({ where: { ideaId } });
  sendResponse(res, 200, { vote, totalVotes }, 'Vote recorded');
});
