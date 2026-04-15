import { useQuery } from '@tanstack/react-query'
import { subscriptionApi } from '@/lib/api'
import { useToastMutation } from './useToastMutation'

export const useSubscription = () =>
  useQuery({
    queryKey: ['subscription'],
    queryFn: () => subscriptionApi.status(),
    staleTime: 60_000,
  })

export const useCheckout = () =>
  useToastMutation({
    mutationFn: (tier: 'pro' | 'business') => subscriptionApi.checkout(tier),
    errorMessage: 'Failed to start checkout',
    onSuccess: (data) => {
      window.location.href = data.checkout_url
    },
  })

export const useManageBilling = () =>
  useToastMutation({
    mutationFn: () => subscriptionApi.portal(),
    errorMessage: 'Failed to open billing portal',
    onSuccess: (data) => {
      window.location.href = data.portal_url
    },
  })

export const useCancelSubscription = () =>
  useToastMutation({
    mutationFn: () => subscriptionApi.cancel(),
    successMessage: 'Subscription will cancel at end of billing period',
    errorMessage: 'Failed to cancel subscription',
    invalidateKeys: [['subscription']],
  })
