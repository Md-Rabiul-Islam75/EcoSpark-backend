import { PrismaClient, IdeaStatus, Role } from '@prisma/client';
import AppError from '../utils/AppError';
import { paginate } from '../utils/paginate';

const prisma = new PrismaClient();

export class AdminService {
  // Get all ideas (all statuses)
  static async getAllIdeas(page: number = 1, limit: number = 20, filters?: {
    status?: IdeaStatus;
    categoryId?: string;
  }) {
    const skip = (page - 1) * limit;

    let where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
          category: true,
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.idea.count({ where }),
    ]);

    return paginate(ideas, total, page, limit);
  }

  // Approve idea
  static async approveIdea(ideaId: string) {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    return prisma.idea.update({
      where: { id: ideaId },
      data: {
        status: IdeaStatus.APPROVED,
        isPublished: true,
        feedback: null,
      },
      include: {
        author: true,
        category: true,
      },
    });
  }

  // Reject idea
  static async rejectIdea(ideaId: string, feedback: string) {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    return prisma.idea.update({
      where: { id: ideaId },
      data: {
        status: IdeaStatus.REJECTED,
        feedback,
      },
      include: {
        author: true,
        category: true,
      },
    });
  }

  // Feature idea
  static async featureIdea(ideaId: string) {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    return prisma.idea.update({
      where: { id: ideaId },
      data: { isFeatured: true },
    });
  }

  // Unfeature idea
  static async unfeatureIdea(ideaId: string) {
    return prisma.idea.update({
      where: { id: ideaId },
      data: { isFeatured: false },
    });
  }

  // Delete comment (admin only)
  static async deleteComment(commentId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    return prisma.comment.update({
      where: { id: commentId },
      data: { status: 'DELETED' },
    });
  }

  // Get dashboard stats
  static async getDashboardStats() {
    const [
      totalUsers,
      totalIdeas,
      pendingIdeas,
      approvedIdeas,
      rejectedIdeas,
      totalVotes,
      totalComments,
      totalPayments,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.idea.count(),
      prisma.idea.count({ where: { status: IdeaStatus.UNDER_REVIEW } }),
      prisma.idea.count({ where: { status: IdeaStatus.APPROVED } }),
      prisma.idea.count({ where: { status: IdeaStatus.REJECTED } }),
      prisma.vote.count(),
      prisma.comment.count(),
      prisma.payment.count({ where: { status: 'SUCCEEDED' } }),
    ]);

    return {
      totalUsers,
      totalIdeas,
      pendingIdeas,
      approvedIdeas,
      rejectedIdeas,
      totalVotes,
      totalComments,
      totalPayments,
    };
  }

  // Get top voted ideas
  static async getTopVotedIdeas(limit: number = 5) {
    return prisma.idea.findMany({
      where: {
        status: IdeaStatus.APPROVED,
        isPublished: true,
      },
      include: {
        _count: {
          select: { votes: true },
        },
      },
      orderBy: {
        votes: {
          _count: 'desc',
        },
      },
      take: limit,
    });
  }
}
