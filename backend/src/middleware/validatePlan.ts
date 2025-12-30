import { Response, NextFunction } from 'express';
import { PrismaClient, ActionType } from '@prisma/client';
import { AuthenticatedRequest, PLAN_LIMITS } from '../types';

const prisma = new PrismaClient();

// Middleware to check if user can perform analysis
export const canAnalyze = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Não autorizado' });
      return;
    }

    const limits = PLAN_LIMITS[req.user.plan];

    // Unlimited for BUSINESS
    if (limits.analyzesPerMonth === -1) {
      next();
      return;
    }

    // Count analyses this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await prisma.usageLog.count({
      where: {
        userId: req.user.id,
        action: ActionType.ANALYZE,
        createdAt: { gte: startOfMonth },
      },
    });

    if (count >= limits.analyzesPerMonth) {
      res.status(403).json({
        success: false,
        error: `Limite de ${limits.analyzesPerMonth} análises por mês atingido`,
        code: 'LIMIT_REACHED',
        upgrade: true,
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao verificar limites' });
  }
};

// Middleware to check if user can generate contracts
export const canGenerate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Não autorizado' });
      return;
    }

    const limits = PLAN_LIMITS[req.user.plan];

    // Unlimited for BUSINESS
    if (limits.generatePerMonth === -1) {
      next();
      return;
    }

    // Count generations this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const count = await prisma.usageLog.count({
      where: {
        userId: req.user.id,
        action: ActionType.GENERATE,
        createdAt: { gte: startOfMonth },
      },
    });

    if (count >= limits.generatePerMonth) {
      res.status(403).json({
        success: false,
        error: `Limite de ${limits.generatePerMonth} contratos gerados por mês atingido`,
        code: 'LIMIT_REACHED',
        upgrade: true,
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao verificar limites' });
  }
};

// Middleware to check chat message limits
export const canChat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Não autorizado' });
      return;
    }

    const contractId = req.params.id;
    const limits = PLAN_LIMITS[req.user.plan];

    // Unlimited for PRO and BUSINESS
    if (limits.chatMessagesPerContract === -1) {
      next();
      return;
    }

    // Count messages for this contract
    const count = await prisma.chatMessage.count({
      where: {
        contractId,
        contract: { userId: req.user.id },
        role: 'USER',
      },
    });

    if (count >= limits.chatMessagesPerContract) {
      res.status(403).json({
        success: false,
        error: `Limite de ${limits.chatMessagesPerContract} mensagens por contrato atingido`,
        code: 'LIMIT_REACHED',
        upgrade: true,
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ success: false, error: 'Erro ao verificar limites' });
  }
};

// Middleware to check page count limits for upload
export const validatePageCount = (maxPages: number) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    // Page count is checked after upload in the controller
    // This is a placeholder for pre-upload validation if needed
    next();
  };
};

// Require minimum plan
export const requirePlan = (minPlan: 'FREE' | 'PRO' | 'BUSINESS') => {
  const planOrder = { FREE: 0, PRO: 1, BUSINESS: 2 };

  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Não autorizado' });
      return;
    }

    if (planOrder[req.user.plan] < planOrder[minPlan]) {
      res.status(403).json({
        success: false,
        error: `Este recurso requer o plano ${minPlan} ou superior`,
        code: 'PLAN_REQUIRED',
        requiredPlan: minPlan,
      });
      return;
    }

    next();
  };
};
