import { prisma } from '../src/config/prisma';
import { env } from '../src/config/env';
import { verifyAccessToken } from '../src/utils/jwt';

export default async (req: any, res: any) => {
  res.setHeader('Access-Control-Allow-Origin', env.corsOrigin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const authorization = req.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true, isActive: true },
    });

    if (!user?.isActive || user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, profileImage: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ success: true, message: 'Success', data: users });
  } catch {
    return res.status(401).json({ success: false, message: 'Unauthorized access' });
  }
};
