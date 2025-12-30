import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, UserPayload } from '../types';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateTokens = (user: UserPayload): { accessToken: string; refreshToken: string } => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, plan: user.plan },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    { id: user.id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): UserPayload => {
  return jwt.verify(token, JWT_SECRET) as UserPayload;
};

export const verifyRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { id: string };
};

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Token de acesso não fornecido',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = verifyAccessToken(token);

      // Verify user still exists and get fresh data
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, email: true, plan: true },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Usuário não encontrado',
        });
        return;
      }

      req.user = user;
      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          success: false,
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED',
        });
        return;
      }

      logger.warn({ error }, 'Invalid token');
      res.status(401).json({
        success: false,
        error: 'Token inválido',
      });
    }
  } catch (error) {
    logger.error({ error }, 'Auth middleware error');
    res.status(500).json({
      success: false,
      error: 'Erro interno de autenticação',
    });
  }
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, plan: true },
    });

    if (user) {
      req.user = user;
    }
  } catch {
    // Token invalid, continue without user
  }

  next();
};
