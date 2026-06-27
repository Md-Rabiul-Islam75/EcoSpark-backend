import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';

export const notFound = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, 'Route not found'));
};

export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({
      success: false,
      message: 'Database request failed',
      error: err.code,
    });
  }

  const message = err instanceof Error ? err.message : 'Something went wrong';
  return res.status(500).json({
    success: false,
    message,
  });
};
