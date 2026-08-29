import type { Request, Response } from 'express';
import { IdeaStatus, Role, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { createSlug } from '../utils/slug';
import { buildPagination } from '../utils/paginate';
import { sendResponse } from '../utils/response';

const ideaSelect = {
  id: true,
  title: true,
  slug: true,
  problemStatement: true,
  proposedSolution: true,
  description: true,
  images: true,
  status: true,
  visibility: true,
  price: true,
  feedback: true,
  isPaid: true,
  isPublished: true,
  isFeatured: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  author: { select: { id: true, name: true, email: true, profileImage: true } },
  category: { select: { id: true, name: true, slug: true } },
  _count: { select: { votes: true, comments: true, payments: true } },
};

const canViewPaidIdea = async (ideaId: string, userId?: string) => {
  if (!userId) return false;
  const payment = await prisma.payment.findFirst({
    where: { ideaId, userId, status: 'SUCCEEDED' },
    select: { id: true },
  });
  return Boolean(payment);
};

const formatIdea = async (idea: any, userId?: string) => {
  const voteAgg = await prisma.vote.groupBy({
    by: ['type'],
    where: { ideaId: idea.id },
    _count: { type: true },
  });

  const upvotes = voteAgg.find((vote) => vote.type === 'UP')?._count.type || 0;
  const downvotes = voteAgg.find((vote) => vote.type === 'DOWN')?._count.type || 0;
  const unlocked = !idea.isPaid || idea.authorId === userId || (await canViewPaidIdea(idea.id, userId));

  return {
    ...idea,
    isUnlocked: unlocked,
    voteCount: upvotes - downvotes,
  };
};

export const listIdeas = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = buildPagination(req.query.page as string, req.query.limit as string);
  const search = (req.query.search as string | undefined)?.trim();
  const category = (req.query.categoryId as string | undefined) ?? (req.query.category as string | undefined);
  const payment =
    (req.query.isPaid as string | undefined) ??
    (req.query.payment as string | undefined);
  const author = req.query.author as string | undefined;
  const minVotes = Number(req.query.minVotes || 0);
  const sort = (req.query.sort as string) || (req.query.sortBy as string) || 'recent';

  const where: Prisma.IdeaWhereInput = { status: IdeaStatus.APPROVED, isPublished: true };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { problemStatement: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (category) {
    where.category = { slug: category };
  }

  if (payment === 'paid' || payment === 'true') {
    where.isPaid = true;
  }

  if (payment === 'free' || payment === 'false') {
    where.isPaid = false;
  }

  if (author) {
    where.author = { name: { contains: author, mode: 'insensitive' } };
  }

  const orderBy =
    sort === 'top'
      ? { votes: { _count: 'desc' as const } }
      : sort === 'comments'
        ? { comments: { _count: 'desc' as const } }
        : { createdAt: 'desc' as const };

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({ where, orderBy, skip, take: limit, select: ideaSelect }),
    prisma.idea.count({ where }),
  ]);

  const formatted = await Promise.all(ideas.map((idea) => formatIdea(idea, req.user?.id)));

  const filtered = formatted.filter((idea) => idea.voteCount >= minVotes);

  sendResponse(res, 200, {
    items: filtered,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getUserIdeas = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, 'Unauthorized access');
  }

  const { page, limit, skip } = buildPagination(req.query.page as string, req.query.limit as string);

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
      where: { authorId: userId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: ideaSelect,
    }),
    prisma.idea.count({ where: { authorId: userId } }),
  ]);

  const formatted = await Promise.all(ideas.map((idea) => formatIdea(idea, userId)));

  sendResponse(res, 200, {
    items: formatted,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const getIdeaBySlug = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const idea = await prisma.idea.findUnique({ where: { slug }, select: ideaSelect as any });

  if (!idea) {
    throw new AppError(404, 'Idea not found');
  }

  const formatted = await formatIdea(idea, req.user?.id);

  if (!formatted.isUnlocked && req.user?.id !== idea.author.id) {
    formatted.description = 'This premium idea is locked until purchase.';
    formatted.problemStatement = 'Premium content locked';
    formatted.proposedSolution = 'Premium content locked';
    formatted.images = idea.images.slice(0, 1);
  }

  sendResponse(res, 200, formatted);
});

export const createIdea = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, 'Unauthorized access');
  }

  const { title, categoryId, problemStatement, proposedSolution, description, images, isPaid, price, status } = req.body;
  const slug = createSlug(`${title}-${Date.now()}`);

  const idea = await prisma.idea.create({
    data: {
      title,
      slug,
      categoryId,
      problemStatement,
      proposedSolution,
      description,
      images: images || [],
      isPaid: Boolean(isPaid),
      visibility: isPaid ? 'PAID' : 'FREE',
      price: isPaid ? price : null,
      status: status === 'DRAFT' ? IdeaStatus.DRAFT : IdeaStatus.UNDER_REVIEW,
      isPublished: false,
      authorId: userId,
    },
  });

  sendResponse(res, 201, idea, 'Idea created');
});

export const updateIdea = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const role = req.user?.role;

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    throw new AppError(404, 'Idea not found');
  }

  if (role !== Role.ADMIN && idea.authorId !== userId) {
    throw new AppError(403, 'You can only update your own ideas');
  }

  if (idea.status === IdeaStatus.APPROVED && role !== Role.ADMIN) {
    throw new AppError(400, 'Approved ideas cannot be edited');
  }

  const updated = await prisma.idea.update({
    where: { id },
    data: {
      ...(req.body.title ? { title: req.body.title, slug: createSlug(`${req.body.title}-${Date.now()}`) } : {}),
      ...(req.body.categoryId ? { categoryId: req.body.categoryId } : {}),
      ...(req.body.problemStatement ? { problemStatement: req.body.problemStatement } : {}),
      ...(req.body.proposedSolution ? { proposedSolution: req.body.proposedSolution } : {}),
      ...(req.body.description ? { description: req.body.description } : {}),
      ...(req.body.images ? { images: req.body.images } : {}),
      ...(typeof req.body.isPaid === 'boolean' ? { isPaid: req.body.isPaid, visibility: req.body.isPaid ? 'PAID' : 'FREE' } : {}),
      ...(req.body.price !== undefined ? { price: req.body.price } : {}),
    },
  });

  sendResponse(res, 200, updated, 'Idea updated');
});

export const deleteIdea = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const role = req.user?.role;

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    throw new AppError(404, 'Idea not found');
  }

  if (role !== Role.ADMIN && idea.authorId !== userId) {
    throw new AppError(403, 'You can only delete your own ideas');
  }

  if (idea.status === IdeaStatus.APPROVED && role !== Role.ADMIN) {
    throw new AppError(400, 'Approved ideas cannot be deleted');
  }

  await prisma.idea.delete({ where: { id } });
  sendResponse(res, 200, null, 'Idea deleted');
});

export const submitIdea = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const idea = await prisma.idea.findUnique({ where: { id } });

  if (!idea || idea.authorId !== userId) {
    throw new AppError(404, 'Idea not found');
  }

  if (idea.status !== IdeaStatus.DRAFT) {
    throw new AppError(400, 'Only drafts can be submitted');
  }

  const updated = await prisma.idea.update({
    where: { id },
    data: { status: IdeaStatus.UNDER_REVIEW },
  });

  sendResponse(res, 200, updated, 'Idea submitted for review');
});

export const reviewIdea = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, feedback } = req.body as { status: 'APPROVED' | 'REJECTED'; feedback?: string };

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    throw new AppError(404, 'Idea not found');
  }

  const updated = await prisma.idea.update({
    where: { id },
    data: {
      status: status === 'APPROVED' ? IdeaStatus.APPROVED : IdeaStatus.REJECTED,
      isPublished: status === 'APPROVED',
      feedback: status === 'REJECTED' ? feedback || 'Rejected by admin' : null,
    },
  });

  sendResponse(res, 200, updated, 'Idea reviewed');
});
