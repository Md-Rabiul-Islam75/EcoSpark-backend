import { PrismaClient } from '@prisma/client';
import { createSlug } from '../utils/slug';
import AppError from '../utils/AppError';
import { paginate } from '../utils/paginate';

const prisma = new PrismaClient();

export class BlogService {
  // Create blog post
  static async createPost(data: {
    title: string;
    content: string;
    coverImage?: string;
    authorId: string;
  }) {
    const slug = createSlug(data.title);

    const existingPost = await prisma.blog.findUnique({
      where: { slug },
    });

    if (existingPost) {
      throw new AppError('Blog post with this title already exists', 409);
    }

    return prisma.blog.create({
      data: {
        ...data,
        slug,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }

  // Get all published blog posts
  static async getPosts(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.blog.findMany({
        where: {
          publishedAt: {
            not: null,
          },
        },
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      }),
      prisma.blog.count({
        where: {
          publishedAt: {
            not: null,
          },
        },
      }),
    ]);

    return paginate(posts, total, page, limit);
  }

  // Get single post
  static async getPost(slug: string) {
    const post = await prisma.blog.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            bio: true,
          },
        },
      },
    });

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    if (!post.publishedAt) {
      throw new AppError('Blog post not published', 404);
    }

    return post;
  }

  // Update post
  static async updatePost(
    postId: string,
    userId: string,
    data: {
      title?: string;
      content?: string;
      coverImage?: string;
    }
  ) {
    const post = await prisma.blog.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    if (post.authorId !== userId) {
      throw new AppError('You can only edit your own posts', 403);
    }

    const updateData: any = data;
    if (data.title) {
      updateData.slug = createSlug(data.title);
    }

    return prisma.blog.update({
      where: { id: postId },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });
  }

  // Publish post
  static async publishPost(postId: string, userId: string) {
    const post = await prisma.blog.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    if (post.authorId !== userId) {
      throw new AppError('You can only publish your own posts', 403);
    }

    return prisma.blog.update({
      where: { id: postId },
      data: { publishedAt: new Date() },
    });
  }

  // Delete post
  static async deletePost(postId: string, userId: string) {
    const post = await prisma.blog.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new AppError('Blog post not found', 404);
    }

    if (post.authorId !== userId) {
      throw new AppError('You can only delete your own posts', 403);
    }

    return prisma.blog.delete({
      where: { id: postId },
    });
  }

  // Get author posts
  static async getAuthorPosts(authorId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.blog.findMany({
        where: { authorId },
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
        },
      }),
      prisma.blog.count({ where: { authorId } }),
    ]);

    return paginate(posts, total, page, limit);
  }
}
