'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Upload, BarChart3, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { contractService } from '@/services/contractService';
import { useAuthStore } from '@/stores/authStore';
import { UsageStats, Contract } from '@/types';
import { formatDate } from '@/lib/utils';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [usageData, contractsData] = await Promise.all([
          contractService.getUsage(),
          contractService.getContracts(1, 5),
        ]);
        setStats(usageData);
        setRecentContracts(contractsData.data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen">
      <Header
        title={`Ola, ${user?.name || 'Usuario'}!`}
        description="Bem-vindo ao Contrato.AI"
      />

      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Contratos Analisados"
            value={stats?.analyzesThisMonth || 0}
            limit={stats?.limits.analyzesPerMonth === -1 ? undefined : stats?.limits.analyzesPerMonth}
            icon={BarChart3}
            description="este mes"
          />
          <StatsCard
            title="Contratos Gerados"
            value={stats?.generatesThisMonth || 0}
            limit={stats?.limits.generatePerMonth === -1 ? undefined : stats?.limits.generatePerMonth}
            icon={FileText}
            description="este mes"
          />
          <StatsCard
            title="Total de Contratos"
            value={stats?.totalContracts || 0}
            icon={TrendingUp}
            description="armazenados"
          />
          <StatsCard
            title="Seu Plano"
            value={user?.plan || 'FREE'}
            icon={AlertTriangle}
            description="plano atual"
            isText
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Analisar Contrato</h3>
                  <p className="text-sm text-muted-foreground">
                    Faca upload de um contrato para analise
                  </p>
                </div>
                <Link href="/upload">
                  <Button>Upload</Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/10">
                  <FileText className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Gerar Contrato</h3>
                  <p className="text-sm text-muted-foreground">
                    Crie um novo contrato com IA
                  </p>
                </div>
                <Link href="/generate">
                  <Button variant="outline">Gerar</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Contracts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Contratos Recentes
            </CardTitle>
            <Link href="/contracts">
              <Button variant="ghost" size="sm">
                Ver todos
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentContracts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum contrato encontrado</p>
                <Link href="/upload">
                  <Button variant="link" className="mt-2">
                    Fazer primeiro upload
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentContracts.map((contract) => (
                  <Link
                    key={contract.id}
                    href={`/contracts/${contract.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{contract.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(contract.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        contract.status === 'COMPLETED'
                          ? 'success'
                          : contract.status === 'ERROR'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {contract.status === 'COMPLETED'
                        ? 'Analisado'
                        : contract.status === 'ERROR'
                        ? 'Erro'
                        : 'Pendente'}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  limit,
  icon: Icon,
  description,
  isText,
}: {
  title: string;
  value: number | string;
  limit?: number;
  icon: React.ElementType;
  description: string;
  isText?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {isText ? (
                value
              ) : (
                <>
                  {value}
                  {limit !== undefined && (
                    <span className="text-sm font-normal text-muted-foreground">
                      /{limit}
                    </span>
                  )}
                </>
              )}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
