import { Response } from 'express';
import multer from 'multer';
import path from 'path';
import { AuthenticatedRequest, PLAN_LIMITS } from '../types';
import { contractService } from '../services/contractService';
import { pdfService } from '../services/pdfService';
import { logger } from '../utils/logger';

// Multer configuration for memory storage
const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (['.pdf', '.docx'].includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Formato não suportado. Use PDF ou DOCX.'));
  }
};

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '20971520'); // 20MB default

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

export const uploadController = {
  async uploadContract(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Não autorizado' });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: 'Nenhum arquivo enviado',
        });
        return;
      }

      // Validate file format
      if (!pdfService.isValidFormat(req.file.originalname)) {
        res.status(400).json({
          success: false,
          error: 'Formato não suportado. Use PDF ou DOCX.',
        });
        return;
      }

      // Create contract record
      const contract = await contractService.createContract(req.user.id, req.file);

      // Check page count against plan limits
      const limits = PLAN_LIMITS[req.user.plan];
      if (
        limits.maxPageCount > 0 &&
        contract.pageCount &&
        contract.pageCount > limits.maxPageCount
      ) {
        // Delete the contract since it exceeds limits
        await contractService.deleteContract(contract.id, req.user.id);

        res.status(400).json({
          success: false,
          error: `Seu plano permite contratos de até ${limits.maxPageCount} páginas. Este contrato tem ${contract.pageCount} páginas.`,
          code: 'PAGE_LIMIT_EXCEEDED',
          upgrade: true,
        });
        return;
      }

      logger.info(
        { contractId: contract.id, userId: req.user.id },
        'Contract uploaded successfully'
      );

      res.status(201).json({
        success: true,
        data: {
          id: contract.id,
          fileName: contract.originalName,
          fileSize: contract.fileSize,
          pageCount: contract.pageCount,
          status: contract.status,
          createdAt: contract.createdAt,
        },
      });
    } catch (error) {
      logger.error({ error }, 'Upload error');

      if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
          res.status(400).json({
            success: false,
            error: 'Arquivo muito grande. Máximo 20MB.',
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer upload',
      });
    }
  },

  // Handle multer errors
  handleMulterError(error: Error, req: AuthenticatedRequest, res: Response): void {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: 'Arquivo muito grande. Máximo 20MB.',
        });
        return;
      }
      res.status(400).json({
        success: false,
        error: `Erro no upload: ${error.message}`,
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: error.message || 'Erro ao processar arquivo',
    });
  },
};
