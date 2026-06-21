import { create } from "zustand";
import type { SubscriptionPeriod } from "@/types";

type SignupStep = 1 | 2 | 3;

interface SignupState {
  step: SignupStep;
  setupToken: string | null;
  coachId: string | null;
  period: SubscriptionPeriod;

  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: SignupStep) => void;
  setCredentials: (setupToken: string, coachId: string) => void;
  setPeriod: (period: SubscriptionPeriod) => void;
  reset: () => void;
}

export const useSignupStore = create<SignupState>((set) => ({
  step: 1,
  setupToken: null,
  coachId: null,
  period: "monthly",

  nextStep: () => set((s) => ({ step: Math.min(s.step + 1, 3) as SignupStep })),

  prevStep: () => set((s) => ({ step: Math.max(s.step - 1, 1) as SignupStep })),

  setStep: (step) => set({ step }),

  setCredentials: (setupToken, coachId) => set({ setupToken, coachId }),

  setPeriod: (period) => set({ period }),

  reset: () =>
    set({ step: 1, setupToken: null, coachId: null, period: "monthly" }),
}));
