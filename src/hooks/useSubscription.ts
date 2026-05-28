import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subscriptionApi } from "@/lib/api";
import api from "@/lib/api/client";
import { useToastMutation } from "./useToastMutation";
import type { SubscriptionPeriod } from "@/types";

export const useSubscription = () =>
  useQuery({
    queryKey: ["subscription"],
    queryFn: () => subscriptionApi.status(),
    staleTime: 60_000,
  });

export const useCheckout = () =>
  useToastMutation({
    mutationFn: ({ tier, period }: { tier: "pro" | "business"; period?: SubscriptionPeriod }) =>
      subscriptionApi.checkout(tier, period),
    errorMessage: "Failed to start checkout",
    onSuccess: (data) => {
      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else if (data.client_secret && data.session_id) {
        // Embedded checkout — redirect to success page with session_id for Stripe to handle
        window.location.href = `/subscription/success?session_id=${data.session_id}`;
      } else {
        throw new Error("Invalid checkout response");
      }
    },
  });

export const useManageBilling = () =>
  useToastMutation({
    mutationFn: () => subscriptionApi.portal(),
    errorMessage: "Failed to open billing portal",
    onSuccess: (data) => {
      window.location.href = data.portal_url;
    },
  });

export const useCancelSubscription = () =>
  useToastMutation({
    mutationFn: () => subscriptionApi.cancel(),
    successMessage: "Subscription will cancel at end of billing period",
    errorMessage: "Failed to cancel subscription",
    invalidateKeys: [["subscription"]],
  });

export const useUpgradeSubscription = () =>
  useToastMutation({
    mutationFn: ({ tier, period }: { tier: "pro" | "business"; period?: SubscriptionPeriod }) =>
      api
        .post<{
          message: string;
          data: { new_tier: string; new_period: SubscriptionPeriod };
        }>("/subscription/upgrade", { tier, period })
        .then((r) => r.data),
    successMessage: "Plan updated successfully",
    errorMessage: "Failed to update subscription",
    invalidateKeys: [["subscription"]],
  });

/* ── Payment Methods ─────────────────────────────────────────────────────── */

export const usePaymentMethods = () =>
  useQuery({
    queryKey: ["payment-methods"],
    queryFn: () => subscriptionApi.listPaymentMethods(),
    staleTime: 30_000,
  });

export const useCreateSetupIntent = () =>
  useToastMutation({
    mutationFn: () => subscriptionApi.createSetupIntent(),
    errorMessage: "Failed to initialize payment setup",
  });

export const useAddPaymentMethod = () =>
  useToastMutation({
    mutationFn: ({ paymentMethodId, isDefault }: { paymentMethodId: string; isDefault?: boolean }) =>
      subscriptionApi.addPaymentMethod(paymentMethodId, isDefault),
    successMessage: "Card added successfully",
    errorMessage: "Failed to add card",
    invalidateKeys: [["payment-methods"]],
  });

export const useDeletePaymentMethod = () =>
  useToastMutation({
    mutationFn: (id: string) => subscriptionApi.deletePaymentMethod(id),
    successMessage: "Card removed",
    errorMessage: "Failed to remove card",
    invalidateKeys: [["payment-methods"]],
  });

export const useSetDefaultPaymentMethod = () =>
  useToastMutation({
    mutationFn: (id: string) => subscriptionApi.setDefaultPaymentMethod(id),
    successMessage: "Default card updated",
    errorMessage: "Failed to update default card",
    invalidateKeys: [["payment-methods"]],
  });
