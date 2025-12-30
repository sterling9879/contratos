import { Response } from 'express';
import { PrismaClient, ActionType } from '@prisma/client';
import { AuthenticatedRequest, PLAN_LIMITS } from '../types';
import { geminiService } from '../services/geminiService';
import { contractService } from '../services/contractService';
import { CONTRACT_TEMPLATES } from '../prompts/generate';
import { validateBody, generateContractSchema } from '../utils/validators';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const generateController = {
  async generateContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const data = validateBody(generateContractSchema, req.body);

      // Check plan limits
      const limits = PLAN_LIMITS[req.user.plan];
      if (limits.generatePerMonth !== -1) {
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
      }

      logger.info({ userId: req.user.id, tipo: data.tipo }, 'Generating contract');

      // Generate contract
      const contractText = await geminiService.generateContract(data);

      // Log usage
      await contractService.logUsage(req.user.id, ActionType.GENERATE, {
        tipo: data.tipo,
        tokensUsed: geminiService.estimateTokens(contractText),
      });

      res.json({
        success: true,
        data: {
          content: contractText,
          type: data.tipo,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error({ error }, 'Generate contract error');
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao gerar contrato',
      });
    }
  },

  async getTemplates(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: CONTRACT_TEMPLATES.map((t) => ({
          id: t.id,
          name: t.name,
          description: t.description,
          category: t.category,
          fields: t.fields,
        })),
      });
    } catch (error) {
      logger.error({ error }, 'Get templates error');
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar templates',
      });
    }
  },

  async getTemplate(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const template = CONTRACT_TEMPLATES.find((t) => t.id === id);

      if (!template) {
        res.status(404).json({
          success: false,
          error: 'Template não encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: template,
      });
    } catch (error) {
      logger.error({ error }, 'Get template error');
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar template',
      });
    }
  },
};
