'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, CreditCard, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/stores/authStore';
import api from '@/services/api';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email invalido'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatoria'),
  newPassword: z
    .string()
    .min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas nao coincidem',
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileError('');
    setProfileSuccess(false);
    try {
      const response = await api.put('/user/profile', data);
      if (response.data.success) {
        setUser(response.data.data);
        setProfileSuccess(true);
        setTimeout(() => setProfileSuccess(false), 3000);
      }
    } catch (error: any) {
      setProfileError(error.response?.data?.error || 'Erro ao atualizar perfil');
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordError('');
    setPasswordSuccess(false);
    try {
      const response = await api.put('/user/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      if (response.data.success) {
        setPasswordSuccess(true);
        passwordForm.reset();
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch (error: any) {
      setPasswordError(error.response?.data?.error || 'Erro ao alterar senha');
    }
  };

  const planFeatures: Record<string, string[]> = {
    FREE: ['3 analises/mes', '10 paginas max', '10 msgs chat/contrato', '1 geracao/mes'],
    PRO: ['50 analises/mes', '50 paginas max', '100 msgs chat/contrato', '20 geracoes/mes'],
    BUSINESS: ['Analises ilimitadas', '200 paginas max', 'Chat ilimitado', 'Geracoes ilimitadas'],
  };

  return (
    <div className="min-h-screen">
      <Header title="Configuracoes" description="Gerencie sua conta e preferencias" />

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil
            </CardTitle>
            <CardDescription>Atualize suas informacoes pessoais</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
              {profileError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 text-green-500 text-sm">
                  Perfil atualizado com sucesso!
                </div>
              )}

              <Input
                {...profileForm.register('name')}
                placeholder="Nome"
                error={profileForm.formState.errors.name?.message}
              />
              <Input
                {...profileForm.register('email')}
                type="email"
                placeholder="Email"
                error={profileForm.formState.errors.email?.message}
              />
              <Button type="submit" isLoading={profileForm.formState.isSubmitting}>
                Salvar Alteracoes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>Atualize sua senha de acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              {passwordError && (
                <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-green-500/10 text-green-500 text-sm">
                  Senha alterada com sucesso!
                </div>
              )}

              <Input
                {...passwordForm.register('currentPassword')}
                type="password"
                placeholder="Senha atual"
                error={passwordForm.formState.errors.currentPassword?.message}
              />
              <Input
                {...passwordForm.register('newPassword')}
                type="password"
                placeholder="Nova senha"
                error={passwordForm.formState.errors.newPassword?.message}
              />
              <Input
                {...passwordForm.register('confirmPassword')}
                type="password"
                placeholder="Confirmar nova senha"
                error={passwordForm.formState.errors.confirmPassword?.message}
              />
              <Button type="submit" isLoading={passwordForm.formState.isSubmitting}>
                Alterar Senha
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Plan Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Seu Plano
            </CardTitle>
            <CardDescription>Gerencie sua assinatura</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <Badge className="text-lg px-3 py-1">{user?.plan}</Badge>
              </div>
              {user?.plan !== 'BUSINESS' && (
                <Button variant="outline">Fazer Upgrade</Button>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Recursos incluidos:</p>
              <ul className="space-y-1">
                {planFeatures[user?.plan || 'FREE'].map((feature, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>Acoes irreversiveis</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ao excluir sua conta, todos os seus dados serao permanentemente removidos.
              Esta acao nao pode ser desfeita.
            </p>
            <Button variant="destructive">Excluir Conta</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
