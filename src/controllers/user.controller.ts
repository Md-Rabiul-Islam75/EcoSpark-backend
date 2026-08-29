import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { hashPassword } from '../utils/password';
import { sendResponse } from '../utils/response';

const profileSelect = {
  id: true,
  name: true,
  email: true,
  profileImage: true,
  bio: true,
  role: true,
  isActive: true,
};

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Unauthorized access');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  sendResponse(res, 200, user);
});

export const getStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Unauthorized access');

  const [ideas, votes, comments, payments] = await Promise.all([
    prisma.idea.count({ where: { authorId: userId } }),
    prisma.vote.count({ where: { userId } }),
    prisma.comment.count({ where: { authorId: userId } }),
    prisma.payment.count({ where: { userId, status: 'SUCCEEDED' } }),
  ]);

  sendResponse(res, 200, { ideas, votes, comments, payments });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Unauthorized access');

  const { name, profileImage, bio, email, password } = req.body;
  const data: Record<string, unknown> = {};

  if (name) data.name = name;
  if (profileImage !== undefined) data.profileImage = profileImage;
  if (bio !== undefined) data.bio = bio;
  if (email) data.email = email;
  if (password) data.password = await hashPassword(password);

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: profileSelect,
  });

  sendResponse(res, 200, user, 'Profile updated');
});
