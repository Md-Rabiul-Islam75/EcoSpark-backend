import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/response';

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
  const { id } = req.params;
  const { role, isActive } = req.body as { role?: Role; isActive?: boolean };

  const user = await prisma.user.update({
    where: { id },
    data: { ...(role ? { role } : {}), ...(typeof isActive === 'boolean' ? { isActive } : {}) },
  });

  sendResponse(res, 200, user, 'User updated');
});
