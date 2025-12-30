import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Contract generation schema
export const generateContractSchema = z.object({
  tipo: z.string().min(1, 'Tipo de contrato é obrigatório'),
  contratante: z.object({
    nome: z.string().min(2, 'Nome do contratante é obrigatório'),
    documento: z.string().min(11, 'CPF/CNPJ inválido'),
    endereco: z.string().min(10, 'Endereço é obrigatório'),
  }),
  contratado: z.object({
    nome: z.string().min(2, 'Nome do contratado é obrigatório'),
    documento: z.string().min(11, 'CPF/CNPJ inválido'),
    endereco: z.string().min(10, 'Endereço é obrigatório'),
  }),
  objeto: z.string().min(10, 'Descrição do objeto é obrigatória'),
  valor: z.string().min(1, 'Valor é obrigatório'),
  formaPagamento: z.string().min(1, 'Forma de pagamento é obrigatória'),
  prazo: z.string().min(1, 'Prazo é obrigatório'),
  clausulasAdicionais: z.array(z.string()).optional(),
});

// Chat schema
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Mensagem não pode estar vazia').max(2000, 'Mensagem muito longa'),
});

// Profile update schema
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
  email: z.string().email('Email inválido').optional(),
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z
    .string()
    .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número'),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

// Helper function to validate request body
export function validateBody<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message).join(', ');
    throw new Error(errors);
  }
  return result.data;
}

// CPF/CNPJ validation helpers
export function isValidCPF(cpf: string): boolean {
  cpf = cpf.replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpf[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpf[10])) return false;

  return true;
}

export function isValidCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/\D/g, '');
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weights1[i];
  }
  let digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cnpj[12])) return false;

  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weights2[i];
  }
  digit = sum % 11;
  digit = digit < 2 ? 0 : 11 - digit;
  if (digit !== parseInt(cnpj[13])) return false;

  return true;
}

export function isValidDocument(doc: string): boolean {
  const cleaned = doc.replace(/\D/g, '');
  if (cleaned.length === 11) return isValidCPF(cleaned);
  if (cleaned.length === 14) return isValidCNPJ(cleaned);
  return false;
}
