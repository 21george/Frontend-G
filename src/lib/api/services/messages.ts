import api from "../client";
import type { PaginatedResponse } from "@/types";

interface UnreadMessage {
  id: string;
  client_id: string;
  client_name: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  sent_at: string;
}

interface UnreadClientMessage {
  client_id: string;
  client_name: string;
  count: number;
  last_message: string;
}

export const messagesApi = {
  list: (clientId: string) =>
    api
      .get<
        PaginatedResponse<{
          id: string;
          content: string;
          sender_role: "coach" | "client";
          read: boolean;
          sent_at: string;
          media_url?: string | null;
          media_type?: string | null;
          media_filename?: string | null;
        }>
      >(`/messages/${clientId}`)
      .then((r) => r.data),

  send: (data: {
    client_id: string;
    content: string;
    media_url?: string;
    media_type?: string;
    media_filename?: string;
  }) => api.post("/messages", data).then((r) => r.data),

  uploadMedia: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api
      .post("/messages/upload-media", formData)
      .then(
        (r) =>
          r.data.data as {
            media_url: string;
            media_type: string;
            media_filename: string;
          },
      );
  },

  /** Fetch actual unread messages with client details and content preview */
  getUnreadMessages: () =>
    api
      .get<{
        data: { messages: UnreadMessage[]; count: number };
      }>("/messages/unread")
      .then((r) => r.data),

  /** Mark all client messages as read for the coach */
  markAllRead: () =>
    api
      .post<{ data: { marked: number } }>("/messages/read-all")
      .then((r) => r.data),

  /** Get unread messages count from clients (for notification badge) */
  getUnreadCount: () =>
    api
      .get<{
        data: { count: number; clients: UnreadClientMessage[] };
      }>("/messages/unread-count")
      .then((r) => r.data),
};
