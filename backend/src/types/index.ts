import { Request } from 'express';
import { Plan, ContractStatus, MessageRole, ActionType } from '@prisma/client';

// Re-export Prisma enums
export { Plan, ContractStatus, MessageRole, ActionType };

// User types
export interface UserPayload {
  id: string;
  email: string;
  plan: Plan;
}

export interface AuthenticatedRequest extends Request {
  user?: UserPayload;
}

// Contract types
export interface ContractAnalysis {
  partes: {
    contratante: string;
    contratado: string;
  };
  tipo_contrato: string;
  valor_total: string | null;
  prazo: string;
  data_inicio: string | null;
  clausulas_risco: ClausulaRisco[];
  obrigacoes_contratante: string[];
  obrigacoes_contratado: string[];
  penalidades: string[];
  score_risco: number;
  resumo_executivo: string;
}

export interface ClausulaRisco {
  numero: string;
  texto_resumido: string;
  motivo: string;
  severidade: number;
  recomendacao: string;
}

// Contract generation types
export interface ContractGenerationData {
  tipo: string;
  contratante: {
    nome: string;
    documento: string;
    endereco: string;
  };
  contratado: {
    nome: string;
    documento: string;
    endereco: string;
  };
  objeto: string;
  valor: string;
  formaPagamento: string;
  prazo: string;
  clausulasAdicionais?: string[];
}

// Chat types
export interface ChatMessage {
  role: MessageRole;
  content: string;
}

// Plan limits
export interface PlanLimits {
  analyzesPerMonth: number;
  maxPageCount: number;
  chatMessagesPerContract: number;
  generatePerMonth: number;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    analyzesPerMonth: 3,
    maxPageCount: 10,
    chatMessagesPerContract: 10,
    generatePerMonth: 1,
  },
  PRO: {
    analyzesPerMonth: 50,
    maxPageCount: 50,
    chatMessagesPerContract: 100,
    generatePerMonth: 20,
  },
  BUSINESS: {
    analyzesPerMonth: -1, // unlimited
    maxPageCount: 200,
    chatMessagesPerContract: -1,
    generatePerMonth: -1,
  },
};

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Usage types
export interface UsageStats {
  analyzesThisMonth: number;
  generatesThisMonth: number;
  totalContracts: number;
  limits: PlanLimits;
}

// Template types
export interface ContractTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: TemplateField[];
}

export interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select';
  required: boolean;
  options?: string[];
}
