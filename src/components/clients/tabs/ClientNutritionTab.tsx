"use client";

import {
  Plus,
  Salad,
  Ruler,
  Weight,
  Target,
  Activity,
  Pencil,
  X,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { NutritionPlan, Client, AnalyticsData } from "@/types";
import { NutritionListCard } from "@/components/clients/NutritionListCard";
import { Modal } from "@/components/ui/Modal";
import { useStoreMeasurement } from "@/hooks";

interface Props {
  clientId: string;
  client: Client;
  nutrition: NutritionPlan[] | undefined;
  analytics: AnalyticsData | undefined;
  expandedPlan: string | null;
  setExpandedPlan: (id: string | null) => void;
}

/* ── Female silhouette SVG ─────────────────────────────────────────────── */
function FemaleSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 180 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Hair (bob cut) */}
      <path
        d="M72 32C72 18 84 8 98 8C112 8 124 18 124 32C124 38 120 44 114 46L110 48C108 42 104 38 98 38C92 38 88 42 86 48L82 46C76 44 72 38 72 32Z"
        fill="#F9FAFB"
        stroke="#374151"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Face outline */}
      <ellipse
        cx="98"
        cy="58"
        rx="17"
        ry="21"
        fill="#F9FAFB"
        stroke="#374151"
        strokeWidth="1.2"
      />
      {/* Left eye */}
      <path
        d="M90 56C91 54 93 54 94 56"
        stroke="#374151"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right eye */}
      <path
        d="M102 56C103 54 105 54 106 56"
        stroke="#374151"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      {/* Eyebrows */}
      <path
        d="M88 52C90 50 92 50 94 52"
        stroke="#374151"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M102 52C104 50 106 50 108 52"
        stroke="#374151"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Nose */}
      <path
        d="M98 60L97 65L99 65"
        stroke="#374151"
        strokeWidth="0.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Mouth */}
      <path
        d="M94 70C96 72 100 72 102 70"
        stroke="#374151"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Blush (subtle pink circles) */}
      <ellipse cx="88" cy="64" rx="3.5" ry="2" fill="#FCA5A5" opacity="0.35" />
      <ellipse cx="108" cy="64" rx="3.5" ry="2" fill="#FCA5A5" opacity="0.35" />

      {/* Neck */}
      <path
        d="M92 78L92 90C92 92 94 93 98 93C102 93 104 92 104 90L104 78"
        fill="#F9FAFB"
        stroke="#374151"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Shoulders / upper torso outline */}
      <path
        d="M92 90C76 94 64 100 60 110C56 120 58 132 62 140C66 148 74 152 84 154C88 155 92 156 98 156C104 156 108 155 112 154C122 152 130 148 134 140C138 132 140 120 136 110C132 100 120 94 104 90"
        fill="#F9FAFB"
        stroke="#374151"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Sports bra top (left cup) */}
      <path
        d="M76 118C78 126 86 130 94 128C98 127 98 122 96 118C94 114 88 112 82 114C78 115 76 116 76 118Z"
        fill="#EDE9FE"
        stroke="#8B5CF6"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Sports bra top (right cup) */}
      <path
        d="M120 118C118 126 110 130 102 128C98 127 98 122 100 118C102 114 108 112 114 114C118 115 120 116 120 118Z"
        fill="#EDE9FE"
        stroke="#8B5CF6"
        strokeWidth="0.8"
        opacity="0.5"
      />
      {/* Bra band */}
      <path
        d="M76 128C84 132 112 132 120 128"
        stroke="#8B5CF6"
        strokeWidth="0.8"
        opacity="0.4"
        fill="none"
      />

      {/* Torso / waist */}
      <path
        d="M84 154C80 162 78 172 78 182C78 190 80 196 86 198L98 200L110 198C116 196 118 190 118 182C118 172 116 162 112 154"
        fill="#F9FAFB"
        stroke="#374151"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Hips / pelvis */}
      <path
        d="M86 198C76 202 70 210 68 220C66 230 68 242 74 250C78 256 86 260 94 262L98 264L102 262C110 260 118 256 122 250C128 242 130 230 128 220C126 210 120 202 110 198"
        fill="#F9FAFB"
        stroke="#374151"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Left arm (bent, hand on hip) */}
      <path
        d="M60 110C52 118 48 130 50 142C52 154 58 164 66 168C70 170 74 170 78 168L82 166L80 170C78 174 76 178 76 182C76 186 78 190 82 192"
        stroke="#374151"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Right arm (down by side) */}
      <path
        d="M136 110C144 118 148 130 146 142C144 154 138 164 130 168C126 170 122 170 118 168L114 166L116 170C118 174 120 178 120 182C120 186 118 190 114 192"
        stroke="#374151"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Left leg */}
      <path
        d="M94 262C90 270 88 282 88 296C88 312 90 328 92 344C93 356 94 368 95 380C96 392 98 400 100 404C102 408 104 410 106 410C108 410 110 408 110 404C110 400 108 392 106 380C104 368 102 356 101 344C100 328 100 312 102 296C104 282 108 270 114 262"
        fill="#F9FAFB"
        stroke="#374151"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right leg */}
      <path
        d="M102 262C106 270 108 282 108 296C108 312 106 328 104 344C103 356 102 368 101 380C100 392 98 400 96 404C94 408 92 410 90 410C88 410 86 408 86 404C86 400 88 392 90 380C92 368 94 356 95 344C96 328 96 312 94 296C92 282 88 270 82 262"
        fill="#F9FAFB"
        stroke="#374151"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Measurement callout lines */}
      {/* Chest line */}
      <line
        x1="48"
        y1="120"
        x2="62"
        y2="120"
        stroke="#6B7280"
        strokeWidth="0.8"
        strokeDasharray="3 2"
      />
      <circle cx="46" cy="120" r="2" fill="#8B5CF6" opacity="0.6" />
      {/* Waist line */}
      <line
        x1="50"
        y1="178"
        x2="72"
        y2="178"
        stroke="#6B7280"
        strokeWidth="0.8"
        strokeDasharray="3 2"
      />
      <circle cx="48" cy="178" r="2" fill="#8B5CF6" opacity="0.6" />
      {/* Hip line */}
      <line
        x1="52"
        y1="232"
        x2="64"
        y2="232"
        stroke="#6B7280"
        strokeWidth="0.8"
        strokeDasharray="3 2"
      />
      <circle cx="50" cy="232" r="2" fill="#8B5CF6" opacity="0.6" />
      {/* Thigh line */}
      <line
        x1="58"
        y1="290"
        x2="82"
        y2="290"
        stroke="#6B7280"
        strokeWidth="0.8"
        strokeDasharray="3 2"
      />
      <circle cx="56" cy="290" r="2" fill="#8B5CF6" opacity="0.6" />
    </svg>
  );
}

/* ── Read-only measurement field (no border-radius) ─────────────────────── */
function MeasureField({
  label,
  value,
  unit,
  icon: Icon,
}: {
  label: string;
  value: string | number | undefined | null;
  unit: string;
  icon: React.ElementType;
}) {
  const display =
    value != null && value !== "" ? `${value} ${unit}` : `— ${unit}`;
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2.5 bg-[#F8F9FA] dark:bg-white/[0.04] border border-[#E9ECEF] dark:border-white/[0.06] px-3.5 py-2.5">
        <Icon
          className="w-4 h-4 text-[var(--text-tertiary)]"
          strokeWidth={1.5}
        />
        <span className="text-[13px] font-medium text-[var(--text-primary)]">
          {display}
        </span>
      </div>
    </div>
  );
}

/* ── Number input row inside modal ────────────────────────────────────── */
function NumberInput({
  label,
  value,
  onChange,
  unit,
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit: string;
  icon: React.ElementType;
}) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">
        {label}
      </label>
      <div className="flex items-center gap-2 bg-[#F8F9FA] dark:bg-white/[0.04] border border-[#E9ECEF] dark:border-white/[0.06] px-3 py-2">
        <Icon
          className="w-4 h-4 text-[var(--text-tertiary)]"
          strokeWidth={1.5}
        />
        <input
          type="number"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-[13px] font-medium text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)]"
          placeholder={`${unit}`}
        />
        <span className="text-[11px] text-[var(--text-tertiary)]">{unit}</span>
      </div>
    </div>
  );
}

export function ClientNutritionTab({
  clientId,
  client,
  nutrition,
  analytics,
  expandedPlan,
  setExpandedPlan,
}: Props) {
  const latestMeasurement = analytics?.measurements?.[0];

  const height = client.height_cm;
  const currentWeight =
    latestMeasurement?.weight_kg ?? client.current_weight_kg;
  const waist = latestMeasurement?.waist_cm;
  const chest = latestMeasurement?.chest_cm;
  const hips = latestMeasurement?.hips_cm;
  const arm = (latestMeasurement as any)?.arms_cm;
  const thigh =
    (latestMeasurement as any)?.legs_cm ?? (latestMeasurement as any)?.thigh_cm;

  /* ── Modal state ── */
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    weight_kg: currentWeight?.toString() ?? "",
    chest_cm: chest?.toString() ?? "",
    waist_cm: waist?.toString() ?? "",
    hips_cm: hips?.toString() ?? "",
    arms_cm: arm?.toString() ?? "",
    legs_cm: thigh?.toString() ?? "",
    body_fat_pct: "",
    notes: "",
  });

  const storeMutation = useStoreMeasurement(clientId);

  const openModal = () => {
    setForm({
      weight_kg: currentWeight?.toString() ?? "",
      chest_cm: chest?.toString() ?? "",
      waist_cm: waist?.toString() ?? "",
      hips_cm: hips?.toString() ?? "",
      arms_cm: arm?.toString() ?? "",
      legs_cm: thigh?.toString() ?? "",
      body_fat_pct: "",
      notes: "",
    });
    setOpen(true);
  };

  const update = (key: keyof typeof form, val: string) =>
    setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: import("@/lib/api/services/media").StoreMeasurementPayload =
      {
        ...(form.weight_kg !== "" && { weight_kg: parseFloat(form.weight_kg) }),
        ...(form.chest_cm !== "" && { chest_cm: parseFloat(form.chest_cm) }),
        ...(form.waist_cm !== "" && { waist_cm: parseFloat(form.waist_cm) }),
        ...(form.hips_cm !== "" && { hips_cm: parseFloat(form.hips_cm) }),
        ...(form.arms_cm !== "" && { arms_cm: parseFloat(form.arms_cm) }),
        ...(form.legs_cm !== "" && { legs_cm: parseFloat(form.legs_cm) }),
        ...(form.body_fat_pct !== "" && {
          body_fat_pct: parseFloat(form.body_fat_pct),
        }),
        ...(form.notes !== "" && { notes: form.notes }),
      };
    await storeMutation.mutateAsync(payload);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Body Measurements Panel */}
      <div className="bg-white dark:bg-[#121212] border border-[var(--border)] dark:border-white/[0.06] p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Ruler
              className="w-4 h-4 text-[var(--text-secondary)]"
              strokeWidth={1.5}
            />
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">
              Body measurements
            </h3>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            <Pencil size={13} /> Record
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10">
          {/* Silhouette */}
          <div className="flex-shrink-0 flex justify-center lg:justify-start">
            <div className="relative">
              <FemaleSilhouette className="h-[340px] w-auto" />
              <div className="absolute top-[105px] left-[62px] w-2 h-2 rounded-full bg-indigo-400/60" />
              <div className="absolute top-[155px] left-[58px] w-2 h-2 rounded-full bg-indigo-400/60" />
              <div className="absolute top-[195px] left-[60px] w-2 h-2 rounded-full bg-indigo-400/60" />
              <div className="absolute top-[235px] left-[58px] w-2 h-2 rounded-full bg-indigo-400/60" />
            </div>
          </div>

          {/* Measurements grid */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <MeasureField
                  label="Growth"
                  value={height}
                  unit="cm"
                  icon={Ruler}
                />
              </div>
              <MeasureField
                label="Current weight"
                value={currentWeight}
                unit="kg"
                icon={Weight}
              />
              <MeasureField
                label="Desired weight"
                value={undefined}
                unit="kg"
                icon={Target}
              />
              <MeasureField
                label="Waist circumference"
                value={waist}
                unit="cm"
                icon={Ruler}
              />
              <MeasureField
                label="Chest circumference"
                value={chest}
                unit="cm"
                icon={Ruler}
              />
              <MeasureField
                label="Thigh circumference"
                value={thigh}
                unit="cm"
                icon={Ruler}
              />
              <MeasureField
                label="Arm circumference"
                value={arm}
                unit="cm"
                icon={Ruler}
              />
            </div>

            <div className="mt-5 pt-5 border-t border-[var(--border)] dark:border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-primary)] mb-2">
                  Set your nutritional goals
                </label>
                <div className="flex items-center gap-2.5 bg-[#F8F9FA] dark:bg-white/[0.04] border border-[#E9ECEF] dark:border-white/[0.06] px-3.5 py-2.5">
                  <Target
                    className="w-4 h-4 text-[var(--text-tertiary)]"
                    strokeWidth={1.5}
                  />
                  <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1 truncate">
                    Not set
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-primary)] mb-2">
                  Define your activity level
                </label>
                <div className="flex items-center gap-2.5 bg-[#F8F9FA] dark:bg-white/[0.04] border border-[#E9ECEF] dark:border-white/[0.06] px-3.5 py-2.5">
                  <Activity
                    className="w-4 h-4 text-[var(--text-tertiary)]"
                    strokeWidth={1.5}
                  />
                  <span className="text-[13px] font-medium text-[var(--text-primary)] flex-1 truncate">
                    Not set
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Record Measurements Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Record Measurements"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput
              label="Current weight"
              value={form.weight_kg}
              onChange={(v) => update("weight_kg", v)}
              unit="kg"
              icon={Weight}
            />
            <NumberInput
              label="Chest circumference"
              value={form.chest_cm}
              onChange={(v) => update("chest_cm", v)}
              unit="cm"
              icon={Ruler}
            />
            <NumberInput
              label="Waist circumference"
              value={form.waist_cm}
              onChange={(v) => update("waist_cm", v)}
              unit="cm"
              icon={Ruler}
            />
            <NumberInput
              label="Hip circumference"
              value={form.hips_cm}
              onChange={(v) => update("hips_cm", v)}
              unit="cm"
              icon={Ruler}
            />
            <NumberInput
              label="Arm circumference"
              value={form.arms_cm}
              onChange={(v) => update("arms_cm", v)}
              unit="cm"
              icon={Ruler}
            />
            <NumberInput
              label="Thigh circumference"
              value={form.legs_cm}
              onChange={(v) => update("legs_cm", v)}
              unit="cm"
              icon={Ruler}
            />
            <NumberInput
              label="Body fat %"
              value={form.body_fat_pct}
              onChange={(v) => update("body_fat_pct", v)}
              unit="%"
              icon={Activity}
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              className="w-full bg-[#F8F9FA] dark:bg-white/[0.04] border border-[#E9ECEF] dark:border-white/[0.06] px-3 py-2 text-[13px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-tertiary)] resize-none"
              placeholder="Optional notes..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-[13px] font-medium text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-subtle)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={storeMutation.isPending}
              className="px-4 py-2 text-[13px] font-medium bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {storeMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Save Measurements
            </button>
          </div>
        </form>
      </Modal>

      {/* Existing Nutrition Plans */}
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-[var(--text-primary)] dark:text-[var(--text-primary)]">
          Nutrition Plans
        </h3>
        <Link
          href={`/nutrition-plans/new?client=${clientId}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold bg-brand-600 text-white transition-colors"
        >
          <Plus size={13} /> New Plan
        </Link>
      </div>

      {(nutrition ?? []).length === 0 ? (
        <div className="dark:bg-transparent p-12 text-center">
          <Salad className="w-10 h-10 mx-auto mb-3 text-[var(--text-secondary)]" />
          <p className="text-[13px] text-[var(--text-tertiary)]">
            No nutrition plans yet
          </p>
        </div>
      ) : (
        (nutrition ?? []).map((plan) => (
          <NutritionListCard
            key={plan.id}
            plan={plan}
            expanded={expandedPlan === plan.id}
            onToggle={() =>
              setExpandedPlan(expandedPlan === plan.id ? null : plan.id)
            }
          />
        ))
      )}
    </div>
  );
}
