'use client'

import { Modal } from '@/components/ui/Modal'

export type ScheduleMeetingType = 'call' | 'video' | 'chat'

export interface ScheduleForm {
  date: string
  time: string
  type: ScheduleMeetingType
  meeting_link: string
  notes: string
}

interface Props {
  open: boolean
  onClose: () => void
  checkinId: string | null
  form: ScheduleForm
  onFormChange: (updates: Partial<ScheduleForm>) => void
  onSubmit: () => void
  isSubmitting: boolean
}

const TYPE_OPTIONS: { value: ScheduleMeetingType; label: string }[] = [
  { value: 'video', label: 'Video Call' },
  { value: 'call',  label: 'Phone Call' },
  { value: 'chat',  label: 'Chat Session' },
]

const inputCls = 'w-full bg-[var(--bg-page)] border border-[var(--border)] px-3 py-2.5 text-[13px] text-[var(--text-primary)] outline-none focus:border-[var(--ring)] transition-colors placeholder:text-[var(--text-tertiary)]'
const labelCls = 'block text-[11px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)] mb-1.5'

export function ScheduleModal({ open, onClose, checkinId, form, onFormChange, onSubmit, isSubmitting }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={checkinId ? 'Reschedule Appointment' : 'Create Appointment'}>
      <div className="space-y-4">
        {/* Date & Time row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={form.date} onChange={e => onFormChange({ date: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Time</label>
            <input type="time" value={form.time} onChange={e => onFormChange({ time: e.target.value })} className={inputCls} />
          </div>
        </div>

        {/* Session type */}
        <div>
          <label className={labelCls}>Session Type</label>
          <div className="flex gap-2">
            {TYPE_OPTIONS.map(o => (
              <button key={o.value} onClick={() => onFormChange({ type: o.value })}
                className={`flex-1 py-2 text-[12px] font-semibold transition-colors border ${
                  form.type === o.value
                    ? 'bg-brand-600 border-brand-600 text-[var(--btn-text)]'
                    : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                }`}>
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Meeting link (video only) */}
        {form.type === 'video' && (
          <div>
            <label className={labelCls}>Meeting Link</label>
            <input value={form.meeting_link} onChange={e => onFormChange({ meeting_link: e.target.value })}
              placeholder="https://meet.jit.si/... (leave blank to auto-generate)"
              className={inputCls} />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className={labelCls}>Notes</label>
          <textarea value={form.notes} onChange={e => onFormChange({ notes: e.target.value })}
            placeholder="Session focus, preparation notes…"
            rows={3} className={`${inputCls} resize-none`} />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button onClick={onClose}
            className="flex-1 py-2.5 text-[13px] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors">
            Cancel
          </button>
          <button onClick={onSubmit} disabled={!form.date || !form.time || isSubmitting}
            className="flex-1 py-2.5 text-[13px] font-semibold bg-brand-600 hover:bg-brand-700 text-[var(--btn-text)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSubmitting ? 'Saving…' : checkinId ? 'Reschedule' : 'Create Appointment'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
