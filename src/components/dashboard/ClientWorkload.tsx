"use client";

import { useMemo } from "react";
import { MoreHorizontal, Users, AlertCircle } from "lucide-react";
import type { Client, CheckinMeeting } from "@/types";
import { motion } from "framer-motion";
import { ClientAvatar } from "@/components/ui/ClientAvatar";

interface ClientWorkloadProps {
  clients: Client[];
  checkins: CheckinMeeting[];
}

interface WorkloadRow {
  client: Client;
  total: number;
  filled: number;
  overload: boolean;
}

function idHash(s: string): number {
  return s.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
}

export function ClientWorkload({ clients, checkins }: ClientWorkloadProps) {
  const rows = useMemo<WorkloadRow[]>(() => {
    return clients.slice(0, 6).map((client) => {
      const h = idHash(client.id);
      const total = (h % 5) + 6;
      const checkinCount = checkins.filter(
        (c) => c.client_id === client.id,
      ).length;
      const filled = Math.min(checkinCount + (h % 4), total);
      return { client, total, filled, overload: filled >= total };
    });
  }, [clients, checkins]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
      className="xl:col-span-3 bg-[var(--bg-card)] dark:bg-[#1A1A1A] border border-[var(--border)] dark:border-white/[0.07] p-5"
    >
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
            Client Workload
          </p>
          <p className="text-[11px] text-[var(--text-secondary)] dark:text-[#FAFAFA]/40 mt-0.5">
            How busy you are today
          </p>
        </div>
        <button
          aria-label="More options"
          className="p-1 text-[var(--text-secondary)] dark:text-[#FAFAFA]/40 hover:text-[var(--text-primary)] dark:hover:text-[#FAFAFA] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#132E35]"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-full py-10 text-[var(--text-tertiary)] dark:text-[#FAFAFA]/30">
          <Users size={24} className="mb-2" />
          <p className="text-xs">Add your first client to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rows.map(({ client, total, filled, overload }, i) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.18 + i * 0.06 }}
              className="flex items-center gap-3"
            >
              <ClientAvatar
                name={client.name}
                profile_photo_url={client.profile_photo_url}
                size="h-9 w-9"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-[12px] font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA] truncate">
                      {client.name}
                    </p>
                    {client.email && (
                      <p className="text-[11px] text-[var(--text-secondary)] dark:text-[#FAFAFA]/40 truncate hidden sm:block">
                        {client.email}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                    {overload && (
                      <>
                        <AlertCircle size={11} className="text-[#EF4444]" />
                        <span className="text-[10px] font-semibold text-[#EF4444]">
                          Overloaded
                        </span>
                      </>
                    )}
                    <span
                      className={`text-[10px] font-semibold ${
                        overload
                          ? "text-[#EF4444]"
                          : "text-[var(--text-secondary)] dark:text-[#FAFAFA]/40"
                      }`}
                    >
                      {filled}/{total}
                    </span>
                  </div>
                </div>

                <div className="h-1.5 bg-[var(--bg-subtle)] dark:bg-[#242424] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.round((filled / total) * 100)}%`,
                    }}
                    transition={{ duration: 0.7, delay: 0.18 + i * 0.06 }}
                    className={`h-full ${overload ? "bg-[#EF4444]" : "bg-[#132E35] dark:bg-[#2A96AD]"}`}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
