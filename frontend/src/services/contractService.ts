import api, { getErrorMessage } from './api';
import {
  ApiResponse,
  PaginatedResponse,
  Contract,
  ContractAnalysis,
  ChatMessage,
  ContractGenerationData,
  ContractTemplate,
  UsageStats,
} from '@/types';

export const contractService = {
  async uploadContract(file: File): Promise<Contract> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post<ApiResponse<Contract>>('/contracts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao fazer upload');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getContracts(page = 1, limit = 10): Promise<PaginatedResponse<Contract>> {
    try {
      const response = await api.get<PaginatedResponse<Contract>>('/contracts', {
        params: { page, limit },
      });

      if (!response.data.success) {
        throw new Error('Erro ao listar contratos');
      }

      return response.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getContract(id: string): Promise<Contract> {
    try {
      const response = await api.get<ApiResponse<Contract>>(`/contracts/${id}`);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao buscar contrato');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async deleteContract(id: string): Promise<void> {
    try {
      const response = await api.delete<ApiResponse>(`/contracts/${id}`);

      if (!response.data.success) {
        throw new Error(response.data.error || 'Erro ao excluir contrato');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async analyzeContract(id: string): Promise<ContractAnalysis> {
    try {
      const response = await api.post<ApiResponse<ContractAnalysis>>(
        `/contracts/${id}/analyze`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao analisar contrato');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getAnalysis(id: string): Promise<{ analysis: ContractAnalysis; analyzedAt: string }> {
    try {
      const response = await api.get<ApiResponse<{ analysis: ContractAnalysis; analyzedAt: string }>>(
        `/contracts/${id}/analysis`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao buscar análise');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async sendChatMessage(contractId: string, message: string): Promise<ChatMessage> {
    try {
      const response = await api.post<ApiResponse<ChatMessage>>(
        `/contracts/${contractId}/chat`,
        { message }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao enviar mensagem');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getChatHistory(contractId: string): Promise<ChatMessage[]> {
    try {
      const response = await api.get<ApiResponse<ChatMessage[]>>(
        `/contracts/${contractId}/chat`
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao buscar histórico');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async generateContract(data: ContractGenerationData): Promise<{ content: string }> {
    try {
      const response = await api.post<ApiResponse<{ content: string }>>('/generate', data);

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao gerar contrato');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getTemplates(): Promise<ContractTemplate[]> {
    try {
      const response = await api.get<ApiResponse<ContractTemplate[]>>('/generate/templates');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao buscar templates');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async getUsage(): Promise<UsageStats> {
    try {
      const response = await api.get<ApiResponse<UsageStats>>('/user/usage');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao buscar uso');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
