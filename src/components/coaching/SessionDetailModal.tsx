"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { CoachingSessionDetail } from "./CoachingSessionDetail";

export function SessionDetailModal() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();

  const open = (id: string) => setSessionId(id);
  const close = () => setSessionId(null);

  return (
    <>
      {sessionId && (
        <Modal
          open={!!sessionId}
          onClose={close}
          title="Session Details"
          size="xl"
        >
          <div className="max-h-[75vh] overflow-y-auto pr-1 -mr-1">
            <CoachingSessionDetail
              id={sessionId}
              onClose={close}
              onEnterVideoRoom={() => {
                close();
                router.push(`/coaching-sessions/${sessionId}`);
              }}
            />
          </div>
        </Modal>
      )}
    </>
  );
}

export function useSessionDetailModal() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const router = useRouter();

  return {
    sessionId,
    isOpen: !!sessionId,
    open: (id: string) => setSessionId(id),
    close: () => setSessionId(null),
    Modal: sessionId
      ? () => (
          <Modal open onClose={() => setSessionId(null)} title="Session Details" size="xl">
            <div className="max-h-[75vh] overflow-y-auto pr-1 -mr-1">
              <CoachingSessionDetail
                id={sessionId}
                onClose={() => setSessionId(null)}
                onEnterVideoRoom={() => {
                  setSessionId(null);
                  router.push(`/coaching-sessions/${sessionId}`);
                }}
              />
            </div>
          </Modal>
        )
      : () => null,
  };
}
