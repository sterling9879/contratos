import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
});

// API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'Contrato.AI API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/health',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint não encontrado',
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error({ error: err.message, stack: err.stack }, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor'
      : err.message,
  });
});

// Initialize and start server
async function startServer(): Promise<void> {
  try {
    // Initialize storage
    await storageService.initialize();
    logger.info('Storage initialized');

    // Check Gemini API configuration
    if (!geminiService.isConfigured()) {
      logger.warn('GEMINI_API_KEY not configured - AI features will not work');
    } else {
      logger.info('Gemini API configured');
    }

    // Start listening
    app.listen(PORT, () => {
      logger.info({ port: PORT }, `Server running on port ${PORT}`);
      console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🔒 Contrato.AI Backend                              ║
║                                                       ║
║   Server running on http://localhost:${PORT}            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                        ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
  process.exit(1);
});

startServer();

export default app;
