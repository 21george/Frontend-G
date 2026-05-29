"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { subscriptionApi } from "@/lib/api/services/subscription";
import { useTrialReminder } from "@/hooks/useTrialReminder";
import {
  Clock,
  ArrowRight,
  X,
  Loader2,
} from "lucide-react";
import { safeRedirect } from "@/lib/validateUrl";

export function TrialReminderModal() {
  const router = useRouter();
  const { showReminder, daysLeft, trialEndsAt, dismiss } = useTrialReminder();
  const [isLoadingPortal, setIsLoadingPortal] = useState(false);

  if (!showReminder) return null;

  const handleUpgrade = () => {
    dismiss(24);
    router.push("/subscription/select-plan");
  };

  const handleManageBilling = async () => {
    setIsLoadingPortal(true);
    try {
      const data = await subscriptionApi.portal();
      if (data.portal_url) {
        safeRedirect(data.portal_url);
      }
    } catch {
      // Portal failed — fallback to select-plan
      router.push("/subscription/select-plan");
    } finally {
      setIsLoadingPortal(false);
    }
  };

  const handleDismiss = () => {
    dismiss(24);
  };

  const formattedDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const title =
    daysLeft === 0
      ? "Your free trial ends today"
      : daysLeft === 1
        ? "Your free trial ends tomorrow"
        : `Your free trial ends in ${daysLeft} days`;

  return (
    <Modal open={true} onClose={handleDismiss} title={title} size="md">
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 shrink-0 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-[var(--text-primary)]">
              Your trial expires on <strong>{formattedDate}</strong>. Upgrade now to
              keep unlimited access to all features.
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              After the trial ends, your account will be downgraded and some features
              may become unavailable.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={handleDismiss}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            <X className="w-4 h-4 mr-1" />
            Remind me later
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleManageBilling}
            disabled={isLoadingPortal}
            loading={isLoadingPortal}
          >
            {isLoadingPortal ? "Loading..." : "Manage Billing"}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleUpgrade}
          >
            Upgrade Now
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </Modal>
  );
}
