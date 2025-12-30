// User types
export interface User {
  id: string;
  email: string;
  name?: string;
  plan: Plan;
  createdAt: string;
  updatedAt?: string;
}

export type Plan = 'FREE' | 'PRO' | 'BUSINESS';

// Contract types
export interface Contract {
  id: string;
  fileName: string;
  fileSize: number;
  pageCount: number | null;
  status: ContractStatus;
  hasAnalysis: boolean;
  createdAt: string;
  analyzedAt?: string;
  analysis?: ContractAnalysis;
  chatMessages?: ChatMessage[];
}

export type ContractStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';

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

// Chat types
export interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
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

// Usage types
export interface UsageStats {
  analyzesThisMonth: number;
  generatesThisMonth: number;
  totalContracts: number;
  limits: PlanLimits;
  plan: Plan;
}

export interface PlanLimits {
  analyzesPerMonth: number;
  maxPageCount: number;
  chatMessagesPerContract: number;
  generatePerMonth: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
  upgrade?: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
