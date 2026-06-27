import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { hashPassword } from '../utils/password';
import { sendResponse } from '../utils/response';

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
    select: { id: true, name: true, email: true, profileImage: true, bio: true, role: true, isActive: true },
  });

  sendResponse(res, 200, user, 'Profile updated');
});
