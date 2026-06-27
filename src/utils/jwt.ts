import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export type TokenPayload = {
  userId: string;
  role: 'MEMBER' | 'ADMIN';
};

export const signAccessToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpiresIn });

export const signRefreshToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.jwtAccessSecret) as TokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
