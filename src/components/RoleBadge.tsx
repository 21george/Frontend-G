import { Badge } from "@/components/ui/Badge";
import type { StaffRole, StaffStatus } from "@/types";
import { STAFF_ROLE_LABELS } from "@/types";

export function RoleBadge({ role }: { role: StaffRole }) {
  return <Badge variant="blue">{STAFF_ROLE_LABELS[role]}</Badge>;
}

const STATUS_VARIANT: Record<StaffStatus, "green" | "yellow" | "gray"> = {
  active: "green",
  invited: "yellow",
  deactivated: "gray",
};

const STATUS_LABEL: Record<StaffStatus, string> = {
  active: "Active",
  invited: "Invited",
  deactivated: "Deactivated",
};

export function StatusBadge({ status }: { status: StaffStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
