import api from '../client'
import type { SubscriptionInfo, Invoice, ApiResponse, SubscriptionPeriod } from '@/types'

export interface PaymentMethod {
  id: string
  brand: string
  last4: string
  exp_month: number | null
  exp_year: number | null
  is_default: boolean
}

export const subscriptionApi = {
  status: () =>
    api.get<ApiResponse<SubscriptionInfo>>('/subscription').then(r => r.data.data),

  checkout: (tier: 'pro' | 'business', period: SubscriptionPeriod = 'monthly') =>
    api.post<ApiResponse<{ checkout_url?: string; client_secret?: string; session_id?: string }>>('/subscription/checkout', { tier, period }).then(r => r.data.data),

  portal: () =>
    api.post<ApiResponse<{ portal_url: string }>>('/subscription/portal').then(r => r.data.data),

  cancel: () =>
    api.post<ApiResponse<null>>('/subscription/cancel').then(r => r.data),

  upgrade: (tier: 'pro' | 'business', period: SubscriptionPeriod = 'monthly') =>
    api.post<ApiResponse<{ new_tier: string; new_period: SubscriptionPeriod }>>('/subscription/upgrade', { tier, period }).then(r => r.data),

  invoices: (): Promise<Invoice[]> =>
    api
      .get<ApiResponse<Invoice[]>>('/subscription/invoices')
      .then(r => r.data.data ?? []),

  downloadInvoice: (id: string) =>
    api.get<ApiResponse<{ download_url: string | null; hosted_invoice_url: string | null }>>(`/subscription/invoices/${id}/download`).then(r => r.data.data),

  /* ── Payment Methods ─────────────────────────────────────────────────────── */

  createSetupIntent: () =>
    api.post<ApiResponse<{ client_secret: string; setup_intent_id: string }>>('/payment-methods/setup-intent')
      .then(r => r.data.data),

  listPaymentMethods: (): Promise<PaymentMethod[]> =>
    api.get<ApiResponse<{ payment_methods: PaymentMethod[] }>>('/payment-methods')
      .then(r => r.data.data?.payment_methods ?? []),

  addPaymentMethod: (paymentMethodId: string, isDefault?: boolean) =>
    api.post<ApiResponse<{ payment_method_id: string }>>('/payment-methods', {
      payment_method_id: paymentMethodId,
      is_default: isDefault,
    }).then(r => r.data.data),

  deletePaymentMethod: (id: string) =>
    api.delete<ApiResponse<null>>(`/payment-methods/${id}`).then(r => r.data),

  setDefaultPaymentMethod: (id: string) =>
    api.post<ApiResponse<null>>(`/payment-methods/${id}/default`).then(r => r.data),
}
