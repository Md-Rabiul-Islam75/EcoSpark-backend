import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';
import { verifyAccessToken } from '../src/utils/jwt';

const getUser = async (authorization: string | undefined) => {
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  const payload = verifyAccessToken(token);
  return prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true, isActive: true },
  });
};

export default async (req: any, res: any) => {
  const origin = req.headers.origin;
  res.setHeader(
    'Access-Control-Allow-Origin',
    origin === 'https://eco-spark-frontend-blue.vercel.app' ? origin : env.corsOrigin,
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const route = req.query.route;

  try {
    if (route === 'newsletter-subscribe' && req.method === 'POST') {
      const email = String(req.body?.email || '').trim().toLowerCase();
      if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({ success: false, message: 'A valid email is required' });
      }

      let userId: string | undefined;
      try {
        const user = await getUser(req.headers.authorization);
        userId = user?.isActive ? user.id : undefined;
      } catch {
        userId = undefined;
      }

      const subscription = await prisma.newsletter.upsert({
        where: { email },
        update: {},
        create: { email, userId },
      });
      return res.status(201).json({
        success: true,
        message: 'Newsletter subscription saved',
        data: subscription,
      });
    }

    const user = await getUser(req.headers.authorization);
    if (!user?.isActive || user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    if (route === 'admin-stats' && req.method === 'GET') {
      const [totalUsers, totalIdeas, pendingIdeas, approvedIdeas, rejectedIdeas, revenue] = await Promise.all([
        prisma.user.count(),
        prisma.idea.count(),
        prisma.idea.count({ where: { status: 'UNDER_REVIEW' } }),
        prisma.idea.count({ where: { status: 'APPROVED' } }),
        prisma.idea.count({ where: { status: 'REJECTED' } }),
        prisma.payment.aggregate({ where: { status: 'SUCCEEDED' }, _sum: { amount: true } }),
      ]);
      return res.status(200).json({
        success: true,
        message: 'Success',
        data: { totalUsers, totalIdeas, pendingIdeas, approvedIdeas, rejectedIdeas, revenue: revenue._sum.amount || 0 },
      });
    }

    if (route === 'admin-ideas' && req.method === 'GET') {
      const page = Math.max(Number(req.query.page) || 1, 1);
      const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
      const skip = (page - 1) * limit;
      const status = typeof req.query.status === 'string' ? req.query.status : undefined;
      const where = status ? { status: status as any } : {};
      const [items, total] = await Promise.all([
        prisma.idea.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { id: true, name: true, email: true, profileImage: true } },
            category: { select: { id: true, name: true, slug: true } },
            _count: { select: { votes: true, comments: true, payments: true } },
          },
        }),
        prisma.idea.count({ where }),
      ]);
      return res.status(200).json({
        success: true,
        message: 'Success',
        data: { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } },
      });
    }

    return res.status(404).json({ success: false, message: 'Route not found' });
  } catch (error) {
    console.error('Legacy route failed:', error);
    return res.status(401).json({ success: false, message: 'Unauthorized access' });
  }
};
