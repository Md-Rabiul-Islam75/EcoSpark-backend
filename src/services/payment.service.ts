import { PrismaClient } from '@prisma/client';
import AppError from '../utils/AppError';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class PaymentService {
  // Create payment session
  static async createPaymentSession(userId: string, ideaId: string) {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    if (!idea.isPaid) {
      throw new AppError('This idea is free', 400);
    }

    // Check if user already has access
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId,
        ideaId,
        status: 'SUCCEEDED',
      },
    });

    if (existingPayment) {
      throw new AppError('You already have access to this idea', 400);
    }

    // Create stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: idea.title,
              description: idea.description.substring(0, 200),
              images: idea.images,
            },
            unit_amount: Math.round((idea.price?.toNumber() || 0) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/idea/${ideaId}`,
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        ideaId,
        stripeSessionId: session.id,
        amount: idea.price || 0,
        status: 'PENDING',
      },
    });

    return {
      sessionId: session.id,
      clientSecret: session.client_secret,
      paymentId: payment.id,
    };
  }

  // Handle webhook
  static async handleWebhook(event: any) {
    switch (event.type) {
      case 'checkout.session.completed':
        return this.handleCheckoutComplete(event.data.object);
      case 'charge.refunded':
        return this.handleRefund(event.data.object);
      default:
        return null;
    }
  }

  private static async handleCheckoutComplete(session: any) {
    const payment = await prisma.payment.findUnique({
      where: { stripeSessionId: session.id },
    });

    if (!payment) {
      throw new AppError('Payment not found', 404);
    }

    return prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCEEDED',
        stripePaymentId: session.payment_intent,
      },
    });
  }

  private static async handleRefund(charge: any) {
    const payment = await prisma.payment.findUnique({
      where: { stripePaymentId: charge.payment_intent },
    });

    if (!payment) {
      return null;
    }

    return prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED' },
    });
  }

  // Check if user has access
  static async hasAccess(userId: string, ideaId: string) {
    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
    });

    if (!idea) {
      throw new AppError('Idea not found', 404);
    }

    // Free ideas are accessible to all
    if (!idea.isPaid) {
      return true;
    }

    // Check if user is author
    if (idea.authorId === userId) {
      return true;
    }

    // Check for successful payment
    const payment = await prisma.payment.findFirst({
      where: {
        userId,
        ideaId,
        status: 'SUCCEEDED',
      },
    });

    return !!payment;
  }

  // Get user payments
  static async getUserPayments(userId: string) {
    return prisma.payment.findMany({
      where: { userId },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            slug: true,
            price: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
