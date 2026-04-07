import api from '../client'
import type { LiveTrainingSession, LiveTrainingRequest, LiveTrainingParticipant, LiveTrainingChatMessage, ApiResponse } from '@/types'

export const liveTrainingApi = {
  /* ── Coach ── */
  list: (status?: string, category?: string) =>
    api.get<ApiResponse<LiveTrainingSession[]>>('/live-training', { params: { status, category } }).then(r => r.data.data),

  get: (id: string) =>
    api.get<ApiResponse<LiveTrainingSession>>(`/live-training/${id}`).then(r => r.data.data),

  create: (data: Partial<LiveTrainingSession>) =>
    api.post<ApiResponse<{ id: string }>>('/live-training', data).then(r => r.data),

  update: (id: string, data: Partial<LiveTrainingSession>) =>
    api.put(`/live-training/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    api.delete(`/live-training/${id}`).then(r => r.data),

  goLive: (id: string) =>
    api.post(`/live-training/${id}/go-live`).then(r => r.data),

  endSession: (id: string) =>
    api.post(`/live-training/${id}/end`).then(r => r.data),

  listRequests: (id: string, status?: string) =>
    api.get<ApiResponse<LiveTrainingRequest[]>>(`/live-training/${id}/requests`, { params: { status } }).then(r => r.data.data),

  handleRequest: (sessionId: string, requestId: string, action: 'approved' | 'rejected') =>
    api.post(`/live-training/${sessionId}/requests`, { request_id: requestId, action }).then(r => r.data),

  participants: (id: string) =>
    api.get<ApiResponse<LiveTrainingParticipant[]>>(`/live-training/${id}/participants`).then(r => r.data.data),

  getChat: (id: string) =>
    api.get<ApiResponse<LiveTrainingChatMessage[]>>(`/live-training/${id}/chat`).then(r => r.data.data),

  sendChat: (id: string, content: string) =>
    api.post(`/live-training/${id}/chat`, { content }).then(r => r.data),
}
