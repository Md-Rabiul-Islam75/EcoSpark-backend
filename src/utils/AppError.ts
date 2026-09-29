export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(statusCode: number, message: string);
  constructor(message: string, statusCode: number);
  constructor(first: number | string, second: string | number) {
    const statusCode = typeof first === 'number' ? first : second as number;
    const message = typeof first === 'string' ? first : second as string;
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
