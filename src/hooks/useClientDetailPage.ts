"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  useClient,
  useClientAnalytics,
  useMessages,
  useSendMessage,
  useCheckins,
  useUpdateCheckinStatus,
  useWorkoutPlans,
  useNutritionPlans,
  useRegenerateCode,
  useClientMedia,
  useWorkoutLogs,
  useDeleteWorkoutPlan,
  useDeleteClient,
  useUpdateClient,
  useUploadMessageMedia,
  useBlockClient,
  useUnblockClient,
  useUploadClientPhoto,
  useWorkoutProgress,
  useLiveProgress,
} from "@/lib/hooks";
import { useSocketChat } from "@/lib/useSocketChat";
import { diffChanged } from "@/lib/diffChanged";
import { formatDate } from "@/lib/utils";
import type { CheckinMeeting, WorkoutPlan } from "@/types";

export type TabKey =
  | "workouts"
  | "nutrition"
  | "analytics"
  | "messages"
  | "checkins"
  | "plan-analysis"
  | "body"
  | "adherence"
  | "prediction";

const TABS: { key: TabKey; label: string }[] = [
  { key: "workouts", label: "Workouts" },
  { key: "nutrition", label: "Nutrition" },
  { key: "body", label: "Body" },
  { key: "adherence", label: "Adherence" },
  { key: "prediction", label: "Prediction" },
  { key: "analytics", label: "Analytics" },
  { key: "plan-analysis", label: "Plan Analysis" },
  { key: "messages", label: "Messages" },
  { key: "checkins", label: "Schedule" },
];

export function useClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  /* ── UI state ── */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("workouts");
  const [copied, setCopied] = useState(false);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [scheduleFilter, setScheduleFilter] = useState<
    "Upcoming" | "Ongoing" | "Rescheduled" | "Cancelled" | "Completed"
  >("Upcoming");

  /* ── Delete modal state ── */
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "client" | "workout";
    item?: any;
  }>({ open: false, type: "client" });
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /* ── Edit modal state ── */
  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    gender: "" as "" | "male" | "female" | "other",
    date_of_birth: "",
    city: "",
    address: "",
    notes: "",
    current_weight_kg: "",
    height_cm: "",
    nationality: "",
    occupation: "",
    sickness: "",
  });
  const [editSaving, setEditSaving] = useState(false);
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoPreview, setEditPhotoPreview] = useState<string | null>(null);

  /* ── Messages state ── */
  const [msg, setMsg] = useState("");
  const [pendingFile, setPendingFile] = useState<{
    media_url: string;
    media_type: string;
    media_filename: string;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ── Data ── */
  const { data: client, isLoading } = useClient(id);
  const { data: analytics } = useClientAnalytics(id);
  const { data: messagesData, isLoading: msgLoading } = useMessages(id);
  const { data: checkins } = useCheckins(id);
  const { data: plans } = useWorkoutPlans(id);
  const { data: nutrition } = useNutritionPlans(id);
  const { data: media } = useClientMedia(id);
  const { data: workoutLogs } = useWorkoutLogs(id);
  const { data: workoutProgress } = useWorkoutProgress(id);
  const { data: liveProgress, isLoading: liveProgressLoading } = useLiveProgress(id);

  const sendMsg = useSendMessage();
  const uploadMedia = useUploadMessageMedia();
  const regenerateCode = useRegenerateCode(id);
  const updateCheckinStatus = useUpdateCheckinStatus();
  const deleteWorkoutPlan = useDeleteWorkoutPlan();
  const deleteClient = useDeleteClient();
  const updateClient = useUpdateClient(id);
  const blockClient = useBlockClient(id);
  const unblockClient = useUnblockClient(id);
  const uploadClientPhoto = useUploadClientPhoto(id);
  const { connected: socketConnected, incomingMessages, relayViaSocket } = useSocketChat(id);

  /* ── Helpers ── */
  const revokeBlobUrl = useCallback((url: string | null) => {
    if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
  }, []);

  const resetEditPhotoState = useCallback(() => {
    revokeBlobUrl(editPhotoPreview);
    setEditPhotoFile(null);
    setEditPhotoPreview(null);
  }, [editPhotoPreview, revokeBlobUrl]);

  const closeEditModal = useCallback(() => {
    resetEditPhotoState();
    setEditModal(false);
  }, [resetEditPhotoState]);

  useEffect(() => {
    return () => {
      revokeBlobUrl(editPhotoPreview);
    };
  }, [editPhotoPreview, revokeBlobUrl]);

  const closeScheduleModal = useCallback(() => setShowScheduleModal(false), []);
  const openScheduleModal = useCallback(() => setShowScheduleModal(true), []);

  /* ── Messages ── */
  const allMessages = useMemo(() => {
    const rest: any[] = messagesData?.data ?? [];
    const restIds = new Set(rest.map((m: any) => m.id));
    const extra = incomingMessages.filter((sm) => !restIds.has(sm.id));
    if (extra.length === 0) return rest;
    return [...rest, ...extra].sort(
      (a: any, b: any) =>
        new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime()
    );
  }, [messagesData, incomingMessages]);

  useEffect(() => {
    if (tab === "messages") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages, tab]);

  const completedDaysMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    (workoutLogs ?? []).forEach((l: any) => {
      map[`${l.workout_plan_id}-${l.day?.toLowerCase()}`] = true;
    });
    return map;
  }, [workoutLogs]);

  /* ── Handlers ── */
  const handleSend = useCallback(async () => {
    if (!msg.trim() && !pendingFile) return;
    const content = msg.trim() || (pendingFile ? `📎 ${pendingFile.media_filename}` : "");
    setMsg("");
    const payload: Parameters<typeof sendMsg.mutateAsync>[0] = {
      client_id: id,
      content,
    };
    if (pendingFile) {
      payload.media_url = pendingFile.media_url;
      payload.media_type = pendingFile.media_type;
      payload.media_filename = pendingFile.media_filename;
      setPendingFile(null);
    }
    try {
      await sendMsg.mutateAsync(payload);
      relayViaSocket(content);
    } catch {
      /* Error toast handled by useToastMutation */
    }
  }, [msg, pendingFile, id, sendMsg, relayViaSocket]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const result = await uploadMedia.mutateAsync(file);
        setPendingFile(result);
      } catch {
        toast.error("Failed to upload file.");
      }
      e.target.value = "";
    },
    [uploadMedia]
  );

  const handleRegenerate = useCallback(async () => {
    if (!confirm("Regenerate code? The old code will stop working immediately.")) return;
    const res = await regenerateCode.mutateAsync();
    setNewCode(res.data.login_code);
  }, [regenerateCode]);

  const handleDeleteClient = useCallback(() => {
    setDeleteError(null);
    setDeleteModal({ open: true, type: "client" });
  }, []);

  const handleConfirmDeleteClient = useCallback(async () => {
    try {
      await deleteClient.mutateAsync(id);
      setDeleteError(null);
      setDeleteModal({ open: false, type: "client" });
      router.push("/clients");
    } catch (err: any) {
      if (process.env.NODE_ENV === "development") console.error("Delete client error:", err);
      const message = err?.response?.data?.message || err?.message || "Unknown error";
      setDeleteError(message);
    }
  }, [deleteClient, id, router]);

  const handleDeleteWorkout = useCallback((plan: WorkoutPlan) => {
    setDeleteError(null);
    setDeleteModal({ open: true, type: "workout", item: plan });
  }, []);

  const handleConfirmDeleteWorkout = useCallback(async () => {
    if (!deleteModal.item) return;
    try {
      if (expandedPlan === deleteModal.item.id) setExpandedPlan(null);
      await deleteWorkoutPlan.mutateAsync(deleteModal.item.id);
      setDeleteError(null);
      setDeleteModal({ open: false, type: "client" });
    } catch {
      setDeleteError("Failed to delete workout plan.");
    }
  }, [deleteModal.item, expandedPlan, deleteWorkoutPlan]);

  const handleToggleBlockClient = useCallback(async () => {
    const computedIsBlocked = client?.is_blocked ?? !client?.active;
    const action = computedIsBlocked ? "Unblock" : "Block";
    const warning = !computedIsBlocked
      ? " This will immediately invalidate all their sessions and login codes."
      : "";
    if (!confirm(`${action} client "${client?.name}"?${warning}`)) return;

    try {
      if (computedIsBlocked) await unblockClient.mutateAsync();
      else await blockClient.mutateAsync();
    } catch {
      toast.error(`Failed to ${action.toLowerCase()} client.`);
    }
  }, [client, blockClient, unblockClient]);

  const handleOpenEdit = useCallback(() => {
    if (!client) return;
    setEditForm({
      name: client.name ?? "",
      email: client.email ?? "",
      phone: client.phone ?? "",
      gender: (client.gender as any) ?? "",
      date_of_birth: client.date_of_birth ?? "",
      city: client.city ?? "",
      address: client.address ?? "",
      notes: client.notes ?? "",
      current_weight_kg: client.current_weight_kg != null ? String(client.current_weight_kg) : "",
      height_cm: client.height_cm != null ? String(client.height_cm) : "",
      nationality: client.nationality ?? "",
      occupation: client.occupation ?? "",
      sickness: client.sickness ?? "",
    });
    revokeBlobUrl(editPhotoPreview);
    setEditPhotoFile(null);
    setEditPhotoPreview(client.profile_photo_url ?? null);
    setEditModal(true);
  }, [client, editPhotoPreview, revokeBlobUrl]);

  const handleSaveEdit = useCallback(async () => {
    if (!editForm.name.trim()) {
      toast.error("Name is required");
      return;
    }

    const payload: Record<string, any> = {
      name: editForm.name.trim(),
      email: editForm.email.trim() || undefined,
      phone: editForm.phone.trim() || undefined,
      gender: (editForm.gender as "male" | "female" | "other") || undefined,
      date_of_birth: editForm.date_of_birth || undefined,
      city: editForm.city.trim() || undefined,
      address: editForm.address.trim() || undefined,
      notes: editForm.notes.trim() || undefined,
      nationality: editForm.nationality.trim() || undefined,
      occupation: editForm.occupation.trim() || undefined,
      sickness: editForm.sickness.trim() || undefined,
    };
    if (editForm.current_weight_kg.trim()) {
      const w = parseFloat(editForm.current_weight_kg);
      if (!isNaN(w)) payload.current_weight_kg = w;
    }
    if (editForm.height_cm.trim()) {
      const h = parseInt(editForm.height_cm, 10);
      if (!isNaN(h)) payload.height_cm = h;
    }

    const editableFields = Object.keys(payload);
    const clientBefore = client as unknown as Record<string, unknown> | undefined;
    const changedKeys = diffChanged(payload, clientBefore, { fields: editableFields });

    if (changedKeys.length === 0 && !editPhotoFile) {
      toast("No changes to save", { icon: "ℹ️" });
      closeEditModal();
      return;
    }

    setEditSaving(true);
    try {
      if (editPhotoFile) await uploadClientPhoto.mutateAsync(editPhotoFile);
      const mutationResult = await updateClient.mutateAsync(payload);
      const resultData = (mutationResult as { data?: { changed_fields?: string[] } } | undefined)?.data;
      const resultChanged = resultData?.changed_fields;
      if (Array.isArray(resultChanged) && resultChanged.length === 0) {
        toast("No fields actually changed", { icon: "ℹ️" });
      }
      closeEditModal();
    } catch {
      toast.error("Failed to update client");
    } finally {
      setEditSaving(false);
    }
  }, [editForm, editPhotoFile, client, updateClient, uploadClientPhoto, closeEditModal]);

  const handleRescheduleCheckin = useCallback(() => setShowScheduleModal(true), []);

  const handleCancelCheckin = useCallback(
    async (meeting: CheckinMeeting) => {
      const scheduledLabel = formatDate(meeting.scheduled_at, "EEE, MMM d · h:mm a");
      if (!confirm(`Cancel this ${meeting.type} meeting on ${scheduledLabel}?`)) return;
      try {
        await updateCheckinStatus.mutateAsync({ id: meeting.id, status: "cancelled" });
        if (activeChatId === `chat-${meeting.id}`) setActiveChatId(null);
      } catch {
        alert("Failed to cancel check-in. Please try again.");
      }
    },
    [activeChatId, updateCheckinStatus]
  );

  const completedCheckins = useMemo(
    () => (checkins ?? []).filter((c: any) => c.status === "completed").length,
    [checkins]
  );

  return {
    /* identifiers */
    id,
    /* data */
    client,
    isLoading,
    analytics,
    msgLoading,
    checkins,
    plans,
    nutrition,
    media,
    workoutLogs,
    workoutProgress,
    liveProgress,
    liveProgressLoading,
    /* messages */
    msg,
    setMsg,
    allMessages,
    pendingFile,
    setPendingFile,
    socketConnected,
    messagesEndRef,
    chatEndRef,
    /* sidebar */
    sidebarOpen,
    setSidebarOpen,
    copied,
    setCopied,
    newCode,
    /* tab */
    tab,
    setTab,
    TABS,
    /* schedule */
    showScheduleModal,
    closeScheduleModal,
    openScheduleModal,
    scheduleFilter,
    setScheduleFilter,
    activeChatId,
    setActiveChatId,
    /* plans / logs */
    expandedPlan,
    setExpandedPlan,
    expandedLog,
    setExpandedLog,
    completedDaysMap,
    /* delete modal */
    deleteModal,
    setDeleteModal,
    deleteError,
    setDeleteError,
    handleDeleteClient,
    handleConfirmDeleteClient,
    handleDeleteWorkout,
    handleConfirmDeleteWorkout,
    /* edit modal */
    editModal,
    editForm,
    setEditForm,
    editSaving,
    editPhotoFile,
    setEditPhotoFile,
    editPhotoPreview,
    setEditPhotoPreview,
    closeEditModal,
    handleOpenEdit,
    handleSaveEdit,
    /* handlers */
    handleSend,
    handleFileSelect,
    handleRegenerate,
    handleToggleBlockClient,
    handleRescheduleCheckin,
    handleCancelCheckin,
    /* mutation states */
    sendMsg,
    uploadMedia,
    regenerateCode,
    deleteClient,
    deleteWorkoutPlan,
    updateClient,
    blockClient,
    unblockClient,
    uploadClientPhoto,
    updateCheckinStatus,
    /* misc */
    completedCheckins,
    router,
    revokeBlobUrl,
  };
}
