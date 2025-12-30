import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateTokens, verifyRefreshToken } from '../middleware/auth';
import { validateBody, registerSchema, loginSchema } from '../utils/validators';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types';

const prisma = new PrismaClient();

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name } = validateBody(registerSchema, req.body);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: 'Email já cadastrado',
        });
        return;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true,
        },
      });

      // Generate tokens
      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        plan: user.plan,
      });

      logger.info({ userId: user.id, email }, 'User registered');

      res.status(201).json({
        success: true,
        data: {
          user,
          ...tokens,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Registration error');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar conta',
      });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = validateBody(loginSchema, req.body);

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          password: true,
          name: true,
          plan: true,
        },
      });

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Email ou senha incorretos',
        });
        return;
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: 'Email ou senha incorretos',
        });
        return;
      }

      // Generate tokens
      const tokens = generateTokens({
        id: user.id,
        email: user.email,
        plan: user.plan,
      });

      logger.info({ userId: user.id }, 'User logged in');

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
          },
          ...tokens,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Login error');
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer login',
      });
    }
  },

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: 'Refresh token é obrigatório',
        });
        return;
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Get user
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

      // Generate new tokens
      const tokens = generateTokens(user);

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      logger.error({ error }, 'Token refresh error');
      res.status(401).json({
        success: false,
        error: 'Token inválido ou expirado',
      });
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    // In a more complex implementation, we would invalidate the refresh token
    // For now, just return success (client should discard tokens)
    res.json({
      success: true,
      message: 'Logout realizado com sucesso',
    });
  },

  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Não autorizado',
        });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'Usuário não encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      logger.error({ error }, 'Get user error');
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar dados do usuário',
      });
    }
  },
};
