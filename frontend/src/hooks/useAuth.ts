'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/authService';
import { LoginCredentials, RegisterCredentials } from '@/types';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    login: setLogin,
    logout: setLogout,
    setLoading,
  } = useAuthStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = useAuthStore.getState().accessToken;
      if (token && !user) {
        try {
          const userData = await authService.getMe();
          useAuthStore.getState().setUser(userData);
        } catch {
          setLogout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [user, setLogout, setLoading]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      setLogin(response.user, response.accessToken, response.refreshToken);
      router.push('/');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao fazer login',
      };
    }
  };

  const register = async (credentials: RegisterCredentials) => {
    try {
      const response = await authService.register(credentials);
      setLogin(response.user, response.accessToken, response.refreshToken);
      router.push('/');
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar conta',
      };
    }
  };

  const logout = async () => {
    await authService.logout();
    setLogout();
    router.push('/login');
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
  };
}
