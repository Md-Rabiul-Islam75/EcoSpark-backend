import type { Response } from 'express';

export const sendResponse = <T>(res: Response, statusCode: number, data: T, message = 'Success') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};
