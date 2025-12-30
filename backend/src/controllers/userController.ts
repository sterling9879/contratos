import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest, PLAN_LIMITS } from '../types';
import { contractService } from '../services/contractService';
import { validateBody, updateProfileSchema, changePasswordSchema } from '../utils/validators';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const userController = {
  async getUsage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const stats = await contractService.getUsageStats(req.user.id);
      const limits = PLAN_LIMITS[req.user.plan];

      res.json({
        success: true,
        data: {
          ...stats,
          limits,
          plan: req.user.plan,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Get usage error');
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar uso',
      });
    }
  },

  async getPlan(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { plan: true, stripeCustomerId: true, createdAt: true },
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'Usuário não encontrado' });
        return;
      }

      const limits = PLAN_LIMITS[user.plan];

      res.json({
        success: true,
        data: {
          plan: user.plan,
          limits,
          features: getPlanFeatures(user.plan),
          memberSince: user.createdAt,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Get plan error');
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar plano',
      });
    }
  },

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const data = validateBody(updateProfileSchema, req.body);

      // Check if email is already in use
      if (data.email && data.email !== req.user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: data.email },
        });

        if (existingUser) {
          res.status(400).json({
            success: false,
            error: 'Email já está em uso',
          });
          return;
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email && { email: data.email }),
        },
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          updatedAt: true,
        },
      });

      logger.info({ userId: req.user.id }, 'Profile updated');

      res.json({
        success: true,
        data: updatedUser,
      });
    } catch (error) {
      logger.error({ error }, 'Update profile error');
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar perfil',
      });
    }
  },

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const { currentPassword, newPassword } = validateBody(changePasswordSchema, req.body);

      // Get user with password
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { password: true },
      });

      if (!user) {
        res.status(404).json({ success: false, error: 'Usuário não encontrado' });
        return;
      }

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        res.status(400).json({
          success: false,
          error: 'Senha atual incorreta',
        });
        return;
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: req.user.id },
        data: { password: hashedPassword },
      });

      logger.info({ userId: req.user.id }, 'Password changed');

      res.json({
        success: true,
        message: 'Senha alterada com sucesso',
      });
    } catch (error) {
      logger.error({ error }, 'Change password error');
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao alterar senha',
      });
    }
  },

  async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      // Delete user (will cascade delete contracts and messages)
      await prisma.user.delete({
        where: { id: req.user.id },
      });

      logger.info({ userId: req.user.id }, 'Account deleted');

      res.json({
        success: true,
        message: 'Conta excluída com sucesso',
      });
    } catch (error) {
      logger.error({ error }, 'Delete account error');
      res.status(500).json({
        success: false,
        error: 'Erro ao excluir conta',
      });
    }
  },
};

function getPlanFeatures(plan: string): string[] {
  const features: Record<string, string[]> = {
    FREE: [
      '3 análises por mês',
      'Contratos até 10 páginas',
      '10 mensagens de chat por contrato',
      '1 geração de contrato por mês',
    ],
    PRO: [
      '50 análises por mês',
      'Contratos até 50 páginas',
      '100 mensagens de chat por contrato',
      '20 gerações de contrato por mês',
      'Suporte prioritário',
    ],
    BUSINESS: [
      'Análises ilimitadas',
      'Contratos até 200 páginas',
      'Chat ilimitado',
      'Gerações ilimitadas',
      'Suporte prioritário 24/7',
      'API access',
    ],
  };

  return features[plan] || features.FREE;
}
