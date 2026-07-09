import { PrismaClient, User, Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword } from '../utils/password';
import AppError from '../utils/AppError';

const prisma = new PrismaClient();

export class AuthService {
  // Register new user
  static async register(data: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) {
    if (data.password !== data.confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: Role.MEMBER,
      },
    });

    const tokens = this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  // Login user
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 403);
    }

    const tokens = this.generateTokens(user);

    // Update refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    return { user: this.sanitizeUser(user), ...tokens };
  }

  // Refresh token
  static async refreshToken(token: string) {
    if (!token) {
      throw new AppError('Refresh token required', 400);
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
        id: string;
        email: string;
      };

      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });

      if (!user || user.refreshToken !== token) {
        throw new AppError('Invalid refresh token', 401);
      }

      const newTokens = this.generateTokens(user);

      await prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: newTokens.refreshToken },
      });

      return { user: this.sanitizeUser(user), ...newTokens };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  // Generate JWT tokens
  private static generateTokens(user: User) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET!,
      { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  // Sanitize user data (remove password)
  private static sanitizeUser(user: User) {
    const { password, refreshToken, ...sanitized } = user;
    return sanitized;
  }

  // Logout
  static async logout(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }
}
