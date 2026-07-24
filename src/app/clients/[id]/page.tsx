"use client";

import {
  ArrowLeft,
  Check,
  X,
  Menu,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ClientDetailSidebar,
  ClientWorkoutsTab,
  ClientNutritionTab,
  ClientAnalyticsTab,
  ClientMessagesTab,
  ClientScheduleTab,
  PlanAnalysisTab,
  BodyAnalysisTab,
  ClientAdherenceTab,
  PredictionWidget,
  ScheduleModal,
  DeleteConfirmModal,
  ClientEditModal,
} from "@/components/clients";
import { useClientDetailPage } from "@/hooks/useClientDetailPage";

export default function ClientDetailPage() {
  const {
    id,
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
    msg,
    setMsg,
    allMessages,
    pendingFile,
    setPendingFile,
    socketConnected,
    messagesEndRef,
    chatEndRef,
    sidebarOpen,
    setSidebarOpen,
    copied,
    setCopied,
    newCode,
    tab,
    setTab,
    TABS,
    showScheduleModal,
    closeScheduleModal,
    openScheduleModal,
    scheduleFilter,
    setScheduleFilter,
    activeChatId,
    setActiveChatId,
    expandedPlan,
    setExpandedPlan,
    expandedLog,
    setExpandedLog,
    completedDaysMap,
    deleteModal,
    setDeleteModal,
    deleteError,
    setDeleteError,
    handleDeleteClient,
    handleConfirmDeleteClient,
    handleConfirmDeleteWorkout,
    editModal,
    editForm,
    setEditForm,
    editSaving,
    editPhotoPreview,
    closeEditModal,
    handleOpenEdit,
    handleSaveEdit,
    handleSend,
    handleFileSelect,
    handleRegenerate,
    handleToggleBlockClient,
    handleRescheduleCheckin,
    handleCancelCheckin,
    sendMsg,
    uploadMedia,
    regenerateCode,
    deleteClient,
    deleteWorkoutPlan,
    updateClient,
    blockClient,
    unblockClient,
    updateCheckinStatus,
    completedCheckins,
    setEditPhotoFile,
    setEditPhotoPreview,
    revokeBlobUrl,
  } = useClientDetailPage();

  if (isLoading)
    return (
      <div className="flex flex-col bg-[var(--bg-page)] dark:bg-[var(--bg-page)] min-h-[calc(100vh-4rem)]">
        <Skeleton className="h-11 w-full rounded-none border-b border-[var(--border)] dark:border-white/[0.06]" />
        <div className="flex flex-1">
          <Skeleton className="hidden md:block w-[300px] rounded-none border-r border-[var(--border)] dark:border-white/[0.06]" />
          <div className="flex-1 p-4 sm:p-6 space-y-4">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );

  if (!client)
    return (
      <div className="flex items-center justify-center bg-[var(--bg-page)] dark:bg-[var(--bg-page)] min-h-[calc(100vh-4rem)]">
        <p className="text-slate-500 text-sm">Client not found.</p>
      </div>
    );

  return (
    <>
      <div className="flex flex-col bg-[var(--bg-page)] dark:bg-[var(--bg-page)] min-h-[calc(100vh-4rem)]">
        {/* ── Breadcrumb bar ─────────────────────────────────────── */}
        <div className="flex items-center justify-between px-3 sm:px-5 h-11 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-1 -ml-1 text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <Menu size={16} />
            </button>
            <Link
              href="/clients"
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors flex-shrink-0"
            >
              <ArrowLeft size={13} />
              <span className="hidden sm:inline">Clients</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline" />
            <span className="text-slate-700 dark:text-slate-300 truncate">
              {client.name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleToggleBlockClient}
              disabled={blockClient.isPending || unblockClient.isPending}
              title={
                client.is_blocked
                  ? "Restore client access"
                  : client.active
                    ? "Temporarily disable client access"
                    : "Restore client access"
              }
              className={`inline-flex items-center gap-1.5 border rounded-lg px-2 sm:px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                client.is_blocked || !client.active
                  ? "border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                  : "border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10"
              }`}
            >
              {blockClient.isPending || unblockClient.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : client.is_blocked || !client.active ? (
                <Check size={13} />
              ) : (
                <X size={13} />
              )}
              <span className="hidden sm:inline">
                {client.is_blocked
                  ? "Unblock"
                  : !client.active
                    ? "Restore Access"
                    : "Block Access"}
              </span>
            </button>
            <button
              onClick={handleOpenEdit}
              disabled={updateClient.isPending}
              title="Edit client information"
              className="inline-flex items-center gap-1.5 border border-[var(--border)] dark:border-white/[0.07] rounded-lg px-2 sm:px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-50"
            >
              <Pencil size={13} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={handleDeleteClient}
              disabled={deleteClient.isPending}
              title="Permanently delete this client (cannot be undone)"
              className="inline-flex items-center gap-1.5 border border-red-200 dark:border-red-900/40 rounded-lg px-2 sm:px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {deleteClient.isPending ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Trash2 size={13} />
              )}
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Left panel — sidebar */}
          <ClientDetailSidebar
            client={client}
            sidebarOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            newCode={newCode}
            copied={copied}
            onCopied={() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            media={media}
            plans={plans}
            nutrition={nutrition}
            analytics={analytics}
            checkins={checkins}
            completedCheckins={completedCheckins}
            onRegenerate={handleRegenerate}
            isRegenerateLoading={regenerateCode.isPending}
            onToggleBlock={handleToggleBlockClient}
            isBlockPending={blockClient.isPending}
            isUnblockPending={unblockClient.isPending}
            onDeleteClient={handleDeleteClient}
            isDeletePending={deleteClient.isPending}
            onEditClient={handleOpenEdit}
          />

          {/* ══════════ RIGHT PANEL ══════════ */}
          <main className="flex-1 flex flex-col overflow-hidden relative bg-[var(--bg-page)] dark:bg-[#060d10]">
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none opacity-0 dark:opacity-[0.04]"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse 80% 50% at 20% 40%, #a3e635 0%, transparent 60%), radial-gradient(ellipse 60% 70% at 80% 80%, #22d3ee 0%, transparent 55%)",
              }}
            />

            <div className="flex-1 overflow-y-auto relative z-10">
              {/* Tab navigation */}
              <div className="sticky top-0 z-20 flex items-center border-b border-[var(--border)] dark:border-white/[0.06] bg-[var(--bg-card)]/90 dark:bg-[#0a1114]/90 backdrop-blur-xl px-2 sm:px-5 overflow-x-auto scrollbar-hide shadow-[0_2px_16px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.4)]">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--energy)]/30 dark:via-[#a3e635]/20 to-transparent"
                />
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={`relative px-3 sm:px-4 py-2.5 sm:py-3 text-[11px] sm:text-[12px] font-bold whitespace-nowrap transition-all ${
                      tab === key
                        ? "text-[var(--energy)] dark:text-[#a3e635]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] dark:text-white/30 dark:hover:text-white/60"
                    }`}
                    style={{
                      fontFamily: "var(--font-mono)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {label}
                    {tab === key && (
                      <motion.div
                        layoutId="activeClientTab"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-[var(--energy)] dark:bg-[#a3e635] rounded-full"
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="p-3 sm:p-6 space-y-4">
                {tab === "workouts" && (
                  <ClientWorkoutsTab
                    clientId={id}
                    plans={plans}
                    workoutProgress={workoutProgress}
                    workoutLogs={workoutLogs}
                    liveProgress={liveProgress}
                    liveProgressLoading={liveProgressLoading}
                    completedDaysMap={completedDaysMap}
                    expandedPlan={expandedPlan}
                    setExpandedPlan={setExpandedPlan}
                    expandedLog={expandedLog}
                    setExpandedLog={setExpandedLog}
                  />
                )}

                {tab === "nutrition" && (
                  <ClientNutritionTab
                    clientId={id}
                    nutrition={nutrition}
                    expandedPlan={expandedPlan}
                    setExpandedPlan={setExpandedPlan}
                  />
                )}

                {tab === "body" && <BodyAnalysisTab clientId={id} />}
                {tab === "adherence" && <ClientAdherenceTab clientId={id} />}
                {tab === "prediction" && <PredictionWidget clientId={id} />}

                {tab === "analytics" && (
                  <ClientAnalyticsTab analytics={analytics} client={client} />
                )}

                {tab === "plan-analysis" && <PlanAnalysisTab clientId={id} />}

                {tab === "messages" && (
                  <ClientMessagesTab
                    client={client}
                    allMessages={allMessages}
                    msg={msg}
                    setMsg={setMsg}
                    onSend={handleSend}
                    isSendPending={sendMsg.isPending}
                    isUploadPending={uploadMedia.isPending}
                    pendingFile={pendingFile}
                    onClearPendingFile={() => setPendingFile(null)}
                    onFileSelect={handleFileSelect}
                    socketConnected={socketConnected}
                    msgLoading={msgLoading}
                    messagesEndRef={messagesEndRef}
                  />
                )}

                {tab === "checkins" && (
                  <ClientScheduleTab
                    client={client}
                    checkins={checkins}
                    scheduleFilter={scheduleFilter}
                    setScheduleFilter={setScheduleFilter}
                    activeChatId={activeChatId}
                    setActiveChatId={setActiveChatId}
                    allMessages={allMessages}
                    msg={msg}
                    setMsg={setMsg}
                    onSend={handleSend}
                    chatEndRef={chatEndRef}
                    socketConnected={socketConnected}
                    isDeleteCheckinPending={updateCheckinStatus.isPending}
                    onOpenScheduleModal={openScheduleModal}
                    onReschedule={handleRescheduleCheckin}
                    onCancel={handleCancelCheckin}
                  />
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Modals */}
      <ScheduleModal open={showScheduleModal} onClose={closeScheduleModal} clientId={id} />

      <DeleteConfirmModal
        open={deleteModal.open}
        type={deleteModal.type}
        clientName={client?.name ?? ""}
        planTitle={deleteModal.item?.title}
        onClose={() => {
          setDeleteError(null);
          setDeleteModal({ open: false, type: "client" });
        }}
        onConfirm={
          deleteModal.type === "client"
            ? handleConfirmDeleteClient
            : handleConfirmDeleteWorkout
        }
        isLoading={deleteClient.isPending || deleteWorkoutPlan.isPending}
        error={deleteError}
      />

      <ClientEditModal
        open={editModal}
        client={client}
        editForm={editForm}
        setEditForm={setEditForm}
        editSaving={editSaving}
        editPhotoPreview={editPhotoPreview}
        onClose={closeEditModal}
        onSave={handleSaveEdit}
        onPhotoSelect={(file) => {
          revokeBlobUrl(editPhotoPreview);
          setEditPhotoFile(file);
          setEditPhotoPreview(URL.createObjectURL(file));
        }}
      />
    </>
  );
}
