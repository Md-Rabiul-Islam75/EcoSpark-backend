import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { createSlug } from '../utils/slug';
import { sendResponse } from '../utils/response';

export const listBlogs = asyncHandler(async (_req: Request, res: Response) => {
  const blogs = await prisma.blog.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: 'desc' },
    include: { author: { select: { id: true, name: true, profileImage: true } } },
  });

  sendResponse(res, 200, blogs);
});

export const createBlog = asyncHandler(async (req: Request, res: Response) => {
  const blog = await prisma.blog.create({
    data: {
      title: req.body.title,
      slug: createSlug(req.body.title),
      content: req.body.content,
      coverImage: req.body.coverImage,
      authorId: req.user?.id || '',
      publishedAt: req.body.publishedAt ? new Date(req.body.publishedAt) : null,
    },
  });

  sendResponse(res, 201, blog, 'Blog created');
});
