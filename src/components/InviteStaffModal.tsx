"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { FormField, TextInput } from "@/components/ui/FormField";
import { useInviteStaff } from "@/hooks/useStaff";
import {
  STAFF_ROLE_LABELS,
  STAFF_ROLE_DESCRIPTIONS,
  type StaffRole,
} from "@/types";

const ROLES: StaffRole[] = [
  "admin",
  "manager",
  "front_desk",
  "instructor_coach",
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function InviteStaffModal({ open, onClose }: Props) {
  const invite = useInviteStaff();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<StaffRole>("instructor_coach");
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("instructor_coach");
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    setError(null);
    invite.mutate(
      { email: email.trim(), role, name: name.trim() || undefined },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite a staff member"
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField label="Name">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Doe"
          />
        </FormField>

        <FormField label="Email" required error={error ?? undefined}>
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="jane@example.com"
            error={!!error}
          />
        </FormField>

        <FormField label="Role" required>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffRole)}
            className="w-full px-3 py-2 text-sm border bg-white dark:bg-white/[0.04] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {STAFF_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            {STAFF_ROLE_DESCRIPTIONS[role]}
          </p>
        </FormField>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={handleClose}
            disabled={invite.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" loading={invite.isPending}>
            Send Invite
          </Button>
        </div>
      </form>
    </Modal>
  );
}
