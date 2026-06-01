import api from "../client";

export const analyticsApi = {
  client: (clientId: string) =>
    api.get(`/coach/clients/${clientId}/analytics`).then((r) => r.data.data),

  coach: () => api.get("/analytics/coach").then((r) => r.data.data),

  sessions: () => api.get("/analytics/sessions").then((r) => r.data.data),
};
