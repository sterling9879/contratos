import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import { contractService } from '../services/contractService';
import { logger } from '../utils/logger';

export const analyzeController = {
  async analyzeContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      const { id } = req.params;

      // Check if contract exists and belongs to user
      const contract = await contractService.getContract(id, req.user.id);
      if (!contract) {
        res.status(404).json({
          success: false,
          error: 'Contrato não encontrado',
        });
        return;
      }

      // Check if already analyzed
      if (contract.status === 'COMPLETED' && contract.analysis) {
        res.json({
          success: true,
          data: contract.analysis,
          cached: true,
        });
        return;
      }

      // Check if currently processing
      if (contract.status === 'PROCESSING') {
        res.status(409).json({
          success: false,
          error: 'Análise em andamento. Aguarde.',
          code: 'ANALYSIS_IN_PROGRESS',
        });
        return;
      }

      // Perform analysis
      logger.info({ contractId: id, userId: req.user.id }, 'Starting analysis');

      const analysis = await contractService.analyzeContract(id, req.user.id);

      res.json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      logger.error({ error }, 'Analysis error');
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao analisar contrato',
      });
    }
  },

  async getAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      if (!contract.analysis) {
        res.status(404).json({
          success: false,
          error: 'Contrato ainda não foi analisado',
          code: 'NOT_ANALYZED',
        });
        return;
      }

      res.json({
        success: true,
        data: {
          analysis: contract.analysis,
          status: contract.status,
          analyzedAt: contract.analyzedAt,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Get analysis error');
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar análise',
      });
    }
  },

  async getAnalysisStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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
          status: contract.status,
          hasAnalysis: !!contract.analysis,
          analyzedAt: contract.analyzedAt,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Get status error');
      res.status(500).json({
        success: false,
        error: 'Erro ao buscar status',
      });
    }
  },
};
