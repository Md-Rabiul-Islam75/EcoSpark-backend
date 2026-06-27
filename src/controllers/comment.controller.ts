import type { Request, Response } from 'express';
import { CommentStatus, Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/response';

export const listComments = asyncHandler(async (req: Request, res: Response) => {
  const { ideaId } = req.params;
  const comments = await prisma.comment.findMany({
    where: { ideaId, parentId: null, status: CommentStatus.ACTIVE },
    orderBy: { createdAt: 'asc' },
    include: {
      author: { select: { id: true, name: true, profileImage: true, role: true } },
      replies: {
        where: { status: CommentStatus.ACTIVE },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, profileImage: true, role: true } } },
      },
    },
  });

  sendResponse(res, 200, comments);
});

export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Unauthorized access');

  const { ideaId } = req.params;
  const { content, parentId } = req.body;

  const comment = await prisma.comment.create({
    data: {
      content,
      authorId: userId,
      ideaId,
      parentId,
    },
  });

  sendResponse(res, 201, comment, 'Comment added');
});

export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;
  const { id } = req.params;
  const comment = await prisma.comment.findUnique({ where: { id } });

  if (!comment) throw new AppError(404, 'Comment not found');
  if (comment.authorId !== userId && role !== Role.ADMIN) {
    throw new AppError(403, 'Forbidden');
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { content: req.body.content },
  });

  sendResponse(res, 200, updated, 'Comment updated');
});

export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;
  const { id } = req.params;
  const comment = await prisma.comment.findUnique({ where: { id } });

  if (!comment) throw new AppError(404, 'Comment not found');
  if (comment.authorId !== userId && role !== Role.ADMIN) {
    throw new AppError(403, 'Forbidden');
  }

  await prisma.comment.update({
    where: { id },
    data: { status: CommentStatus.DELETED, content: '[deleted]' },
  });

  sendResponse(res, 200, null, 'Comment deleted');
});
