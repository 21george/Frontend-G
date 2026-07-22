"use client";

import {
  useMessages,
  useSendMessage,
  useUploadMessageMedia,
} from "@/hooks/useMessages";
import { useSocketChat } from "@/lib/useSocketChat";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import {
  DrawerRoot,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/Drawer";
import { Skeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Paperclip,
  X,
  FileText,
  Download,
  Loader2,
  Wifi,
  WifiOff,
  MessageSquare,
  Phone,
  Mail,
} from "lucide-react";

/* ── Types ─────────────────────────────────────────────────────────────── */
interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  profile_photo_url?: string;
  active?: boolean;
}

interface ChatMessage {
  id: string;
  content: string;
  sender_role: "coach" | "client";
  sent_at: string;
  media_url?: string | null;
  media_type?: string | null;
  media_filename?: string | null;
}

interface MessageDrawerProps {
  client: Client | null;
  open: boolean;
  onClose: () => void;
}

/* ── Sub-components ────────────────────────────────────────────────────── */

function formatWhen(sentAt: string | null | undefined): string {
  if (!sentAt || sentAt === "Invalid Date") return "Just now";
  const sent = new Date(sentAt);
  if (isNaN(sent.getTime())) return "Just now";
  const now = new Date();
  const diffMs = now.getTime() - sent.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return sent.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function LiveIndicator({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-medium">
      {connected ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-emerald-500">Live</span>
        </>
      ) : (
        <>
          <WifiOff size={12} className="text-[var(--text-tertiary)]" />
          <span className="text-[var(--text-tertiary)]">Polling</span>
        </>
      )}
    </div>
  );
}

function ClientHeader({ client }: { client: Client }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        {client.profile_photo_url ? (
          <img
            src={client.profile_photo_url}
            alt={client.name}
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-[var(--border)]"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#132e35] to-[#0b1e22] flex items-center justify-center text-white text-[13px] font-semibold ring-2 ring-[var(--border)]">
            {client.name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        {client.active && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-[var(--bg-card)] rounded-full" />
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[var(--text-primary)] truncate leading-tight">
          {client.name}
        </p>
        <p className="text-[11px] text-[var(--text-tertiary)] leading-tight mt-0.5">
          {client.active ? "Active now" : "Offline"}
        </p>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  client,
  showAvatar,
}: {
  message: ChatMessage;
  client: Client;
  showAvatar: boolean;
}) {
  const isCoach = message.sender_role === "coach";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.6 }}
      className={`flex items-end gap-2 ${isCoach ? "justify-end" : "justify-start"}`}
    >
      {/* Client avatar (only on first message in group) */}
      {!isCoach && showAvatar && (
        <div className="w-7 h-7 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 mb-1">
          {client.profile_photo_url ? (
            <img
              src={client.profile_photo_url}
              alt=""
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-[10px] font-semibold text-[var(--text-primary)]">
              {client.name?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>
      )}
      {!isCoach && !showAvatar && <div className="w-7 flex-shrink-0" />}

      <div
        className={`max-w-[80%] sm:max-w-[75%] px-4 py-2.5 text-[13px] leading-relaxed ${
          isCoach
            ? "bg-gradient-to-br from-brand-600 to-[#0f2027] text-white rounded-2xl rounded-tr-sm shadow-lg shadow-brand-900/20"
            : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-primary)] rounded-2xl rounded-tl-sm shadow-sm"
        }`}
      >
        {/* Media attachment */}
        {message.media_url && message.media_type === "image" && (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block mb-2"
          >
            <img
              src={message.media_url}
              alt=""
              className="max-w-full max-h-48 object-cover rounded-lg"
            />
          </a>
        )}
        {message.media_url && message.media_type === "file" && (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 mb-2 px-3 py-2 rounded-lg transition-colors ${
              isCoach
                ? "bg-white/15 hover:bg-white/25"
                : "bg-[var(--bg-subtle)] hover:bg-[var(--bg-hover)]"
            }`}
          >
            <FileText size={14} />
            <span className="text-[12px] truncate flex-1">
              {message.media_filename || "File"}
            </span>
            <Download size={12} />
          </a>
        )}

        {message.content && (
          <p className={message.media_url ? "mt-1" : ""}>{message.content}</p>
        )}

        <p
          className={`text-[11px] mt-1.5 text-right ${
            isCoach ? "text-brand-200/70" : "text-[var(--text-tertiary)]"
          }`}
        >
          {formatWhen(message.sent_at)}
        </p>
      </div>
    </motion.div>
  );
}

/* ── Main Component ──────────────────────────────────────────────────── */

export function MessageDrawer({ client, open, onClose }: MessageDrawerProps) {
  const clientId = client?.id ?? "";
  const [msg, setMsg] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    media_url: string;
    media_type: string;
    media_filename: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    data: messagesData,
    isLoading: msgLoading,
    error: msgError,
  } = useMessages(clientId);
  const sendMsg = useSendMessage();
  const uploadMedia = useUploadMessageMedia();

  const {
    connected: socketConnected,
    incomingMessages,
    relayViaSocket,
    clearIncoming,
  } = useSocketChat(clientId);

  // Merge REST + socket messages
  const allMessages = useMemo(() => {
    const rest: ChatMessage[] = messagesData?.data ?? [];
    const restIds = new Set(rest.map((m) => m.id));
    const extra = incomingMessages
      .filter((sm) => !restIds.has(sm.id))
      .map((sm) => ({
        id: sm.id,
        content: sm.content,
        sender_role: sm.sender_role,
        sent_at: sm.sent_at,
        media_url: null,
        media_type: null,
        media_filename: null,
      }));
    return [...rest, ...extra].sort(
      (a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime(),
    );
  }, [messagesData, incomingMessages]);

  // Auto-scroll
  const shouldAutoScroll = useRef(true);
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const threshold = 50;
    shouldAutoScroll.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (shouldAutoScroll.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages]);

  // Clear socket messages covered by REST
  useEffect(() => {
    const restIds = (messagesData?.data ?? []).map((m: ChatMessage) => m.id);
    clearIncoming(restIds);
  }, [messagesData, clearIncoming]);

  // Reset local state when client changes
  useEffect(() => {
    setMsg("");
    setPendingFile(null);
  }, [clientId]);

  const handleSend = async () => {
    if (!msg.trim() && !pendingFile) return;
    if (!clientId) return;
    const content =
      msg.trim() || (pendingFile ? `📎 ${pendingFile.media_filename}` : "");
    const payload: Parameters<typeof sendMsg.mutateAsync>[0] = {
      client_id: clientId,
      content,
    };
    if (pendingFile) {
      payload.media_url = pendingFile.media_url;
      payload.media_type = pendingFile.media_type;
      payload.media_filename = pendingFile.media_filename;
    }
    try {
      await sendMsg.mutateAsync(payload);
      setMsg("");
      setPendingFile(null);
      relayViaSocket(content);
    } catch {
      // user can retry
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await uploadMedia.mutateAsync(file);
      setPendingFile(result);
    } catch {
      toast.error("Failed to upload file.");
    }
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group consecutive messages to control avatar visibility
  const messageGroups = useMemo(() => {
    return allMessages.map((m, i) => {
      const prev = allMessages[i - 1];
      const showAvatar =
        m.sender_role === "client" && (!prev || prev.sender_role !== "client");
      return { message: m, showAvatar };
    });
  }, [allMessages]);

  return (
    <DrawerRoot open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent
        open={open}
        direction="right"
        size="lg"
        className="bg-gradient-to-b from-[var(--bg-page)] to-[var(--bg-card)]"
      >
        {/* Radix requires a DialogTitle for screen-reader users. We
            hide it visually because the client name is already shown
            prominently in the header below; duplicating it as a
            second visible title would be noise. */}
        <DrawerTitle className="sr-only">
          {client ? `Messages with ${client.name}` : "Messages"}
        </DrawerTitle>
        <DrawerDescription className="sr-only">
          {client ? "Conversation history" : "Pick a client to start"}
        </DrawerDescription>
        <AnimatePresence mode="wait">
          {!client ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center h-full px-8 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-[var(--text-tertiary)]" />
              </div>
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                Select a client
              </p>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">
                Choose a client to start messaging
              </p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <DrawerHeader className="bg-[var(--bg-card)]/80 backdrop-blur-xl">
                <div className="flex items-center justify-between w-full">
                  <ClientHeader client={client} />
                  <div className="flex items-center gap-3">
                    <LiveIndicator connected={socketConnected} />
                    <DrawerClose asChild>
                      <button
                        onClick={onClose}
                        aria-label="Close"
                        className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </DrawerClose>
                  </div>
                </div>
              </DrawerHeader>

              {/* Scrollable messages */}
              <div
                ref={scrollAreaRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin"
              >
                {msgLoading && allMessages.length === 0 && (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`flex items-end gap-2 ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
                      >
                        {i % 2 === 0 && (
                          <Skeleton className="w-7 h-7 rounded-lg flex-shrink-0" />
                        )}
                        <Skeleton
                          className={`h-10 rounded-xl ${i % 2 === 0 ? "w-52" : "w-40"}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {msgError && (
                  <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-[13px]">
                    Failed to load messages.{" "}
                    {(msgError as any)?.response?.data?.message ||
                      (msgError as Error)?.message ||
                      "Please try again."}
                  </div>
                )}

                {messageGroups.map(({ message, showAvatar }) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    client={client}
                    showAvatar={showAvatar}
                  />
                ))}

                {!msgLoading && allMessages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 flex items-center justify-center mb-4 shadow-lg shadow-brand-900/20">
                      <MessageSquare className="w-7 h-7 text-white" />
                    </div>
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                      Start the conversation
                    </p>
                    <p className="text-[13px] text-[var(--text-secondary)] mt-1 max-w-[16rem]">
                      Send your first message to {client.name} below.
                    </p>
                    <div className="flex items-center gap-4 mt-5 text-[11px] text-[var(--text-tertiary)]">
                      {client.phone && (
                        <div className="flex items-center gap-1">
                          <Phone size={11} /> {client.phone}
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-1">
                          <Mail size={11} /> {client.email}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Pending file preview */}
              <AnimatePresence>
                {pendingFile && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="px-5 py-2.5 border-t border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-sm flex items-center gap-3"
                  >
                    {pendingFile.media_type === "image" ? (
                      <img
                        src={pendingFile.media_url}
                        alt=""
                        className="w-10 h-10 object-cover rounded-lg ring-1 ring-[var(--border)]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center">
                        <FileText
                          size={16}
                          className="text-[var(--text-tertiary)]"
                        />
                      </div>
                    )}
                    <span className="text-[12px] text-[var(--text-secondary)] truncate flex-1">
                      {pendingFile.media_filename}
                    </span>
                    <button
                      onClick={() => setPendingFile(null)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-[var(--text-tertiary)] hover:text-danger transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input area */}
              <div className="px-5 py-4 border-t border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-xl flex-shrink-0">
                <div className="flex items-end gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/jpeg,image/png,image/gif,image/webp,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadMedia.isPending}
                    className="p-3 rounded-xl border border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-40 flex-shrink-0"
                  >
                    {uploadMedia.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Paperclip size={16} />
                    )}
                  </button>

                  <div className="flex-1 relative">
                    <input
                      value={msg}
                      onChange={(e) => setMsg(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Message ${client.name}...`}
                      className="w-full bg-[var(--bg-subtle)] border border-[var(--border)] rounded-xl px-4 py-3 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all"
                    />
                  </div>

                  <button
                    onClick={handleSend}
                    disabled={
                      sendMsg.isPending || (!msg.trim() && !pendingFile)
                    }
                    className="p-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex-shrink-0 shadow-lg shadow-brand-900/20"
                  >
                    {sendMsg.isPending ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </AnimatePresence>
      </DrawerContent>
    </DrawerRoot>
  );
}
