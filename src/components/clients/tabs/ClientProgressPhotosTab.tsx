"use client";

import { Images } from "lucide-react";
import { useClientProgressPhotos } from "@/hooks/useProgressPhotos";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  clientId: string;
}

const TYPE_LABELS: Record<string, string> = {
  front: "Front",
  side: "Side",
  back: "Back",
};

export function ClientProgressPhotosTab({ clientId }: Props) {
  const { data: photos, isLoading } = useClientProgressPhotos(clientId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center py-12">
        <Images className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">
          No progress photos yet
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Photos uploaded by the client will appear here for comparison.
        </p>
      </div>
    );
  }

  const grouped = photos.reduce(
    (acc, photo) => {
      const type = photo.type || "other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(photo);
      return acc;
    },
    {} as Record<string, typeof photos>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Images className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)] dark:text-[#FAFAFA]">
          Progress Photos
        </h3>
        <span className="ml-auto text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          {photos.length} photos
        </span>
      </div>

      {Object.entries(grouped).map(([type, typePhotos]) => (
        <div key={type}>
          <h4 className="text-sm font-semibold text-[var(--text-secondary)] mb-3 capitalize">
            {TYPE_LABELS[type] || type} View
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {typePhotos.map((photo) => (
              <div
                key={photo.id}
                className="bg-[var(--bg-card)] border border-[var(--border)] dark:border-white/[0.07] rounded-xl overflow-hidden group"
              >
                <div className="relative aspect-[3/4]">
                  <img
                    src={photo.photo_url}
                    alt={`${photo.type} ${photo.label}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 capitalize">
                    {photo.label}
                  </span>
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                    {new Date(photo.taken_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
