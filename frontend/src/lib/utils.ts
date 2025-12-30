import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRiskColor(score: number): string {
  if (score >= 80) return 'text-green-500';
  if (score >= 60) return 'text-yellow-500';
  if (score >= 40) return 'text-orange-500';
  return 'text-red-500';
}

export function getRiskLabel(score: number): string {
  if (score >= 80) return 'Baixo Risco';
  if (score >= 60) return 'Risco Moderado';
  if (score >= 40) return 'Risco Alto';
  return 'Risco Muito Alto';
}

export function getRiskBgColor(score: number): string {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getSeverityColor(severity: number): string {
  if (severity <= 2) return 'text-yellow-500';
  if (severity <= 3) return 'text-orange-500';
  return 'text-red-500';
}

export function getStatusColor(status: string): 'default' | 'secondary' | 'success' | 'warning' | 'destructive' {
  switch (status) {
    case 'COMPLETED':
      return 'success';
    case 'PROCESSING':
      return 'warning';
    case 'ERROR':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'COMPLETED':
      return 'Analisado';
    case 'PROCESSING':
      return 'Processando';
    case 'ERROR':
      return 'Erro';
    case 'PENDING':
      return 'Pendente';
    default:
      return status;
  }
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
