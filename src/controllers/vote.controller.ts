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
  const rawType = req.body.type ?? req.body.voteType;
  const type = typeof rawType === 'string' ? rawType.toUpperCase() : rawType;

  if (type !== VoteType.UP && type !== VoteType.DOWN && type !== 'REMOVE' && type !== 'UPVOTE' && type !== 'DOWNVOTE') {
    throw new AppError(400, 'Vote type must be UP, DOWN, or REMOVE');
  }

  const normalizedType = type === 'UPVOTE' ? VoteType.UP : type === 'DOWNVOTE' ? VoteType.DOWN : type;

  const existing = await prisma.vote.findUnique({
    where: { userId_ideaId: { userId, ideaId } },
  });

  if (normalizedType === 'REMOVE') {
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
        data: { type: normalizedType },
      })
    : await prisma.vote.create({
        data: { userId, ideaId, type: normalizedType },
      });

  const totalVotes = await prisma.vote.count({ where: { ideaId } });
  sendResponse(res, 200, { vote, totalVotes }, 'Vote recorded');
});
