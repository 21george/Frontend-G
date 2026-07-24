"use client";

import { useState } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { RoleBadge, StatusBadge } from "./RoleBadge";
import { DeactivateStaffModal } from "./DeactivateStaffModal";
import { useUpdateStaffRole } from "@/hooks/useStaff";
import { STAFF_ROLE_LABELS, type StaffMember, type StaffRole } from "@/types";
import { Ban } from "lucide-react";

const ROLES: StaffRole[] = [
  "admin",
  "manager",
  "front_desk",
  "instructor_coach",
];

interface Props {
  staff: StaffMember[];
}

export function StaffTable({ staff }: Props) {
  const updateRole = useUpdateStaffRole();
  const [toDeactivate, setToDeactivate] = useState<StaffMember | null>(null);

  const columns: Column<StaffMember>[] = [
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortFn: (a, b) => (a.name || a.email).localeCompare(b.name || b.email),
      render: (s) => (
        <div>
          <p className="font-medium text-[var(--text-primary)]">
            {s.name || "—"}
          </p>
          <p className="text-xs text-[var(--text-tertiary)]">{s.email}</p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      render: (s) =>
        s.status === "deactivated" ? (
          <RoleBadge role={s.role} />
        ) : (
          <select
            value={s.role}
            disabled={updateRole.isPending}
            onChange={(e) =>
              updateRole.mutate({ id: s.id, role: e.target.value as StaffRole })
            }
            className="px-2 py-1 text-xs border bg-white dark:bg-white/[0.04] text-[var(--text-primary)] border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-brand-700/30"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {STAFF_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        ),
    },
    {
      key: "status",
      header: "Status",
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: "invited_at",
      header: "Invited",
      sortable: true,
      sortFn: (a, b) =>
        new Date(a.invited_at ?? 0).getTime() -
        new Date(b.invited_at ?? 0).getTime(),
      render: (s) =>
        s.invited_at ? (
          <span className="text-sm text-[var(--text-secondary)]">
            {new Date(s.invited_at).toLocaleDateString()}
          </span>
        ) : (
          "—"
        ),
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      render: (s) =>
        s.status !== "deactivated" ? (
          <button
            onClick={() => setToDeactivate(s)}
            title="Deactivate"
            className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
          >
            <Ban className="w-4 h-4" />
            Deactivate
          </button>
        ) : null,
    },
  ];

  return (
    <>
      <DataTable
        data={staff}
        columns={columns}
        keyExtractor={(s) => s.id}
        searchable
        searchPlaceholder="Search staff…"
        searchFn={(s, q) =>
          `${s.name} ${s.email}`.toLowerCase().includes(q.toLowerCase())
        }
        emptyMessage="No staff members yet"
      />
      <DeactivateStaffModal
        staff={toDeactivate}
        allStaff={staff}
        onClose={() => setToDeactivate(null)}
      />
    </>
  );
}
