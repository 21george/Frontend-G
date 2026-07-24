"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useDeactivateStaff } from "@/hooks/useStaff";
import type { StaffMember } from "@/types";

interface Props {
  staff: StaffMember | null;
  allStaff: StaffMember[];
  onClose: () => void;
}

export function DeactivateStaffModal({ staff, allStaff, onClose }: Props) {
  const deactivate = useDeactivateStaff();
  const [reassignTo, setReassignTo] = useState<string>("owner");

  const otherActiveStaff = allStaff.filter(
    (s) => s.id !== staff?.id && s.status === "active",
  );

  const handleConfirm = () => {
    if (!staff) return;
    deactivate.mutate(
      { id: staff.id, reassign_to: reassignTo },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open={!!staff}
      onClose={onClose}
      size="sm"
      title="Deactivate staff member"
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-12 h-12 flex items-center justify-center mb-4 bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="w-6 h-6 text-red-500" />
        </div>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          {staff?.name || staff?.email} will lose access immediately. Any
          clients assigned to them as primary trainer will be reassigned below.
        </p>

        <div className="w-full text-left mb-6">
          <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
            Reassign their clients to
          </label>
          <select
            value={reassignTo}
            onChange={(e) => setReassignTo(e.target.value)}
            className="w-full px-3 py-2 text-sm border bg-white dark:bg-white/[0.04] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700"
          >
            <option value="owner">Organization owner</option>
            {otherActiveStaff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.email}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
            disabled={deactivate.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            className="flex-1"
            onClick={handleConfirm}
            loading={deactivate.isPending}
          >
            Deactivate
          </Button>
        </div>
      </div>
    </Modal>
  );
}
