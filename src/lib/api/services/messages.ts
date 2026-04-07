import api from '../client'

export const messagesApi = {
  list: (clientId: string) =>
    api.get(`/messages/${clientId}`).then(r => r.data),

  send: (data: { client_id: string; content: string; media_url?: string; media_type?: string; media_filename?: string }) =>
    api.post('/messages', data).then(r => r.data),

  uploadMedia: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/messages/upload-media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data.data as { media_url: string; media_type: string; media_filename: string })
  },
}
