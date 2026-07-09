import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError';
import { paginate } from '../utils/paginate';

const prisma = new PrismaClient();

export class NewsletterService {
  // Subscribe
  static async subscribe(email: string) {
    const existingSubscription = await prisma.newsletter.findUnique({
      where: { email },
    });

    if (existingSubscription) {
      throw new AppError('Email already subscribed', 409);
    }

    return prisma.newsletter.create({
      data: { email },
    });
  }

  // Unsubscribe
  static async unsubscribe(email: string) {
    const subscription = await prisma.newsletter.findUnique({
      where: { email },
    });

    if (!subscription) {
      throw new AppError('Email not found in newsletter', 404);
    }

    return prisma.newsletter.delete({
      where: { email },
    });
  }

  // Get subscribers (admin)
  static async getSubscribers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [subscribers, total] = await Promise.all([
      prisma.newsletter.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.newsletter.count(),
    ]);

    return paginate(subscribers, total, page, limit);
  }

  // Get subscriber count
  static async getSubscriberCount() {
    return prisma.newsletter.count();
  }
}
