"use client";

import { AuthLayout } from "@/components/layout/AuthLayout";
import { CreateCheckinModal } from "@/components/CreateCheckinModal";
import { Calendar } from "lucide-react";
import { useState } from "react";
import { useClients, useCreateCheckin } from "@/lib/hooks";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [showCreate, setShowCreate] = useState(false);

  const { data: clientsData } = useClients();
  const clients = clientsData?.data ?? [];
  const createCheckin = useCreateCheckin();
  const queryClient = useQueryClient();

  const handleCreate = async (data: {
    client_id: string;
    scheduled_at: string;
    type: "video" | "call" | "chat";
    meeting_link?: string;
    notes?: string;
  }) => {
    try {
      await createCheckin.mutateAsync(data);
      toast.success("Check-in scheduled and client notified.");
      queryClient.invalidateQueries({ queryKey: ["checkins"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    } catch (error) {
      toast.error("Failed to schedule check-in. Please try again.");
      throw error;
    }
  };

  const quickActions = [
    {
      label: "Create Check-in",
      icon: Calendar,
      color:
        "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50",
      onClick: () => setShowCreate(true),
    },
  ];

  return (
    <AuthLayout showHeader={true} quickActions={quickActions}>
      {children}

      <CreateCheckinModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        clients={clients}
        onCreate={handleCreate}
      />
    </AuthLayout>
  );
}
