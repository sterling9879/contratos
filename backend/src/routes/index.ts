import { Router } from 'express';
import { authController } from '../controllers/authController';
import { uploadController, upload } from '../controllers/uploadController';
import { analyzeController } from '../controllers/analyzeController';
import { contractController } from '../controllers/contractController';
import { chatController } from '../controllers/chatController';
import { generateController } from '../controllers/generateController';
import { userController } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';
import { canAnalyze, canGenerate, canChat } from '../middleware/validatePlan';
import {
  authLimiter,
  standardLimiter,
  analysisLimiter,
  chatLimiter,
  uploadLimiter,
  generateLimiter,
} from '../middleware/rateLimit';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/refresh', standardLimiter, authController.refresh);
router.post('/auth/logout', authMiddleware, authController.logout);
router.get('/auth/me', authMiddleware, authController.me);

// Contract routes
router.post(
  '/contracts/upload',
  authMiddleware,
  uploadLimiter,
  upload.single('file'),
  uploadController.uploadContract
);
router.get('/contracts', authMiddleware, standardLimiter, contractController.listContracts);
router.get('/contracts/:id', authMiddleware, standardLimiter, contractController.getContract);
router.delete('/contracts/:id', authMiddleware, standardLimiter, contractController.deleteContract);
router.get(
  '/contracts/:id/download',
  authMiddleware,
  standardLimiter,
  contractController.downloadContract
);
router.get(
  '/contracts/:id/text',
  authMiddleware,
  standardLimiter,
  contractController.getExtractedText
);

// Analysis routes
router.post(
  '/contracts/:id/analyze',
  authMiddleware,
  analysisLimiter,
  canAnalyze,
  analyzeController.analyzeContract
);
router.get(
  '/contracts/:id/analysis',
  authMiddleware,
  standardLimiter,
  analyzeController.getAnalysis
);
router.get(
  '/contracts/:id/status',
  authMiddleware,
  standardLimiter,
  analyzeController.getAnalysisStatus
);

// Chat routes
router.post(
  '/contracts/:id/chat',
  authMiddleware,
  chatLimiter,
  canChat,
  chatController.sendMessage
);
router.get(
  '/contracts/:id/chat',
  authMiddleware,
  standardLimiter,
  chatController.getChatHistory
);
router.delete(
  '/contracts/:id/chat',
  authMiddleware,
  standardLimiter,
  chatController.clearChatHistory
);

// Generate routes
router.post(
  '/generate',
  authMiddleware,
  generateLimiter,
  canGenerate,
  generateController.generateContract
);
router.get('/generate/templates', standardLimiter, generateController.getTemplates);
router.get('/generate/templates/:id', standardLimiter, generateController.getTemplate);

// User routes
router.get('/user/usage', authMiddleware, standardLimiter, userController.getUsage);
router.get('/user/plan', authMiddleware, standardLimiter, userController.getPlan);
router.put('/user/profile', authMiddleware, standardLimiter, userController.updateProfile);
router.put('/user/password', authMiddleware, standardLimiter, userController.changePassword);
router.delete('/user/account', authMiddleware, standardLimiter, userController.deleteAccount);

export default router;
