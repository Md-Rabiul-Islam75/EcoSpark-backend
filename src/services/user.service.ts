import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../utils/password';
import AppError from '../utils/AppError';
import { paginate } from '../utils/paginate';

const prisma = new PrismaClient();

export class UserService {
  // Get user profile
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        bio: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            ideas: true,
            votes: true,
            comments: true,
          },
        },
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  // Update profile
  static async updateProfile(
    userId: string,
    data: {
      name?: string;
      bio?: string;
      profileImage?: string;
    }
  ) {
    return prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        profileImage: true,
        bio: true,
        role: true,
      },
    });
  }

  // Change password
  static async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { comparePassword } = await import('../utils/password');
    const isPasswordValid = await comparePassword(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    const hashedPassword = await hashPassword(newPassword);

    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }

  // Get user ideas summary
  static async getUserStats(userId: string) {
    const [ideas, votes, comments, payments] = await Promise.all([
      prisma.idea.count({ where: { authorId: userId } }),
      prisma.vote.count({ where: { userId } }),
      prisma.comment.count({ where: { authorId: userId } }),
      prisma.payment.count({ where: { userId, status: 'SUCCEEDED' } }),
    ]);

    return { ideas, votes, comments, payments };
  }

  // Get all users (admin)
  static async getAllUsers(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          profileImage: true,
          createdAt: true,
          _count: {
            select: {
              ideas: true,
            },
          },
        },
      }),
      prisma.user.count(),
    ]);

    return paginate(users, total, page, limit);
  }

  // Deactivate user (admin)
  static async deactivateUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });
  }

  // Activate user (admin)
  static async activateUser(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });
  }
}
