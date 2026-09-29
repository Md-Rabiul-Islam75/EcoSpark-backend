import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        email: string;
      };
      rawBody?: Buffer;
    }
  }
}

declare module 'http' {
  interface IncomingMessage {
    rawBody?: Buffer;
  }
}

export {};
