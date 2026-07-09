import { PrismaClient, CommentStatus } from '@prisma/client';
import AppError from '../utils/AppError';
import { paginate } from '../utils/paginate';

const prisma = new PrismaClient();

export class CommentService {
  // Create comment
  static async createComment(data: {
    ideaId: string;
    authorId: string;
    content: string;
    parentId?: string;
  }) {
    const idea = await prisma.idea.findUnique({
      where: { id: data.ideaId },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    const comment = await prisma.comment.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        replies: true,
      },
    });

    return comment;
  }

  // Get comments for idea
  static async getComments(ideaId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          ideaId,
          parentId: null,
          status: CommentStatus.ACTIVE,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          replies: {
            where: { status: CommentStatus.ACTIVE },
            orderBy: { createdAt: 'asc' },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  profileImage: true,
                },
              },
            },
          },
        },
      }),
      prisma.comment.count({
        where: {
          ideaId,
          parentId: null,
          status: CommentStatus.ACTIVE,
        },
      }),
    ]);

    return paginate(comments, total, page, limit);
  }

  // Delete comment
  static async deleteComment(commentId: string, userId: string) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    // Check if user is comment author or admin
    if (comment.authorId !== userId) {
      throw new AppError('You can only delete your own comments', 403);
    }

    return prisma.comment.update({
      where: { id: commentId },
      data: { status: CommentStatus.DELETED },
    });
  }

  // Update comment
  static async updateComment(
    commentId: string,
    userId: string,
    content: string
  ) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new AppError('Comment not found', 404);
    }

    if (comment.authorId !== userId) {
      throw new AppError('You can only edit your own comments', 403);
    }

    return prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }
}
