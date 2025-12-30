import api, { getErrorMessage } from './api';
import {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  User,
} from '@/types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        credentials
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao fazer login');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<AuthResponse>>(
        '/auth/register',
        credentials
      );

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao criar conta');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignore logout errors
    }
  },

  async getMe(): Promise<User> {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/me');

      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Erro ao buscar usuário');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
        '/auth/refresh',
        { refreshToken }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error('Erro ao renovar token');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  },
};
