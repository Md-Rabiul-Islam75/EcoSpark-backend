import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { asyncHandler } from '../utils/asyncHandler';
import { sendResponse } from '../utils/response';
import { mailer } from '../config/mailer';

export const subscribeNewsletter = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const subscription = await prisma.newsletter.upsert({
    where: { email },
    update: {},
    create: { email, userId: req.user?.id },
  });

  try {
    await Promise.all([
      mailer.sendMail({
        from: env.smtpUser,
        to: email,
        subject: 'Welcome to EcoSpark Hub',
        text: 'Thanks for subscribing to the EcoSpark Hub newsletter.',
      }),
      mailer.sendMail({
        from: env.smtpUser,
        to: env.adminEmail,
        subject: 'New EcoSpark newsletter subscriber',
        text: `${email} subscribed to the EcoSpark Hub newsletter.`,
      }),
    ]);
  } catch (error) {
    console.error('Newsletter email delivery failed:', error);
  }

  sendResponse(res, 201, subscription, 'Newsletter subscription saved');
});
