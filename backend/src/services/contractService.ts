import { PrismaClient, Contract, ContractStatus, ActionType } from '@prisma/client';
import { pdfService } from './pdfService';
import { geminiService } from './geminiService';
import { storageService } from './storageService';
import { ContractAnalysis, PLAN_LIMITS, Plan } from '../types';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const contractService = {
  async createContract(
    userId: string,
    file: Express.Multer.File
  ): Promise<Contract> {
    // Save file to storage
    const { fileName, storagePath, fileSize } = await storageService.saveFile(
      file.buffer,
      file.originalname,
      userId
    );

    // Get page count
    const pageCount = await pdfService.getPageCount(storagePath);

    // Create contract record
    const contract = await prisma.contract.create({
      data: {
        userId,
        fileName,
        originalName: file.originalname,
        storagePath,
        fileSize,
        pageCount,
        status: ContractStatus.PENDING,
      },
    });

    logger.info({ contractId: contract.id, userId }, 'Contract created');

    return contract;
  },

  async getContract(contractId: string, userId: string): Promise<Contract | null> {
    return prisma.contract.findFirst({
      where: {
        id: contractId,
        userId,
      },
      include: {
        chatMessages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  },

  async getUserContracts(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ contracts: Contract[]; total: number }> {
    const skip = (page - 1) * limit;

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.contract.count({ where: { userId } }),
    ]);

    return { contracts, total };
  },

  async deleteContract(contractId: string, userId: string): Promise<void> {
    const contract = await this.getContract(contractId, userId);

    if (!contract) {
      throw new Error('Contrato não encontrado');
    }

    // Delete file from storage
    await storageService.deleteFile(contract.storagePath);

    // Delete from database (will cascade delete chat messages)
    await prisma.contract.delete({
      where: { id: contractId },
    });

    logger.info({ contractId, userId }, 'Contract deleted');
  },

  async analyzeContract(contractId: string, userId: string): Promise<ContractAnalysis> {
    const contract = await this.getContract(contractId, userId);

    if (!contract) {
      throw new Error('Contrato não encontrado');
    }

    // Check plan limits
    await this.checkAnalysisLimits(userId, contract.pageCount || 1);

    // Update status to processing
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: ContractStatus.PROCESSING },
    });

    try {
      // Extract text if not already done
      let extractedText = contract.extractedText;
      if (!extractedText) {
        extractedText = await pdfService.extractText(contract.storagePath);
        await prisma.contract.update({
          where: { id: contractId },
          data: { extractedText },
        });
      }

      // Analyze with Gemini
      const analysis = await geminiService.analyzeContract(extractedText);

      // Update contract with analysis
      await prisma.contract.update({
        where: { id: contractId },
        data: {
          analysis: analysis as object,
          status: ContractStatus.COMPLETED,
          analyzedAt: new Date(),
        },
      });

      // Log usage
      await this.logUsage(userId, ActionType.ANALYZE, {
        contractId,
        tokensUsed: geminiService.estimateTokens(extractedText),
      });

      logger.info({ contractId, userId }, 'Contract analyzed successfully');

      return analysis;
    } catch (error) {
      // Update status to error
      await prisma.contract.update({
        where: { id: contractId },
        data: { status: ContractStatus.ERROR },
      });

      logger.error({ error, contractId }, 'Contract analysis failed');
      throw error;
    }
  },

  async checkAnalysisLimits(userId: string, pageCount: number): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Usuário não encontrado');

    const limits = PLAN_LIMITS[user.plan];

    // Check page limit
    if (limits.maxPageCount > 0 && pageCount > limits.maxPageCount) {
      throw new Error(
        `Seu plano permite contratos de até ${limits.maxPageCount} páginas. Este contrato tem ${pageCount} páginas.`
      );
    }

    // Check monthly analysis limit
    if (limits.analyzesPerMonth > 0) {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const analysesThisMonth = await prisma.usageLog.count({
        where: {
          userId,
          action: ActionType.ANALYZE,
          createdAt: { gte: startOfMonth },
        },
      });

      if (analysesThisMonth >= limits.analyzesPerMonth) {
        throw new Error(
          `Você atingiu o limite de ${limits.analyzesPerMonth} análises por mês do seu plano.`
        );
      }
    }
  },

  async logUsage(
    userId: string,
    action: ActionType,
    metadata: { contractId?: string; tokensUsed?: number }
  ): Promise<void> {
    await prisma.usageLog.create({
      data: {
        userId,
        action,
        tokensUsed: metadata.tokensUsed,
        metadata: metadata as object,
      },
    });
  },

  async getUsageStats(userId: string): Promise<{
    analyzesThisMonth: number;
    generatesThisMonth: number;
    totalContracts: number;
  }> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [analyzesThisMonth, generatesThisMonth, totalContracts] = await Promise.all([
      prisma.usageLog.count({
        where: {
          userId,
          action: ActionType.ANALYZE,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.usageLog.count({
        where: {
          userId,
          action: ActionType.GENERATE,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.contract.count({ where: { userId } }),
    ]);

    return {
      analyzesThisMonth,
      generatesThisMonth,
      totalContracts,
    };
  },
};
