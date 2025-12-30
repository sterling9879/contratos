import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types';

// Key generator that uses user ID if authenticated, otherwise IP
const keyGenerator = (req: Request): string => {
  const authReq = req as AuthenticatedRequest;
  if (authReq.user?.id) {
    return `user:${authReq.user.id}`;
  }
  return `ip:${req.ip}`;
};

// Standard rate limiter for general API endpoints
export const standardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    error: 'Muitas requisições. Por favor, aguarde alguns minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: {
    success: false,
    error: 'Muitas tentativas de login. Por favor, aguarde 1 hora.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
});

// Analysis rate limiter (stricter due to API costs)
export const analysisLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 analyses per minute
  message: {
    success: false,
    error: 'Limite de análises por minuto atingido. Aguarde um momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Chat rate limiter
export const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: {
    success: false,
    error: 'Limite de mensagens por minuto atingido. Aguarde um momento.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    success: false,
    error: 'Limite de uploads por hora atingido. Aguarde um pouco.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Generation rate limiter
export const generateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 generations per hour
  message: {
    success: false,
    error: 'Limite de geração de contratos por hora atingido.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
});

// Dynamic rate limiter based on user plan
export const createPlanBasedLimiter = (
  windowMs: number,
  maxByPlan: { FREE: number; PRO: number; BUSINESS: number }
) => {
  return rateLimit({
    windowMs,
    max: (req: Request) => {
      const authReq = req as AuthenticatedRequest;
      const plan = authReq.user?.plan || 'FREE';
      return maxByPlan[plan];
    },
    message: {
      success: false,
      error: 'Limite de requisições do seu plano atingido.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
  });
};
