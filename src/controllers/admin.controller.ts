import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/response';
import { buildPagination } from '../utils/paginate';

const getRouteParam = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] ?? '' : value ?? '';

export const dashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [totalUsers, totalIdeas, pendingIdeas, approvedIdeas, rejectedIdeas, revenue] = await Promise.all([
    prisma.user.count(),
    prisma.idea.count(),
    prisma.idea.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.idea.count({ where: { status: 'APPROVED' } }),
    prisma.idea.count({ where: { status: 'REJECTED' } }),
    prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true } }),
  ]);

  sendResponse(res, 200, {
    totalUsers,
    totalIdeas,
    pendingIdeas,
    approvedIdeas,
    rejectedIdeas,
    revenue: revenue._sum.amount || 0,
  });
});

export const listUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      profileImage: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  sendResponse(res, 200, users);
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const id = getRouteParam(req.params.id);
  const { role, isActive } = req.body as { role?: Role; isActive?: boolean };

  const user = await prisma.user.update({
    where: { id },
    data: { ...(role ? { role } : {}), ...(typeof isActive === 'boolean' ? { isActive } : {}) },
  });

  sendResponse(res, 200, user, 'User updated');
});

export const listIdeas = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = buildPagination(req.query.page as string, req.query.limit as string);
  const status = req.query.status as string | undefined;

  const where: Record<string, unknown> = {};
  if (status) {
    where.status = status;
  }

  const [ideas, total] = await Promise.all([
    prisma.idea.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, email: true, profileImage: true } },
        category: { select: { id: true, name: true, slug: true } },
        _count: { select: { votes: true, comments: true, payments: true } },
      },
    }),
    prisma.idea.count({ where }),
  ]);

  sendResponse(res, 200, {
    items: ideas,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

export const approveIdea = asyncHandler(async (req: Request, res: Response) => {
  const id = getRouteParam(req.params.id);

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    throw new AppError(404, 'Idea not found');
  }

  const updated = await prisma.idea.update({
    where: { id },
    data: { status: 'APPROVED', isPublished: true, feedback: null },
  });

  sendResponse(res, 200, updated, 'Idea approved');
});

export const rejectIdea = asyncHandler(async (req: Request, res: Response) => {
  const id = getRouteParam(req.params.id);
  const { feedback } = req.body as { feedback?: string };

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    throw new AppError(404, 'Idea not found');
  }

  const updated = await prisma.idea.update({
    where: { id },
    data: { status: 'REJECTED', isPublished: false, feedback: feedback || 'Rejected by admin' },
  });

  sendResponse(res, 200, updated, 'Idea rejected');
});

export const featureIdea = asyncHandler(async (req: Request, res: Response) => {
  const id = getRouteParam(req.params.id);

  const idea = await prisma.idea.findUnique({ where: { id } });
  if (!idea) {
    throw new AppError(404, 'Idea not found');
  }

  const updated = await prisma.idea.update({
    where: { id },
    data: { isFeatured: true },
  });

  sendResponse(res, 200, updated, 'Idea featured');
});
