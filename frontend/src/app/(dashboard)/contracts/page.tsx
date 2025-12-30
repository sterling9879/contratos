'use client';

import { useEffect, useState } from 'react';
import { FileText, Search, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContractCard } from '@/components/contracts/contract-card';
import { useContracts } from '@/hooks/useContracts';

export default function ContractsPage() {
  const {
    contracts,
    isLoading,
    error,
    pagination,
    fetchContracts,
    deleteContract,
  } = useContracts();

  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchContracts(1, 10);
  }, [fetchContracts]);

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este contrato?')) {
      await deleteContract(id);
    }
  };

  const filteredContracts = contracts.filter((contract) =>
    contract.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header title="Meus Contratos" description="Gerencie seus contratos analisados" />

      <div className="p-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar contratos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-4 text-destructive">{error}</CardContent>
          </Card>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && contracts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum contrato encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Faca upload do seu primeiro contrato para comecar
            </p>
            <Button asChild>
              <a href="/upload">Fazer Upload</a>
            </Button>
          </div>
        )}

        {/* Contract List */}
        {!isLoading && filteredContracts.length > 0 && (
          <div className="space-y-4">
            {filteredContracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchContracts(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Pagina {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchContracts(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
            >
              Proximo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
