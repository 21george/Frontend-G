"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, UserPlus, Users } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStaffList } from "@/hooks/useStaff";
import { StaffTable } from "@/components/StaffTable";
import { InviteStaffModal } from "@/components/InviteStaffModal";

function TeamSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Skeleton className="h-8 w-48 rounded-lg" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}

export default function TeamSettingsPage() {
  const { data: staff, isLoading } = useStaffList();
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Settings
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Team
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Invite trainers, managers and front-desk staff to your
              organization and control what each of them can access.
            </p>
          </div>
          <Button onClick={() => setInviteOpen(true)}>
            <UserPlus className="w-4 h-4" />
            Invite Staff
          </Button>
        </div>

        {isLoading ? (
          <TeamSkeleton />
        ) : staff && staff.length > 0 ? (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden">
            <StaffTable staff={staff} />
          </div>
        ) : (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)]">
            <EmptyState
              icon={Users}
              title="No staff yet"
              description="You're currently the only member of your organization. Invite trainers, managers or front-desk staff to collaborate."
              action={
                <Button onClick={() => setInviteOpen(true)}>
                  <UserPlus className="w-4 h-4" />
                  Invite Staff
                </Button>
              }
            />
          </div>
        )}
      </div>

      <InviteStaffModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
      />
    </DashboardLayout>
  );
}
