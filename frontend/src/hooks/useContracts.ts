'use client';

import { useCallback, useState } from 'react';
import { useContractStore } from '@/stores/contractStore';
import { contractService } from '@/services/contractService';
import { Contract, ContractAnalysis } from '@/types';

export function useContracts() {
  const {
    contracts,
    currentContract,
    currentAnalysis,
    isLoading,
    error,
    pagination,
    setContracts,
    addContract,
    removeContract,
    updateContract,
    setCurrentContract,
    setCurrentAnalysis,
    setLoading,
    setError,
    setPagination,
  } = useContractStore();

  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fetchContracts = useCallback(
    async (page = 1, limit = 10) => {
      setLoading(true);
      setError(null);
      try {
        const response = await contractService.getContracts(page, limit);
        setContracts(response.data);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar contratos');
      } finally {
        setLoading(false);
      }
    },
    [setContracts, setPagination, setLoading, setError]
  );

  const fetchContract = useCallback(
    async (id: string): Promise<Contract | null> => {
      setLoading(true);
      setError(null);
      try {
        const contract = await contractService.getContract(id);
        setCurrentContract(contract);
        if (contract.analysis) {
          setCurrentAnalysis(contract.analysis);
        }
        return contract;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar contrato');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [setCurrentContract, setCurrentAnalysis, setLoading, setError]
  );

  const uploadContract = useCallback(
    async (file: File): Promise<{ success: boolean; contract?: Contract; error?: string }> => {
      setLoading(true);
      setError(null);
      try {
        const contract = await contractService.uploadContract(file);
        addContract(contract);
        return { success: true, contract };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer upload';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setLoading(false);
      }
    },
    [addContract, setLoading, setError]
  );

  const deleteContract = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await contractService.deleteContract(id);
        removeContract(id);
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao excluir contrato');
        return false;
      }
    },
    [removeContract, setError]
  );

  const analyzeContract = useCallback(
    async (id: string): Promise<ContractAnalysis | null> => {
      setIsAnalyzing(true);
      setError(null);
      try {
        const analysis = await contractService.analyzeContract(id);
        updateContract(id, { status: 'COMPLETED', hasAnalysis: true });
        setCurrentAnalysis(analysis);
        return analysis;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erro ao analisar contrato';
        setError(errorMessage);
        updateContract(id, { status: 'ERROR' });
        return null;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [updateContract, setCurrentAnalysis, setError]
  );

  return {
    contracts,
    currentContract,
    currentAnalysis,
    isLoading,
    isAnalyzing,
    error,
    pagination,
    fetchContracts,
    fetchContract,
    uploadContract,
    deleteContract,
    analyzeContract,
    setCurrentContract,
    setCurrentAnalysis,
    clearError: () => setError(null),
  };
}
