import api from '../client'
import type { SubscriptionInfo, ApiResponse } from '@/types'

export const subscriptionApi = {
  status: () =>
    api.get<ApiResponse<SubscriptionInfo>>('/subscription').then(r => r.data.data),

  checkout: (tier: 'pro' | 'business') =>
    api.post<ApiResponse<{ checkout_url: string }>>('/subscription/checkout', { tier }).then(r => r.data.data),

  portal: () =>
    api.post<ApiResponse<{ portal_url: string }>>('/subscription/portal').then(r => r.data.data),

  cancel: () =>
    api.post<ApiResponse<null>>('/subscription/cancel').then(r => r.data),
}
