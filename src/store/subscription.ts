import { create } from 'zustand';

interface SubscriptionState {
  setupToken: string | null;
  coachId: string | null;
  selectedPlan: 'free' | 'pro' | 'business' | null;
  isProcessing: boolean;
  error: string | null;

  setSetupToken: (token: string | null, coachId: string | null) => void;
  setSelectedPlan: (plan: 'free' | 'pro' | 'business') => void;
  setProcessing: (processing: boolean) => void;
  setError: (error: string | null) => void;
  clearState: () => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  setupToken: null,
  coachId: null,
  selectedPlan: null,
  isProcessing: false,
  error: null,

  setSetupToken: (token, coachId) => set({ setupToken: token, coachId }),
  setSelectedPlan: (plan) => set({ selectedPlan: plan }),
  setProcessing: (processing) => set({ isProcessing: processing }),
  setError: (error) => set({ error }),
  clearState: () => set({
    setupToken: null,
    coachId: null,
    selectedPlan: null,
    isProcessing: false,
    error: null,
  }),
}));
