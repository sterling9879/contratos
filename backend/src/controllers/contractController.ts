import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { contractService } from '../services/contractService';
import { storageService } from '../services/storageService';
import { validateBody, paginationSchema } from '../utils/validators';
import { logger } from '../utils/logger';

export const contractController = {
  async listContracts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const { page, limit } = validateBody(paginationSchema, req.query);

      const { contracts, total } = await contractService.getUserContracts(
        req.user.id,
        page,
        limit
      );

      res.json({
        success: true,
        data: contracts.map((c) => ({
          id: c.id,
          fileName: c.originalName,
          fileSize: c.fileSize,
          pageCount: c.pageCount,
          status: c.status,
          hasAnalysis: !!c.analysis,
          createdAt: c.createdAt,
          analyzedAt: c.analyzedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error({ error }, 'List contracts error');
      res.status(500).json({
        success: false,
        error: 'Erro ao listar contratos',
      });
    }
  },

  async getContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const { id } = req.params;

      const contract = await contractService.getContract(id, req.user.id);
      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrato não encontrado',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          id: contract.id,
          fileName: contract.originalName,
          fileSize: contract.fileSize,
          pageCount: contract.pageCount,
          status: contract.status,
          analysis: contract.analysis,
          createdAt: contract.createdAt,
          analyzedAt: contract.analyzedAt,
          chatMessages: (contract as any).chatMessages?.map((m: any) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
          })),
        },
      });
    } catch (error) {
      logger.error({ error }, 'Get contract error');
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar contrato',
      });
    }
  },

  async deleteContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const { id } = req.params;

      await contractService.deleteContract(id, req.user.id);

      logger.info({ contractId: id, userId: req.user.id }, 'Contract deleted');

      res.json({
        success: true,
        message: 'Contrato excluído com sucesso',
      });
    } catch (error) {
      logger.error({ error }, 'Delete contract error');
      res.status(error instanceof Error && error.message === 'Contrato não encontrado' ? 404 : 500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao excluir contrato',
      });
    }
  },

  async downloadContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const { id } = req.params;

      const contract = await contractService.getContract(id, req.user.id);
      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrato não encontrado',
        });
        return;
      }

      const fileBuffer = await storageService.getFile(contract.storagePath);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(contract.originalName)}"`
      );
      res.send(fileBuffer);
    } catch (error) {
      logger.error({ error }, 'Download contract error');
      res.status(500).json({
        success: false,
        error: 'Erro ao baixar contrato',
      });
    }
  },

  async getExtractedText(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const { id } = req.params;

      const contract = await contractService.getContract(id, req.user.id);
      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrato não encontrado',
        });
        return;
      }

      if (!contract.extractedText) {
        res.status(404).json({
          success: false,
          error: 'Texto ainda não foi extraído. Analise o contrato primeiro.',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          text: contract.extractedText,
          length: contract.extractedText.length,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Get extracted text error');
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar texto extraído',
      });
    }
  },
};
