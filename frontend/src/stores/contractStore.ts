import { create } from 'zustand';
import { Contract, ContractAnalysis } from '@/types';

interface ContractState {
  contracts: Contract[];
  currentContract: Contract | null;
  currentAnalysis: ContractAnalysis | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  setContracts: (contracts: Contract[]) => void;
  addContract: (contract: Contract) => void;
  removeContract: (id: string) => void;
  updateContract: (id: string, updates: Partial<Contract>) => void;
  setCurrentContract: (contract: Contract | null) => void;
  setCurrentAnalysis: (analysis: ContractAnalysis | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setPagination: (pagination: ContractState['pagination']) => void;
}

export const useContractStore = create<ContractState>((set) => ({
  contracts: [],
  currentContract: null,
  currentAnalysis: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  setContracts: (contracts) => set({ contracts }),

  addContract: (contract) =>
    set((state) => ({
      contracts: [contract, ...state.contracts],
    })),

  removeContract: (id) =>
    set((state) => ({
      contracts: state.contracts.filter((c) => c.id !== id),
    })),

  updateContract: (id, updates) =>
    set((state) => ({
      contracts: state.contracts.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    })),

  setCurrentContract: (currentContract) => set({ currentContract }),

  setCurrentAnalysis: (currentAnalysis) => set({ currentAnalysis }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setPagination: (pagination) => set({ pagination }),
}));
