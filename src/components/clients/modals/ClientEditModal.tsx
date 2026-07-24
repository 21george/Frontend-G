"use client";

import { motion } from "framer-motion";
import { X, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  client: any;
  editForm: {
    name: string;
    email: string;
    phone: string;
    gender: "" | "male" | "female" | "other";
    date_of_birth: string;
    city: string;
    address: string;
    notes: string;
    current_weight_kg: string;
    height_cm: string;
    nationality: string;
    occupation: string;
    sickness: string;
  };
  setEditForm: React.Dispatch<
    React.SetStateAction<{
      name: string;
      email: string;
      phone: string;
      gender: "" | "male" | "female" | "other";
      date_of_birth: string;
      city: string;
      address: string;
      notes: string;
      current_weight_kg: string;
      height_cm: string;
      nationality: string;
      occupation: string;
      sickness: string;
    }>
  >;
  editSaving: boolean;
  editPhotoPreview: string | null;
  onClose: () => void;
  onSave: () => void;
  onPhotoSelect: (file: File) => void;
}

export function ClientEditModal({
  open,
  client,
  editForm,
  setEditForm,
  editSaving,
  editPhotoPreview,
  onClose,
  onSave,
  onPhotoSelect,
}: Props) {
  if (!open || !client) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !editSaving && onClose()}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-[var(--bg-card)] border border-[var(--border)] w-full max-w-lg rounded-xl p-4 sm:p-6 shadow-xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-0"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-5">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">
            Edit Client
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {/* Profile Photo */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {editPhotoPreview || client?.profile_photo_url ? (
                <img
                  src={editPhotoPreview || client?.profile_photo_url}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border border-[var(--border)]"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[var(--bg-subtle)] border border-[var(--border)] flex items-center justify-center text-[var(--text-tertiary)] text-xs font-semibold">
                  {editForm.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Profile Photo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onPhotoSelect(file);
                }}
                className="mt-1 block w-full text-xs text-[var(--text-secondary)] file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[var(--bg-subtle)] file:text-[var(--text-primary)] hover:file:bg-[var(--border)] cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Name *
            </label>
            <input
              value={editForm.name}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, name: e.target.value }))
              }
              className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                value={editForm.email}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, email: e.target.value }))
                }
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Phone
              </label>
              <input
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, phone: e.target.value }))
                }
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Gender
              </label>
              <select
                value={editForm.gender}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    gender: e.target.value as any,
                  }))
                }
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
              >
                <option value="">Select gender…</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Date of Birth
              </label>
              <input
                type="date"
                value={editForm.date_of_birth}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    date_of_birth: e.target.value,
                  }))
                }
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                City
              </label>
              <input
                value={editForm.city}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, city: e.target.value }))
                }
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Address
              </label>
              <input
                value={editForm.address}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, address: e.target.value }))
                }
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={editForm.current_weight_kg}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    current_weight_kg: e.target.value,
                  }))
                }
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Height (cm)
              </label>
              <input
                type="number"
                value={editForm.height_cm}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, height_cm: e.target.value }))
                }
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Nationality
              </label>
              <input
                value={editForm.nationality}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    nationality: e.target.value,
                  }))
                }
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                Occupation
              </label>
              <input
                value={editForm.occupation}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, occupation: e.target.value }))
                }
                className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Health Conditions
            </label>
            <input
              value={editForm.sickness}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, sickness: e.target.value }))
              }
              className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
              Notes
            </label>
            <textarea
              value={editForm.notes}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, notes: e.target.value }))
              }
              rows={3}
              className="w-full mt-1 px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--energy)]/20 focus:border-[var(--energy)]/30 resize-none"
            />
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 mt-5 sm:mt-6 pt-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            disabled={editSaving}
            className="px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] border border-[var(--border)] rounded-lg hover:bg-[var(--bg-subtle)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={editSaving}
            className="px-4 py-2.5 bg-[var(--btn-bg)] text-[var(--btn-text)] text-sm font-medium hover:bg-[var(--btn-hover)] transition-colors disabled:opacity-50 rounded-lg flex items-center justify-center gap-1.5"
          >
            {editSaving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : null}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
