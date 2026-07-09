import { PrismaClient } from '@prisma/client';
import { createSlug } from '../utils/slug';
import AppError from '../utils/AppError';

const prisma = new PrismaClient();

export class CategoryService {
  // Get all categories
  static async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            ideas: true,
          },
        },
      },
    });
  }

  // Get single category with ideas
  static async getCategory(slug: string, page: number = 1, limit: number = 12) {
    const skip = (page - 1) * limit;

    const category = await prisma.category.findUnique({
      where: { slug },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where: {
          categoryId: category.id,
          status: 'APPROVED',
          isPublished: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
          category: true,
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
      }),
      prisma.idea.count({
        where: {
          categoryId: category.id,
          status: 'APPROVED',
          isPublished: true,
        },
      }),
    ]);

    return {
      category,
      ideas,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Create category (admin)
  static async createCategory(data: { name: string; description?: string }) {
    const slug = createSlug(data.name);

    const existingCategory = await prisma.category.findUnique({
      where: { slug },
    });

    if (existingCategory) {
      throw new AppError('Category already exists', 409);
    }

    return prisma.category.create({
      data: {
        ...data,
        slug,
      },
    });
  }

  // Update category (admin)
  static async updateCategory(
    categoryId: string,
    data: { name?: string; description?: string }
  ) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const updateData: any = {};
    if (data.name) {
      updateData.name = data.name;
      updateData.slug = createSlug(data.name);
    }
    if (data.description) {
      updateData.description = data.description;
    }

    return prisma.category.update({
      where: { id: categoryId },
      data: updateData,
    });
  }

  // Delete category (admin)
  static async deleteCategory(categoryId: string) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    const count = await prisma.idea.count({
      where: { categoryId },
    });

    if (count > 0) {
      throw new AppError('Cannot delete category with ideas', 400);
    }

    return prisma.category.delete({
      where: { id: categoryId },
    });
  }
}
