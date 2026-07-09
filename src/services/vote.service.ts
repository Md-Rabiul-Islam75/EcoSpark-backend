import { PrismaClient, VoteType } from '@prisma/client';
import AppError from '../utils/AppError';

const prisma = new PrismaClient();

export class VoteService {
  // Create or update vote
  static async vote(userId: string, ideaId: string, voteType: 'UP' | 'DOWN') {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_ideaId: {
          userId,
          ideaId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Remove vote if same type
        await prisma.vote.delete({
          where: {
            userId_ideaId: {
              userId,
              ideaId,
            },
          },
        });
        return { message: 'Vote removed', vote: null };
      } else {
        // Update vote if different type
        return prisma.vote.update({
          where: {
            userId_ideaId: {
              userId,
              ideaId,
            },
          },
          data: { type: voteType as VoteType },
        });
      }
    }

    // Create new vote
    return prisma.vote.create({
      data: {
        userId,
        ideaId,
        type: voteType as VoteType,
      },
    });
  }

  // Get votes for idea
  static async getVotes(ideaId: string) {
    const votes = await prisma.vote.groupBy({
      by: ['type'],
      where: { ideaId },
      _count: true,
    });

    const upvotes = votes.find(v => v.type === 'UP')?._count || 0;
    const downvotes = votes.find(v => v.type === 'DOWN')?._count || 0;

    return { upvotes, downvotes };
  }

  // Get user vote on idea
  static async getUserVote(userId: string, ideaId: string) {
    return prisma.vote.findUnique({
      where: {
        userId_ideaId: {
          userId,
          ideaId,
        },
      },
    });
  }
}
