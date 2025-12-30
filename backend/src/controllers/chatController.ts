import { Response } from 'express';
import { PrismaClient, ActionType, MessageRole } from '@prisma/client';
import { AuthenticatedRequest, ContractAnalysis } from '../types';
import { geminiService } from '../services/geminiService';
import { contractService } from '../services/contractService';
import { validateBody, chatMessageSchema } from '../utils/validators';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export const chatController = {
  async sendMessage(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const { id: contractId } = req.params;
      const { message } = validateBody(chatMessageSchema, req.body);

      // Get contract
      const contract = await contractService.getContract(contractId, req.user.id);
      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrato não encontrado',
        });
        return;
      }

      // Check if contract has been analyzed
      if (!contract.extractedText) {
        res.status(400).json({
          success: false,
          error: 'O contrato precisa ser analisado antes de usar o chat',
          code: 'NOT_ANALYZED',
        });
        return;
      }

      // Get chat history
      const chatHistory = await prisma.chatMessage.findMany({
        where: { contractId },
        orderBy: { createdAt: 'asc' },
        select: { role: true, content: true },
      });

      // Save user message
      await prisma.chatMessage.create({
        data: {
          contractId,
          role: MessageRole.USER,
          content: message,
        },
      });

      // Generate response
      const response = await geminiService.chat(
        contract.extractedText,
        contract.analysis as ContractAnalysis | null,
        chatHistory,
        message
      );

      // Save assistant message
      const assistantMessage = await prisma.chatMessage.create({
        data: {
          contractId,
          role: MessageRole.ASSISTANT,
          content: response,
        },
      });

      // Log usage
      await contractService.logUsage(req.user.id, ActionType.CHAT, {
        contractId,
        tokensUsed: geminiService.estimateTokens(message + response),
      });

      logger.info({ contractId, userId: req.user.id }, 'Chat message processed');

      res.json({
        success: true,
        data: {
          id: assistantMessage.id,
          role: assistantMessage.role,
          content: assistantMessage.content,
          createdAt: assistantMessage.createdAt,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Chat error');
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar mensagem',
      });
    }
  },

  async getChatHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const { id: contractId } = req.params;

      // Verify contract belongs to user
      const contract = await contractService.getContract(contractId, req.user.id);
      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrato não encontrado',
        });
        return;
      }

      // Get chat history
      const messages = await prisma.chatMessage.findMany({
        where: { contractId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          content: true,
          createdAt: true,
        },
      });

      res.json({
        success: true,
        data: messages,
      });
    } catch (error) {
      logger.error({ error }, 'Get chat history error');
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar histórico',
      });
    }
  },

  async clearChatHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const { id: contractId } = req.params;

      // Verify contract belongs to user
      const contract = await contractService.getContract(contractId, req.user.id);
      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrato não encontrado',
        });
        return;
      }

      // Delete all messages
      await prisma.chatMessage.deleteMany({
        where: { contractId },
      });

      logger.info({ contractId, userId: req.user.id }, 'Chat history cleared');

      res.json({
        success: true,
        message: 'Histórico limpo com sucesso',
      });
    } catch (error) {
      logger.error({ error }, 'Clear chat history error');
      res.status(500).json({
        success: false,
        error: 'Erro ao limpar histórico',
      });
    }
  },
};
