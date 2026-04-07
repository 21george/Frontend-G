import api from '../client'

export const analyticsApi = {
  client: (clientId: string) =>
    api.get(`/coach/clients/${clientId}/analytics`).then(r => r.data.data),
}
