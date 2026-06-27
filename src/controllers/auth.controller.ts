import type { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { comparePassword, hashPassword } from '../utils/password';
import { signAccessToken, signRefreshToken } from '../utils/jwt';
import { sendResponse } from '../utils/response';

const sanitizeUser = (user: { id: string; name: string; email: string; role: Role; profileImage: string | null }) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
});

const issueTokens = async (userId: string, role: Role) => {
  const accessToken = signAccessToken({ userId, role });
  const refreshToken = signRefreshToken({ userId, role });
  await prisma.user.update({ where: { id: userId }, data: { refreshToken } });
  return { accessToken, refreshToken };
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, profileImage } = req.body;
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new AppError(409, 'Email is already registered');
  }

  const hashedPassword = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      profileImage,
      role: Role.MEMBER,
    },
  });

  const tokens = await issueTokens(user.id, user.role);

  sendResponse(res, 201, {
    user: sanitizeUser(user),
    ...tokens,
  }, 'User registered successfully');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.isActive) {
    throw new AppError(401, 'Invalid login credentials');
  }

  const passwordMatch = await comparePassword(password, user.password);
  if (!passwordMatch) {
    throw new AppError(401, 'Invalid login credentials');
  }

  const tokens = await issueTokens(user.id, user.role);

  sendResponse(res, 200, {
    user: sanitizeUser(user),
    ...tokens,
  }, 'Login successful');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const token = req.body.refreshToken as string | undefined;
  if (!token) {
    throw new AppError(400, 'Refresh token is required');
  }

  const user = await prisma.user.findFirst({ where: { refreshToken: token } });
  if (!user) {
    throw new AppError(401, 'Invalid refresh token');
  }

  const tokens = await issueTokens(user.id, user.role);
  sendResponse(res, 200, tokens, 'Token refreshed');
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (userId) {
    await prisma.user.update({ where: { id: userId }, data: { refreshToken: null } });
  }

  sendResponse(res, 200, null, 'Logout successful');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError(401, 'Unauthorized access');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      ideas: true,
      payments: true,
      comments: true,
      votes: true,
    },
  });

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  sendResponse(res, 200, {
    ...sanitizeUser(user),
    bio: user.bio,
    isActive: user.isActive,
    ideasCount: user.ideas.length,
    votesCount: user.votes.length,
    commentsCount: user.comments.length,
    purchasedIdeas: user.payments.filter((payment) => payment.status === 'SUCCEEDED').length,
  });
});
