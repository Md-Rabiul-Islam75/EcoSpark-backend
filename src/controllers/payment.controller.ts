import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { prisma } from '../config/prisma';
import { stripe } from '../config/stripe';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/response';

export const createCheckoutSession = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Unauthorized access');

  const { ideaId } = req.body;
  const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
  if (!idea) throw new AppError(404, 'Idea not found');
  if (!idea.isPaid || !idea.price) throw new AppError(400, 'This idea does not require payment');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: idea.title, description: idea.problemStatement },
          unit_amount: Math.round(Number(idea.price) * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { ideaId, userId },
    success_url: `${env.appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.appUrl}/payment/cancel`,
  });

  await prisma.payment.create({
    data: {
      userId,
      ideaId,
      stripeSessionId: session.id,
      amount: idea.price as Prisma.Decimal,
      currency: 'usd',
      status: 'PENDING',
    },
  });

  sendResponse(res, 200, { url: session.url }, 'Checkout session created');
});

export const stripeWebhook = asyncHandler(async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  if (!sig || !req.rawBody) {
    throw new AppError(400, 'Invalid webhook request');
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, env.stripeWebhookSecret);
  } catch (error) {
    throw new AppError(400, `Webhook signature verification failed`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const payment = await prisma.payment.updateMany({
      where: { stripeSessionId: session.id },
      data: {
        status: 'SUCCEEDED',
        stripePaymentId: session.payment_intent?.toString() || null,
      },
    });

    if (payment.count > 0) {
      await prisma.idea.updateMany({
        where: { id: session.metadata?.ideaId },
        data: { isPublished: true },
      });
    }
  }

  res.json({ received: true });
});

export const myPurchasedIdeas = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) throw new AppError(401, 'Unauthorized access');

  const payments = await prisma.payment.findMany({
    where: { userId, status: 'SUCCEEDED' },
    include: { idea: { include: { category: true, author: { select: { id: true, name: true, profileImage: true } } } } },
    orderBy: { createdAt: 'desc' },
  });

  sendResponse(res, 200, payments);
});
