import type { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { asyncHandler } from '../utils/asyncHandler';
import { createSlug } from '../utils/slug';
import { sendResponse } from '../utils/response';

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { ideas: true } } },
  });

  sendResponse(res, 200, categories);
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const slug = createSlug(name);

  const category = await prisma.category.create({
    data: { name, slug, description },
  });

  sendResponse(res, 201, category, 'Category created');
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const slug = name ? createSlug(name) : undefined;

  const category = await prisma.category.update({
    where: { id },
    data: { ...(name ? { name, slug } : {}), ...(description !== undefined ? { description } : {}) },
  });

  sendResponse(res, 200, category, 'Category updated');
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category) {
    throw new AppError(404, 'Category not found');
  }

  await prisma.category.delete({ where: { id } });
  sendResponse(res, 200, null, 'Category deleted');
});
