import { PrismaClient, IdeaStatus } from '@prisma/client';
import { createSlug } from '../utils/slug';
import AppError from '../utils/AppError';
import { paginate } from '../utils/paginate';

const prisma = new PrismaClient();

export class IdeaService {
  // Create idea (draft)
  static async createIdea(data: {
    title: string;
    problemStatement: string;
    proposedSolution: string;
    description: string;
    categoryId: string;
    images: string[];
    authorId: string;
  }) {
    const slug = createSlug(data.title);

    const existingIdea = await prisma.idea.findUnique({
      where: { slug },
    });

    if (existingIdea) {
      throw new AppError('An idea with this title already exists', 409);
    }

    const idea = await prisma.idea.create({
      data: {
        ...data,
        slug,
        status: IdeaStatus.DRAFT,
        isPublished: false,
      },
      include: {
        author: true,
        category: true,
      },
    });

    return idea;
  }

  // Submit idea for review
  static async submitIdea(ideaId: string, userId: string) {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    if (idea.authorId !== userId) {
      throw new AppError('You can only submit your own ideas', 403);
    }

    if (idea.status !== IdeaStatus.DRAFT) {
      throw new AppError('Only draft ideas can be submitted', 400);
    }

    return prisma.idea.update({
      where: { id: ideaId },
      data: { status: IdeaStatus.UNDER_REVIEW },
      include: {
        author: true,
        category: true,
      },
    });
  }

  // Get all approved ideas (paginated)
  static async getApprovedIdeas(page: number = 1, limit: number = 12, filters?: {
    categoryId?: string;
    search?: string;
    sortBy?: 'recent' | 'topVoted' | 'mostCommented';
    isPaid?: boolean;
  }) {
    const skip = (page - 1) * limit;

    let where: any = {
      status: IdeaStatus.APPROVED,
      isPublished: true,
    };

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters?.isPaid !== undefined) {
      where.isPaid = filters.isPaid;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };

    if (filters?.sortBy === 'topVoted') {
      orderBy = { votes: { _count: 'desc' } };
    } else if (filters?.sortBy === 'mostCommented') {
      orderBy = { comments: { _count: 'desc' } };
    }

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          category: true,
          votes: { select: { type: true } },
          _count: {
            select: {
              comments: true,
              votes: true,
            },
          },
        },
      }),
      prisma.idea.count({ where }),
    ]);

    return paginate(ideas, total, page, limit);
  }

  // Get single idea
  static async getIdea(ideaId: string) {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            bio: true,
          },
        },
        category: true,
        votes: { select: { type: true } },
        comments: {
          where: { status: 'ACTIVE' },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
            replies: {
              where: { status: 'ACTIVE' },
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
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    if (idea.status !== IdeaStatus.APPROVED && idea.status !== IdeaStatus.UNDER_REVIEW) {
      throw new AppError('Idea not available', 404);
    }

    return idea;
  }

  // Get user ideas
  static async getUserIdeas(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where: { authorId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.idea.count({ where: { authorId: userId } }),
    ]);

    return paginate(ideas, total, page, limit);
  }

  // Update idea
  static async updateIdea(
    ideaId: string,
    userId: string,
    data: Partial<{
      title: string;
      problemStatement: string;
      proposedSolution: string;
      description: string;
      categoryId: string;
      images: string[];
      isPaid: boolean;
      price: number;
    }>
  ) {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    if (idea.authorId !== userId) {
      throw new AppError('You can only edit your own ideas', 403);
    }

    if (idea.isPublished) {
      throw new AppError('Cannot edit published ideas', 400);
    }

    return prisma.idea.update({
      where: { id: ideaId },
      data,
      include: {
        author: true,
        category: true,
      },
    });
  }

  // Delete idea
  static async deleteIdea(ideaId: string, userId: string) {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    if (idea.authorId !== userId && idea.authorId !== userId) {
      throw new AppError('Unauthorized', 403);
    }

    return prisma.idea.delete({
      where: { id: ideaId },
    });
  }
}
